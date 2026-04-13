// src/components/modals/MediaInspectorV3.tsx
import { useState, useMemo } from "react";
import { Button, Layout, ConfigProvider, theme, Row, Col, Space, Dropdown, Menu } from "antd";
import { LayoutGrid, Table as TableIcon, ArrowUpDown } from "lucide-react";
import { BulbOutlined } from "@ant-design/icons";

import { UploadSection } from "../modals/UploadSection";
import { MediaTable } from "../modals/MediaTable";
import FiltersBar from "../modals/FiltersBar";
import StatsPanel from "../modals/StatsPanel";
import DistributionTables from "../modals/DistributionTables";
import ExportControls from "../modals/ExportControls";
import Header from "../modals/Headers";
import MediaGrid from "../modals/MediaGrid";
import QueryDrawer, { FaultyRow } from "../modals/queryDrawer";

import { useFileParser } from "../../hooks/useFileParser";
import { useTableData } from "../../hooks/useTableData";
import { useExportExcel } from "../../hooks/useExportExcel";
import { useUnsavedChangesWarning } from "../../hooks/useUnsavedChangesWarning";

import type { RowData, FaultyOn } from "../../types/RowData";
import { CHUNK_SIZE } from "../../constants/tableConfig";
import FaultySelectorModal from "../modals/FaultySelectorModal";

import "../../assets/css/MediaInspectorV3.css";

