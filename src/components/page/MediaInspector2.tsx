import React, { useState, useEffect, useRef, useMemo } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import throttle from 'lodash/throttle';



import {
    Upload,
    Input,
    Tag,
    Table,
    Checkbox,
    Button,
    Tooltip,
    Select,
    Progress,
    Card,
    Row,
    Col,
    Typography,
    Dropdown,
    Divider,
    Spin
} from "antd";
import { InboxOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

type RowData = { [key: string]: any; media?: string; remark?: string };

const CHUNK_SIZE = 20;
const { Dragger } = Upload;
const { Search } = Input;
const { Title } = Typography;

const columnGroups: Record<string, string[]> = {
    advertiser: [
        "VISIT_ID", "ADVERTISER_ID", "ADVERTISER_NAME", "ADVERTISER_DOMAIN",
        "ADVERTISER_MAIN_CATEGORY", "ADVERTISER_SECOND_CATEGORY",
        "MASTER_BRAND", "BRAND", "SUBBRAND",
    ],
    publisher: [
        "CHANNEL_NAME", "PUBLISHER_ID", "PUBLISHER_NAME", "PUBLISHER_CATEGORY",
        "PUBLISHER_DOMAIN", "YT_CHANNEL_NAME", "PUBLISHER_URL_ID", "PUBLISHER_URL",
    ],
    creative: [
        "CREATIVE_ID", "CREATIVE_LANDINGPAGE_URL", "CREATIVE_LANDINGPAGE_KEYWORDS",
        "CREATIVE_CAMPAIGN_NAME", "CREATIVE_CAMPAIGN_ID", "CREATIVE_SIGNATURE",
        "CREATIVE_FIRST_SEEN_DATE", "CREATIVE_MIME_TYPE", "CREATIVE_WIDTH",
        "CREATIVE_HEIGHT", "CREATIVE_SIZE", "CREATIVE_URL_SUPPLIER",
        "CREATIVE_INVENTORY_TYPE", "SOCIAL_AD_PLACEMENT", "CREATIVE_VIDEO_TITLE",
        "CREATIVE_VIDEO_DURATION", "DAISY_CHAIN", "CLICK_CHAIN", "TRANSACTION_METHOD",
    ],
    occurrence: [
        "OCCURENCE_VISIBILITY", "OCCURENCE_COLLECTIONDATE", "OCCURENCE_COLLECTIONTIME",
        "OCCURENCE_USER_DEVICE", "OCCURENCE_USER_APP_TYPE", "OCCURENCE_AD_POSITION_X",
        "OCCURENCE_AD_POSITION_Y", "OCCURENCE_VIDEO_POSITION", "OCCURENCE_VIDEO_SKIPPABLE",
        "OCCURENCE_VIDEO_CONTENT_TITLE", "OCCURENCE_VIDEO_CONTENT_DURATION",
        "OCCURENCE_USER_AGENT", "OCCURENCE_UNIQUES",
    ],
    youtube: [
        "YOUTUBE_SOURCE_VIDEO_DURATION_SEC", "YOUTUBE_AD_PUBLISHED_DATE",
        "YOUTUBE_AD_CATEGORY_NAME", "YOUTUBE_AD_VIDEO_TITLE", "VIDEO_URL",
    ],
    social: [
        "SOCIAL_PAGE_LINK", "SOCIAL_PAGE_NAME", "SOCIAL_CAMPAIGN_TEXT",
        "SOCIAL_CAMPAIGN_TEXT_LINKS", "SOCIAL_HEADLINE_LINK", "SOCIAL_HEADLINE_TEXT",
        "SOCIAL_DESCRIPTION", "SOCIAL_CTA_BUTTON_TEXT", "SOCIAL_CTA_LINK",
    ],
    metrics: ["IMPRESSIONS", "SPEND"],
};

const groupColors: Record<string, string> = {
    country: "#FFF5F5",
    advertiser: "#F0FFF4",
    publisher: "#F0F9FF",
    creative: "#FFFAF0",
    occurrence: "#F5FAF7",
    youtube: "#FEF9E7",
    social: "#FDF2FF",
    metrics: "#F9F9F9",
};
const getSortedColoredColumns = (allKeys: string[]) => {
    const sortedColumns: any[] = [];

    for (const [group, keys] of Object.entries(columnGroups)) {
        for (const key of keys) {
            if (allKeys.includes(key)) {
                sortedColumns.push({
                    title: key,
                    dataIndex: key,
                    key,

                    sorter: true, // ✅ Enable sorting for all columns
                    onCell: () => ({
                        style: {
                            backgroundColor: groupColors[group],
                            whiteSpace: 'normal',   // ✅ Allow line wrapping
                            wordBreak: 'break-word' // ✅ Prevent long words from overflowing
                        },
                    }),
                });
            }
        }
    }

    return sortedColumns;
};



const MediaInspectorV2: React.FC = () => {
    // --- State ---
    const [allData, setAllData] = useState<RowData[]>([]);
    const [visibleData, setVisibleData] = useState<RowData[]>([]);
    const [currentChunk, setCurrentChunk] = useState(1);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileUploaded, setFileUploaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        "BRAND",
        "ADVERTISER_NAME",
        "CREATIVE_LANDINGPAGE_URL",
        "SOCIAL_CAMPAIGN_TEXT",
        "CREATIVE_URL_SUPPLIER"
    ]);





    const [filterFaulty, setFilterFaulty] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const baseKeys = Object.keys(visibleData[0] || {}).filter((key) => !["media", "remark", "isFaulty"].includes(key));

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [exportMode, setExportMode] = useState<"with-media" | "without-media">("without-media");

    const [searchInput, setSearchInput] = useState("");
    const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

    const [advertiserData, setAdvertiserData] = useState<{ id: string; value: number }[]>([]);
    const [campaignData, setCampaignData] = useState<{ id: string; value: number }[]>([]);
    const [isLazyLoading, setIsLazyLoading] = useState(false);


    // --- Derived Data & Effects ---
    const totalRows = allData.length;
    const faultyRows = allData.filter((r) => r.isFaulty).length;

    const hasImpressions = allData[0] && "IMPRESSIONS" in allData[0];
    const totalImpressions = hasImpressions
        ? allData.reduce((sum, r) => sum + (parseFloat(r.IMPRESSIONS) || 0), 0)
        : 0;
    const faultyImpressions = hasImpressions
        ? allData.filter((r) => r.isFaulty).reduce((sum, r) => sum + (parseFloat(r.IMPRESSIONS) || 0), 0)
        : 0;
    const faultyPercentage = totalRows ? ((faultyRows / totalRows) * 100).toFixed(2) : "0";
    const impressionPercentage = totalImpressions ? ((faultyImpressions / totalImpressions) * 100).toFixed(2) : null;

    useEffect(() => {
        const adv: Record<string, number> = {};
        const cmp: Record<string, number> = {};
        allData.forEach((r) => {
            r.ADVERTISER_NAME && (adv[r.ADVERTISER_NAME] = (adv[r.ADVERTISER_NAME] || 0) + 1);
            r.CREATIVE_CAMPAIGN_NAME && (cmp[r.CREATIVE_CAMPAIGN_NAME] = (cmp[r.CREATIVE_CAMPAIGN_NAME] || 0) + 1);
        });
        setAdvertiserData(Object.entries(adv).map(([id, value]) => ({ id, value })));
        setCampaignData(Object.entries(cmp).map(([id, value]) => ({ id, value })));
    }, [allData]);

    // Filtering & Sorting
    const keywordFiltered = allData
        .map((row, idx) => ({ row, originalIndex: idx }))
        .filter(({ row }) =>
            searchKeywords.every((kw) =>
                Object.values(row)
                    .filter((v) => typeof v === "string" || typeof v === "number")
                    .join(" ")
                    .toLowerCase()
                    .includes(kw.toLowerCase())
            )
        );

    const filteredData = filterFaulty
        ? keywordFiltered.filter(({ row }) => row.isFaulty)
        : keywordFiltered;

    const sortedData = sortConfig
        ? [...filteredData].sort((a, b) => {
            const av = a.row[sortConfig.key] ?? "";
            const bv = b.row[sortConfig.key] ?? "";
            return av < bv
                ? sortConfig.direction === "asc"
                    ? -1
                    : 1
                : av > bv
                    ? sortConfig.direction === "asc"
                        ? 1
                        : -1
                    : 0;
        })
        : filteredData;

    const displayedData = useMemo(
        () => sortedData.slice(0, currentChunk * CHUNK_SIZE),
        [sortedData, currentChunk]
    );


    const sortedDataRef = useRef(sortedData);
    useEffect(() => {
        sortedDataRef.current = sortedData;
    }, [sortedData]);


    const currentChunkRef = useRef(currentChunk);
    useEffect(() => {
        currentChunkRef.current = currentChunk;
    }, [currentChunk]);

    // --- Handlers & File / Export Logic ---

    const getVideoThumbnail = (videoUrl: string): Promise<Blob> => new Promise((res, rej) => {
        const v = document.createElement("video");
        v.crossOrigin = "anonymous";
        v.src = videoUrl;
        v.currentTime = 1;
        v.muted = true;
        v.playsInline = true;
        v.onloadeddata = () => {
            const c = document.createElement("canvas");
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d");
            if (!ctx) return rej("Canvas context N/A");
            ctx.drawImage(v, 0, 0, c.width, c.height);
            c.toBlob((b) => (b ? res(b) : rej("no blob")), "image/jpeg");
        };
        v.onerror = rej;
    });

    const updateRow = (idx: number, field: string, val: any) => {
        const copy = [...allData];
        copy[idx] = { ...copy[idx], [field]: val };
        setAllData(copy);
        setVisibleData(copy.slice(0, currentChunk * CHUNK_SIZE));
    };

    const handleFileUpload = (file: File) => {
        setFileUploaded(true);
        setFileName(file.name);
        const isCSV = file.name.endsWith(".csv");
        const reader = new FileReader();
        reader.onload = (e) => {
            const bstr = e.target?.result as string | ArrayBuffer;
            const parse = (json: RowData[]) => {
                const withMedia = json.map((r) => ({
                    ...r,
                    media: r.CREATIVE_URL_SUPPLIER,
                    remark: r.remark ?? "",
                    isFaulty: typeof r.isFaulty === "boolean"
                        ? r.isFaulty
                        : ["true", "yes", "1"].includes(String(r.isFaulty).toLowerCase()),
                }));
                setAllData(withMedia);
                setVisibleData(withMedia.slice(0, CHUNK_SIZE));
                setCurrentChunk(1);
            };

            if (isCSV) Papa.parse(bstr as string, { header: true, skipEmptyLines: true, complete: (r) => parse(r.data as RowData[]) });
            else {
                const wb = XLSX.read(bstr as string | ArrayBuffer, { type: "binary" });
                const json = XLSX.utils.sheet_to_json<RowData>(wb.Sheets[wb.SheetNames[0]]);
                parse(json);
            }
        };
        isCSV ? reader.readAsText(file) : reader.readAsBinaryString(file);
    };

    const handleDragger = (file: File) => { handleFileUpload(file); return false; };

    const handleExport = async () => {
        if (!allData.length) return;
        setIsExporting(true);
        setExportProgress(0);
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Media Data");
        const headers = Object.keys(allData[0]).filter((k) => k !== "media");
        ws.columns =
            exportMode === "with-media"
                ? [...headers.map((h) => ({ header: h, key: h })), { header: "Media Preview", key: "thumbnail" }]
                : headers.map((h) => ({ header: h, key: h }));

        for (let i = 0; i < allData.length; i++) {
            const r = allData[i];
            const row = ws.addRow(headers.map((h) => r[h]));
            if (exportMode === "with-media" && r.media) {
                try {
                    const blob = r.media.match(/\.(mp4|webm|ogg)$/i) ? await getVideoThumbnail(r.media) : await fetch(r.media).then((res) => res.blob());
                    const buff = await blob.arrayBuffer();
                    const ext = blob.type.includes("png") ? "png" : "jpeg";
                    const imgId = wb.addImage({ buffer: buff, extension: ext });
                    ws.getColumn(headers.length + 1).width = 40;
                    ws.getRow(row.number).height = 80;
                    ws.addImage(imgId, { tl: { col: headers.length, row: row.number - 1 }, ext: { width: 300, height: 500 }, editAs: "oneCell" });
                } catch { }
            }
            setExportProgress(Math.round(((i + 1) / allData.length) * 100));
        }

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${(fileName || "export").replace(/\.(xlsx|xls|csv)$/i, "")}${exportMode === "with-media" ? "_with_media" : ""}.xlsx`);
        setIsExporting(false);
        setExportProgress(0);
    };

    const renderMedia = (u?: string) =>
        u?.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
                src={u}
                controls
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
        ) : u ? (
            <img
                src={u}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
        ) : null;



    useEffect(() => {
        const observer = new MutationObserver(() => {
            const tableBody = document.querySelector('.ant-table-body');
            if (tableBody) {
                const handleScroll = throttle(() => {
                    const nearBottom =
                        tableBody.scrollTop + tableBody.clientHeight >= tableBody.scrollHeight - 100;

                    const maxChunks = Math.ceil(sortedDataRef.current.length / CHUNK_SIZE);

                    if (nearBottom && currentChunkRef.current < maxChunks && !isLazyLoading) {
                        setIsLazyLoading(true);
                        setTimeout(() => {
                            setCurrentChunk((prev) => {
                                const next = prev + 1;
                                currentChunkRef.current = next;
                                return next;
                            });
                            setIsLazyLoading(false);
                        }, 300);
                    }
                }, 200);

                tableBody.addEventListener('scroll', handleScroll);
                observer.disconnect(); // only need to observe once

                return () => {
                    tableBody.removeEventListener('scroll', handleScroll);
                };
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);






    // --- Columns for Table ---
    const columns = [
        { title: "Index", width: 80, render: (_: any, __: any, idx: number) => idx + 1 },
        ...getSortedColoredColumns(Object.keys(sortedData[0]?.row || {})).filter(col => visibleColumns.includes(col.key))
        ,
        {
            title: "Media",
            dataIndex: "media",
            width: "20%",
            onCell: () => ({
                style: {
                    padding: 0,              // Optional: remove extra padding
                    height: "100%",          // Ensure full height
                    verticalAlign: "middle", // Center media vertically
                },
            }),
            render: (_: any, __: any, idx: number) =>
                renderMedia(sortedData[idx].row.media),
        },
        {
            title: "Remark",
            dataIndex: "remark",
            width: 180,
            render: (_: any, __: any, idx: number) => (
                <Input
                    value={sortedData[idx].row.remark}
                    onChange={(e) => updateRow(sortedData[idx].originalIndex, "remark", e.target.value)}
                />
            ),
        },
        {
            title: "Is Faulty",
            dataIndex: "isFaulty",
            width: 90,
            render: (_: any, __: any, idx: number) => (
                <div style={{ transform: "scale(1.5)", transformOrigin: "top left" }}>
                    <Checkbox
                        checked={sortedData[idx].row.isFaulty}
                        onChange={() =>
                            updateRow(sortedData[idx].originalIndex, "isFaulty", !sortedData[idx].row.isFaulty)
                        }
                    />
                </div>
            ),
        },
    ];
    const columnOptions = baseKeys.map((key) => ({ label: key, value: key }));

    const columnVisibilityMenu = (
        <div style={{ maxHeight: 300, overflowY: "auto", padding: 12 }}>
            <Checkbox.Group
                value={visibleColumns}
                onChange={(val) => setVisibleColumns(val as string[])}
                style={{ display: "flex", flexDirection: "column" }}
            >
                {columnOptions.map((option) => (
                    <Checkbox key={option.value} value={option.value} style={{ marginBottom: 4 }}>
                        {option.label}
                    </Checkbox>
                ))}
            </Checkbox.Group>
            <Divider style={{ margin: "8px 0" }} />
            <Button size="small" type="link" onClick={() => setVisibleColumns(baseKeys)}>
                Show All
            </Button>
            <Button size="small" type="link" danger onClick={() => setVisibleColumns([])}>
                Hide All
            </Button>
        </div>
    );

    return (
        <div style={{ padding: 24 }}>
            <Title level={4}>Upload Excel or CSV File</Title>
            {!fileUploaded && (
                <Dragger
                    accept=".xlsx,.xls,.csv"
                    multiple={false}
                    beforeUpload={handleDragger}
                    style={{ marginBottom: 16 }}
                >
                    <p style={{ fontSize: 24 }}>
                        <InboxOutlined />
                    </p>
                    <p>Click or drag file to upload</p>
                </Dragger>
            )}

            {fileUploaded && (
                <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Col>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Button onClick={() => setFileUploaded(false)}>Choose Another</Button>
                            <span>{fileName}</span>
                        </div>
                    </Col>
                    <Col>
                        {totalRows > 0 && (
                            <div style={{ textAlign: "right" }}>
                                <div><b>Faulty Count:</b> {faultyRows} / {totalRows}</div>
                                <div><b>% Faulty:</b> {faultyPercentage}%</div>
                                <div><b>% Impression Faulty:</b> {impressionPercentage ?? "—"}</div>
                            </div>
                        )}
                    </Col>
                </Row>
            )}
            <Row gutter={8} style={{ marginBottom: 20 }}>
                <Col>
                    <p style={{ marginTop: 8 }}>Loaded: {displayedData.length} / {sortedData.length}</p>

                </Col>
                <Col flex="auto">
                    <Search
                        placeholder="Enter keyword, press Enter"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onSearch={(val) => {
                            const t = val.trim();
                            if (t && !searchKeywords.includes(t)) setSearchKeywords([...searchKeywords, t]);
                            setSearchInput("");
                        }}
                        enterButton
                    />

                    {searchKeywords.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {searchKeywords.map((k) => (
                                <Tag
                                    key={k}
                                    closable
                                    onClose={() => setSearchKeywords(searchKeywords.filter((x) => x !== k))}
                                    style={{
                                        backgroundColor: "#e6f4ff",      // soft blue
                                        color: "#0958d9",
                                        borderRadius: 11,
                                        fontSize: 15,
                                        padding: "6px 12px",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#ffccc7"; // red hover bg
                                        (e.currentTarget as HTMLElement).style.color = "#a8071a";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#e6f4ff";
                                        (e.currentTarget as HTMLElement).style.color = "#0958d9";
                                    }}
                                    closeIcon={
                                        <span
                                            style={{
                                                fontSize: 18,             // bigger X
                                                fontWeight: "bold",
                                                marginLeft: 8,
                                                lineHeight: "1",
                                            }}
                                        >
                                            ×
                                        </span>
                                    }
                                >
                                    {k}
                                </Tag>
                            ))}
                        </div>
                    )}

                </Col>

                <Col>
                    <Dropdown
                        overlay={
                            <div
                                style={{
                                    background: "white",
                                    padding: 12,
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                                    borderRadius: 4,
                                }}
                            >
                                {columnVisibilityMenu}
                            </div>
                        }
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Button icon={<EyeOutlined />}>Column Display</Button>
                    </Dropdown>
                </Col>
            </Row>
            <Row gutter={8} style={{ marginBottom: 16 }}>
                <Col>
                    <Checkbox
                        checked={filterFaulty}
                        onChange={(e) => setFilterFaulty(e.target.checked)}
                    >
                        Show Only Faulty
                    </Checkbox>
                </Col>
            </Row>
            <div style={{ height: "80vh", display: "flex", flexDirection: "column", padding: 16 }}>
                {/* Scrollable Table container */}
                <div style={{ flex: 1, overflow: "auto" }} ref={containerRef}>
                    <Table
                        columns={columns}
                        dataSource={displayedData.map((x) => ({ ...x.row, key: x.row.CREATIVE_URL_SUPPLIER }))}
                        rowKey="key"
                        pagination={false}
                        sticky
                        scroll={{ y: 'calc(100vh - 300px)' }}
                        onChange={(_, __, sorter) => {
                            if (!Array.isArray(sorter) && sorter.order) {
                                setSortConfig({
                                    key: sorter.field as string,
                                    direction: sorter.order === "ascend" ? "asc" : "desc",
                                });
                            } else {
                                setSortConfig(null);
                            }
                        }}
                    />
                    {isLazyLoading && (
                        <div style={{ textAlign: "center", padding: 16 }}>
                            <Spin tip="Loading more..." />
                        </div>
                    )}
                </div>


                {/* Export controls */}
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <Select
                        value={exportMode}
                        onChange={(v) => setExportMode(v)}
                        options={[
                            { label: "Without Media", value: "without-media" },
                            { label: "With Media", value: "with-media" },
                        ]}
                    />
                    <Tooltip title="Embed media thumbnails into exported file">
                        <InfoCircleOutlined />
                    </Tooltip>
                    <Button type="primary" onClick={handleExport} loading={isExporting} disabled={!totalRows}>
                        Export File
                    </Button>
                    {isExporting && <Progress percent={exportProgress} size="small" style={{ width: 200 }} />}
                </div>
            </div>


            <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={12}>
                    <Card title="Advertiser Distribution">
                        <Table
                            columns={[
                                { title: "Advertiser", dataIndex: "id" },
                                {
                                    title: "Count",
                                    dataIndex: "value",
                                    defaultSortOrder: "descend",
                                    sorter: (a, b) => b.value - a.value,
                                },
                            ]}
                            dataSource={[...advertiserData].sort((a, b) => b.value - a.value)}
                            pagination={false}
                            rowKey="id"
                            size="small"
                        />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Campaign Distribution">
                        <Table
                            columns={[
                                { title: "Campaign", dataIndex: "id" },
                                {
                                    title: "Count",
                                    dataIndex: "value",
                                    defaultSortOrder: "descend",
                                    sorter: (a, b) => b.value - a.value,
                                },
                            ]}
                            dataSource={[...campaignData].sort((a, b) => b.value - a.value)}
                            pagination={false}
                            rowKey="id"
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MediaInspectorV2;
