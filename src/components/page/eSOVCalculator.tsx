// file: eSOVCalculator.tsx
import React, { useEffect, useState, useRef } from "react";
import { Card, Row, Col, Select, Button, Table } from "antd";
import { UploadSection } from "../modals/UploadSection";
import { parseFile, cleanRows, RowData } from "../../utils/parseFile";
import { mergeSearchFiles } from "../../utils/transforms/mergeSearchFiles";
import { aggSearchData, DataRow } from "../../utils/transforms/aggSearchData";
import { calcShare } from "../../utils/transforms/share";
import { mergeSearchSpend } from "../../utils/transforms/mergeSearchSpend";
import { detectSearchDate, detectSpendColumns } from "../../utils/transforms/detectColumns";
import BrandEditor from "../modals/BrandEditor";
import ESOVMonthlyChart from "../modals/eSOVLineChart";
import Papa from "papaparse";
import saveAs from "file-saver";

const { Option } = Select;

const eSOVCalculator: React.FC = () => {
    // --- State ---
    const [searchFiles, setSearchFiles] = useState<File[]>([]);
    const [spendFile, setSpendFile] = useState<File | null>(null);
    const [searchData, setSearchData] = useState<RowData[]>([]);
    const [spendData, setSpendData] = useState<RowData[]>([]);
    const [searchCols, setSearchCols] = useState<string[]>([]);
    const [spendCols, setSpendCols] = useState<string[]>([]);
    const [searchMapping, setSearchMapping] = useState({ date: "" });
    const [spendMapping, setSpendMapping] = useState({ brand: "", date: "", value: "" });
    const [renameMap, setRenameMap] = useState<Record<string, string>>({});
    const [result, setResult] = useState<DataRow[]>([]);
    const [metric, setMetric] = useState<"eSOV" | "spend" | "share">("eSOV");

    const searchFilesDataRef = useRef<RowData[][]>([]);
    console.log("Current search files data ref:", spendFile,searchData);
    // --- Handlers ---
    const handleSearchUpload = async (file: File) => {
        const parsed = await parseFile(file);
        const cleaned = cleanRows(parsed);

        const previous = searchFilesDataRef.current || [];
        const allFilesData = [...previous, cleaned];

        const merged = mergeSearchFiles(allFilesData, searchMapping.date || "Time");

        setSearchData(merged);
        searchFilesDataRef.current = allFilesData;
        setSearchFiles((prev) => [...prev, file]);

        const allBrands = Array.from(
            new Set(merged.flatMap(r => Object.keys(r).filter(c => c !== searchMapping.date && c.trim() !== "")))
        );
        setSearchCols(allBrands);

        if (!searchMapping.date && merged.length) {
            const detected = detectSearchDate(Object.keys(merged[0]));
            if (detected) setSearchMapping({ date: detected });
        }
    };

    const clearSearchFiles = () => {
        setSearchFiles([]);
        setSearchData([]);
        setSearchCols([]);
        setRenameMap({});
        searchFilesDataRef.current = [];
    };

    const handleSpendUpload = async (file: File) => {
        const rows = cleanRows(await parseFile(file));
        setSpendFile(file);
        setSpendData(rows);
        const cols = Object.keys(rows[0] || {});
        setSpendCols(cols);
        setSpendMapping(detectSpendColumns(cols));
    };

    const spendBrands = Array.from(new Set(spendData.map(r => r[spendMapping.brand])));

    const runCalculation = async () => {
        const mergedSearch = mergeSearchFiles(searchFilesDataRef.current, searchMapping.date || "Time");

        const renamedMerged: DataRow[] = mergedSearch.map(row => {
            const r: DataRow = { Time: row[searchMapping.date] };
            Object.keys(row).forEach(col => {
                if (col !== searchMapping.date) {
                    r[renameMap[col] || col] = row[col];
                }
            });
            return r;
        });

        const unpivotedSearch = aggSearchData(renamedMerged);
        const searchShare = calcShare(unpivotedSearch, "value");

        const spendRows = spendData.map(r => {
            const originalDate = new Date(r[spendMapping.date]);
            const monthStart = new Date(originalDate.getFullYear(), originalDate.getMonth(), 1);
            const monthStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-01`;
            return {
                date: monthStr,
                brand: r[spendMapping.brand],
                value: Number(r[spendMapping.value]) || 0,
            };
        });

        const spendShare = calcShare(spendRows, "value");
        const final = mergeSearchSpend(searchShare, spendShare);
        setResult(final);
    };

    const brandColumns = searchCols.filter(c => c !== searchMapping.date);
    useEffect(() => {
        if (!brandColumns.length || !spendBrands.length) return;

        const autoMap: Record<string, string> = { ...renameMap };
        brandColumns.forEach(sBrand => {
            const found = spendBrands.find(sp => sBrand.toUpperCase().includes(sp.toUpperCase()));
            if (found) autoMap[sBrand] = found;
        });
        setRenameMap(autoMap);
    }, [brandColumns.join(","), spendBrands.join(","), setRenameMap]);

    // --- Prepare Nivo Chart Data ---
    const reChartData = React.useMemo(() => {
        if (!result || !result.length) return [];

        const brands = Array.from(new Set(result.map(r => r.brand || "Unknown")));

        return brands.map(brand => {
            // Filter and sort by date ascending
            const brandData = result
                .filter(r => r.brand === brand)
                .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateA - dateB;
                })
                .map(r => ({
                    x: r.date ? r.date.slice(0, 7) : "N/A", // yyyy-mm
                    y:
                        metric === "eSOV"
                            ? typeof r.eSOV === "number"
                                ? r.eSOV
                                : 0
                            : metric === "spend"
                                ? typeof r.spend_share === "number"
                                    ? r.spend_share
                                    : 0
                                : typeof r.share === "number"
                                    ? r.share
                                    : 0,
                }));

            return {
                id: brand,
                data: brandData,
            };
        });
    }, [result, metric]);
    const exportCSV = () => {
        if (!result || !result.length) return;

        // Map only the columns you want
        const csvData = result.map(r => ({
            Date: r.date,
            Brand: r.brand,
            "Search Share": r.share,
            "Spend Share": r.spend_share,
            eSOV: r.eSOV,
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "table_export.csv");
    };
    // --- Render ---
    return (
        <div style={{ padding: 24 }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Card title="Upload Search Files">
                        {[0, 1, 2].map(i => (
                            <div key={i}>
                                <div
                                    onClick={() => !searchFiles[i] && document.getElementById(`search-upload-${i + 1}`)?.click()}
                                    style={{
                                        border: "2px dashed #1677ff",
                                        borderRadius: 8,
                                        padding: 16,
                                        textAlign: "center",
                                        cursor: searchFiles[i] ? "not-allowed" : "pointer",
                                        background: "#fafcff",
                                        marginBottom: 10,
                                        color: searchFiles[i] ? "#999" : "#1677ff",
                                        fontWeight: 500,
                                    }}
                                >
                                    {searchFiles[i] ? `✓ ${searchFiles[i].name}` : `Click to Upload Search File ${i + 1}`}
                                </div>
                                <input
                                    id={`search-upload-${i + 1}`}
                                    type="file"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSearchUpload(file);
                                        e.target.value = "";
                                    }}
                                />
                            </div>
                        ))}
                        <Button danger style={{ width: "100%", marginTop: 8 }} onClick={clearSearchFiles}>
                            Clear Search Files
                        </Button>
                        <Select
                            style={{ width: "100%", marginTop: 12 }}
                            placeholder="Select Date Column"
                            value={searchMapping.date}
                            onChange={(v) => setSearchMapping({ date: v })}
                        >
                            {searchCols.map(c => (
                                <Option key={c}>{c}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Upload Spend File">
                        <UploadSection onUpload={handleSpendUpload} />
                        <Select
                            style={{ width: "100%", marginTop: 12 }}
                            placeholder="Brand Column"
                            value={spendMapping.brand}
                            onChange={(v) => setSpendMapping({ ...spendMapping, brand: v })}
                        >
                            {spendCols.map(c => (
                                <Option key={c}>{c}</Option>
                            ))}
                        </Select>
                        <Select
                            style={{ width: "100%", marginTop: 12 }}
                            placeholder="Date Column"
                            value={spendMapping.date}
                            onChange={(v) => setSpendMapping({ ...spendMapping, date: v })}
                        >
                            {spendCols.map(c => (
                                <Option key={c}>{c}</Option>
                            ))}
                        </Select>
                        <Select
                            style={{ width: "100%", marginTop: 12 }}
                            placeholder="Spend Column"
                            value={spendMapping.value}
                            onChange={(v) => setSpendMapping({ ...spendMapping, value: v })}
                        >
                            {spendCols.map(c => (
                                <Option key={c}>{c}</Option>
                            ))}
                        </Select>
                    </Card>
                </Col>
            </Row>

            <Card title="Rename Brands" style={{ marginTop: 20 }}>
                <BrandEditor brands={brandColumns} renameMap={renameMap} setRenameMap={setRenameMap} spendBrands={spendBrands} />
            </Card>

            <Button type="primary" style={{ marginTop: 20 }} onClick={runCalculation}>
                Calculate eSOV
            </Button>

            <Table
                style={{ marginTop: 20 }}
                dataSource={result}
                rowKey={(r) => r.date + r.brand}
                columns={[
                    { title: "Date", dataIndex: "date" },
                    { title: "Brand", dataIndex: "brand" },
                    { title: "Search Share", dataIndex: "share" },
                    { title: "Spend Share", dataIndex: "spend_share" },
                    { title: "eSOV", dataIndex: "eSOV" },
                ]}
            />
            <Button onClick={exportCSV} type="primary" style={{ marginBottom: 16 }}>
                Export CSV
            </Button>
            <Card title="Brand eSOV by Month" style={{ marginTop: 20 }}>
                <Select value={metric} onChange={(v) => setMetric(v as any)} style={{ marginBottom: 12, width: 200 }}>
                    <Option value="eSOV">eSOV</Option>
                    <Option value="share">Share of Search</Option>
                    <Option value="spend">Share of Spend</Option>
                </Select>

                <ESOVMonthlyChart data={reChartData} metric={metric} />
            </Card>
        </div>
    );
};

export default eSOVCalculator;