const MediaInspectorV3 = () => {
    const { parseFile } = useFileParser();

    // ================= STATE =================
    const [allData, setAllData] = useState<RowData[]>([]);
    const [fileName, setFileName] = useState<string | undefined>();
    const [chunk, setChunk] = useState(1);

    const [searchInput, setSearchInput] = useState("");
    const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
    const [filterFaulty, setFilterFaulty] = useState(false);

    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

    const [hiddenFilters, setHiddenFilters] = useState({
        advertisers: new Set<string>(),
        campaigns: new Set<string>(),
    });

    const [activeAdvertiser, setActiveAdvertiser] = useState<string | null>(null);
    const [activeCampaign, setActiveCampaign] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [exportMode, setExportMode] = useState<"with-media" | "without-media">(
        "without-media"
    );

    const { exportFile, isExporting, progress } = useExportExcel(allData, fileName);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    useUnsavedChangesWarning(hasUnsavedChanges);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [allFaultyRows, setAllFaultyRows] = useState<FaultyRow[]>([]);

    // ================= SORT STATE =================
    const [sortConfig, setSortConfig] = useState<{
        field?: string;
        order?: "ascend" | "descend";
    }>({});

    // ================= HANDLERS =================
    const handleUpdateRow = (id: string | number, field: string, value: any) => {
        setHasUnsavedChanges(true);
        setAllData((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const handleLoadMore = () => {
        const maxChunks = Math.ceil(allData.length / CHUNK_SIZE);
        setChunk((prev) => (prev < maxChunks ? prev + 1 : prev));
    };

    const toggleHideAdvertiser = (name: string) => {
        setHiddenFilters((prev) => {
            const next = new Set(prev.advertisers);
            next.has(name) ? next.delete(name) : next.add(name);
            return { ...prev, advertisers: next };
        });
    };

    const toggleHideCampaign = (name: string) => {
        setHiddenFilters((prev) => {
            const next = new Set(prev.campaigns);
            next.has(name) ? next.delete(name) : next.add(name);
            return { ...prev, campaigns: next };
        });
    };

    // ================= FAULTY MODAL =================
    const [faultyModalOpen, setFaultyModalOpen] = useState(false);
    const [modalRow] = useState<RowData | null>(null);

    const handleFaultyConfirm = (rowId: string | number, faultyOn: FaultyOn) => {
        setAllData((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, isFaulty: true, faultyOn } : row
            )
        );

        setAllFaultyRows((prev) => {
            const exists = prev.find((r) => r.row.id === rowId);
            if (exists) return prev;

            const updatedRow = allData.find((r) => r.id === rowId);
            if (!updatedRow) return prev;

            return [...prev, { row: { ...updatedRow, isFaulty: true, faultyOn } }];
        });
    };

    // ================= FILTERING =================
    const filteredData = useMemo(() => {
        return allData
            .filter((row) => {
                if (filterFaulty && !row.isFaulty) return false;
                if (activeAdvertiser && row.ADVERTISER_NAME !== activeAdvertiser) return false;
                if (activeCampaign && row.CREATIVE_CAMPAIGN_NAME !== activeCampaign) return false;
                if (row.ADVERTISER_NAME && hiddenFilters.advertisers.has(row.ADVERTISER_NAME)) return false;
                if (row.CREATIVE_CAMPAIGN_NAME && hiddenFilters.campaigns.has(row.CREATIVE_CAMPAIGN_NAME)) return false;
                return true;
            })
            .filter((row) => searchKeywords.every((kw) => row.__search?.includes(kw)));
    }, [allData, filterFaulty, activeAdvertiser, activeCampaign, hiddenFilters, searchKeywords]);

    // ================= SORTING =================
    const sortedData = useMemo(() => {
        if (!sortConfig.field) return filteredData;

        const sorted = [...filteredData].sort((a: any, b: any) => {
            const aVal = a[sortConfig.field!];
            const bVal = b[sortConfig.field!];

            if (aVal === bVal) return 0;

            if (sortConfig.order === "ascend") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return sorted;
    }, [filteredData, sortConfig]);

    const tableData = useTableData({
        data: sortedData,
        search: "",
        chunk,
    });



    // ================= COLUMN OPTIONS =================
    const HIDDEN_KEYS = ["__search"];
    const SPECIAL_COLUMNS = ["#", "media", "remark", "isFaulty"];

    const columnOptions = useMemo(() => {
        if (!allData.length) return [];
        const dataKeys = Object.keys(allData[0]).filter((key) => !HIDDEN_KEYS.includes(key));
        const mergedKeys = Array.from(new Set([...dataKeys, ...SPECIAL_COLUMNS]));
        return mergedKeys.map((key) => ({ label: key, value: key }));
    }, [allData]);

    // ================= UPLOAD =================
    const DEFAULT_COLUMNS = [
        "#",
        "media",
        "BRAND",
        "ADVERTISER_NAME",
        "CREATIVE_LANDINGPAGE_URL",
        "SOCIAL_CAMPAIGN_TEXT",
        "CREATIVE_URL_SUPPLIER",
        "remark",
        "isFaulty",
    ];

    const handleUpload = async (file: File) => {
        setChunk(1);
        setHasUnsavedChanges(true);
        setFileName(file.name);

        const parsed = await parseFile(file);

        const normalized = parsed.map((row: any, index: number) => {
            const remarkValue = row.remark ?? row.Remark ?? row.REMARK ?? "";
            const faultyValue = row.isFaulty ?? row.IsFaulty ?? row.ISFAULTY ?? false;

            const isFaultyNormalized =
                typeof faultyValue === "string"
                    ? ["true", "1", "yes"].includes(faultyValue.toLowerCase())
                    : Boolean(faultyValue);

            return { ...row, id: row.id ?? index, remark: remarkValue, isFaulty: isFaultyNormalized };
        });

        setAllData(normalized);

        if (normalized.length) {
            const availableKeys = Object.keys(normalized[0]);

            const safeColumns = DEFAULT_COLUMNS.filter(
                (col) =>
                    col === "#" ||
                    col === "media" ||
                    col === "remark" ||
                    col === "isFaulty" ||
                    availableKeys.includes(col)
            );

            setVisibleColumns(safeColumns);
        }
    };
    // ================= SORT MENU =================
    const NON_SORTABLE = ["#", "media", "remark", "isFaulty"];

    const sortMenu = (
        <Menu
            onClick={({ key }) => {
                const [field, order] = key.split("|");

                setSortConfig({
                    field,
                    order: order as "ascend" | "descend",
                });
            }}
            items={columnOptions
                .filter((col) => !NON_SORTABLE.includes(col.value))
                .flatMap((col) => [
                    {
                        key: `${col.value}|ascend`,
                        label: `${col.label} ↑`,
                    },
                    {
                        key: `${col.value}|descend`,
                        label: `${col.label} ↓`,
                    },
                ])}
        />
    );
    // ================= EXPORT =================
    const prepareExportData = () => {
        const source =
            filterFaulty || activeAdvertiser || activeCampaign || searchKeywords.length
                ? sortedData // ✅ export what user sees
                : allData;   // fallback

        return source.map((row) => {
            const cleaned: any = { ...row };

            // ❌ remove internal fields
            delete cleaned.__search;

            // ✅ flatten faultyOn
            if (cleaned.faultyOn) {
                cleaned.faulty_column = cleaned.faultyOn.faultyOn;
                cleaned.faulty_value = cleaned.faultyOn.value;
            } else {
                cleaned.faulty_column = "";
                cleaned.faulty_value = "";
            }

            delete cleaned.faultyOn;

            // ✅ normalize boolean
            cleaned.isFaulty = cleaned.isFaulty ? "TRUE" : "FALSE";

            // ✅ optional: remove media if needed
            if (exportMode === "without-media") {
                delete cleaned.media;
                delete cleaned.CREATIVE_URL_SUPPLIER;
            }

            return cleaned;
        });
    };
    // ================= UI =================
    return (
        <ConfigProvider
            theme={{
                algorithm: themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <Layout style={{ padding: 20 }}>
                <Header />

                <UploadSection onUpload={handleUpload} themeMode={themeMode} />
                <StatsPanel data={filteredData} />

                {/* FILTERS + TOOLS */}
                <Row align="middle" justify="space-between" style={{ marginBottom: 12 }}>
                    <Col>
                        <FiltersBar
                            searchInput={searchInput}
                            setSearchInput={setSearchInput}
                            searchKeywords={searchKeywords}
                            setSearchKeywords={setSearchKeywords}
                            filterFaulty={filterFaulty}
                            setFilterFaulty={setFilterFaulty}
                            columnOptions={columnOptions}
                            visibleColumns={visibleColumns}
                            setVisibleColumns={setVisibleColumns}
                            themeMode={themeMode}
                        />
                    </Col>

                    <Col>
                        <Space>
                            {/* GRID / TABLE */}
                            <Button
                                icon={viewMode === "grid" ? <LayoutGrid size={18} /> : <TableIcon size={18} />}
                                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                            >
                                {viewMode === "grid" ? "Grid" : "Table"}
                            </Button>

                            {/* GRID SORT */}
                            {viewMode === "grid" && (
                                <Dropdown overlay={sortMenu} trigger={["click"]}>
                                    <Button icon={<ArrowUpDown size={16} />}>
                                        Sort {sortConfig.field ? `: ${sortConfig.field}` : ""}
                                    </Button>
                                </Dropdown>
                            )}

                            {/* QUERY SNIPPET */}
                            <Button
                                type="primary"
                                icon={
                                    allFaultyRows.length > 0 ? (
                                        <BulbOutlined className="blink-bulb" />
                                    ) : (
                                        <BulbOutlined />
                                    )
                                }
                                onClick={() => setDrawerOpen(true)}
                            >
                                Query Snippet
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* MAIN VIEW */}
                {viewMode === "table" ? (
                    <MediaTable
                        key={fileName}
                        data={tableData}
                        visibleColumns={visibleColumns}
                        onLoadMore={handleLoadMore}
                        onUpdateRow={handleUpdateRow}
                        allFaultyRows={allFaultyRows}
                        setAllFaultyRows={setAllFaultyRows}
                    />
                ) : (
                    <MediaGrid
                        data={tableData}
                        onLoadMore={handleLoadMore}
                        allFaultyRows={allFaultyRows}
                        setAllFaultyRows={setAllFaultyRows}
                        onUpdateRow={handleUpdateRow}
                    />
                    
                )}

                <ExportControls
                    exportMode={exportMode}
                    setExportMode={setExportMode}
                    onExport={() => {
                        const prepared = sortedData.map((row) => {
                            const cleaned: any = { ...row };

                            // ✅ ALWAYS include remark
                            cleaned.remark = row.remark || "";

                            // ✅ ALWAYS include faulty flag
                            cleaned.isFaulty = row.isFaulty ? "TRUE" : "FALSE";

                            // ✅ flatten faultyOn
                            if (row.faultyOn) {
                                cleaned.faulty_column = row.faultyOn.faultyOn;
                                cleaned.faulty_value = row.faultyOn.value;
                            } else {
                                cleaned.faulty_column = "";
                                cleaned.faulty_value = "";
                            }

                            // ❌ remove internal fields
                            delete cleaned.__search;
                            delete cleaned.faultyOn;

                            // ❌ optional media removal
                            if (exportMode === "without-media") {
                                delete cleaned.media;
                                delete cleaned.CREATIVE_URL_SUPPLIER;
                            }

                            return cleaned;
                        });

                        exportFile(exportMode, prepared);
                    }}
                    isExporting={isExporting}
                    progress={progress}
                    disabled={!allData.length}
                />

                <div
                    style={{
                        maxHeight: 400,
                        overflowY: "auto",
                        marginBottom: 20,
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 8,
                    }}
                >
                    <DistributionTables
                        data={allData}
                        hiddenAdvertisers={hiddenFilters.advertisers}
                        hiddenCampaigns={hiddenFilters.campaigns}
                        toggleHideAdvertiser={toggleHideAdvertiser}
                        toggleHideCampaign={toggleHideCampaign}
                        activeAdvertiser={activeAdvertiser}
                        activeCampaign={activeCampaign}
                        setActiveAdvertiser={setActiveAdvertiser}
                        setActiveCampaign={setActiveCampaign}
                    />
                </div>

                <QueryDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    allFaultyRows={allFaultyRows}
                    setAllFaultyRows={setAllFaultyRows}
                />

                <FaultySelectorModal
                    open={faultyModalOpen}
                    onClose={() => setFaultyModalOpen(false)}
                    row={modalRow}
                    onConfirm={handleFaultyConfirm}
                />

                <Button
                    type="primary"
                    shape="circle"
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                    }}
                    onClick={() => setThemeMode((prev) => (prev === "light" ? "dark" : "light"))}
                >
                    {themeMode === "light" ? "🌙" : "☀️"}
                </Button>
            </Layout>
        </ConfigProvider>
    );
};

export default MediaInspectorV3;