// src/components/modals/MediaTable.tsx
import React, { useState } from "react";
import { Table, Input, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LazyMedia } from "./LazyMedia";
import FaultySelectorModal, { FaultyOn } from "./FaultySelectorModal";
import type { RowData } from "../../types/RowData";
import type { FaultyRow } from "./queryDrawer";

type Props = {
    data: RowData[];
    visibleColumns?: string[];
    onLoadMore?: () => void;
    onUpdateRow?: (id: string | number, field: string, value: any) => void;
    allFaultyRows: FaultyRow[];
    setAllFaultyRows: (rows: FaultyRow[]) => void;
    faultyMode: "legacy" | "advanced";
    // ✅ SORT CONTROL (from parent)
    sortConfig: {
        field?: string;
        order?: "ascend" | "descend";
    };
    setSortConfig: React.Dispatch<React.SetStateAction<{
        field?: string;
        order?: "ascend" | "descend";
    }>>;
    setChunk: React.Dispatch<React.SetStateAction<number>>;
};

export const MediaTable: React.FC<Props> = ({
    data,
    visibleColumns = [],
    onLoadMore,
    onUpdateRow,
    allFaultyRows,
    setAllFaultyRows,

    sortConfig,
    setSortConfig,
    setChunk,
    faultyMode
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null);

    const openFaultyModal = (row: RowData) => {
        const isChecked = allFaultyRows.some(
            (r) => r.row.id === row.id
        );

        // ✅ LEGACY MODE → just toggle
        if (faultyMode === "legacy") {
            const faultyOnDefault: FaultyOn = {
                faultyOn: "OTHER",
                value: "legacy_toggle",
            };

            if (isChecked) {
                // remove faulty
                const newRows = allFaultyRows.filter(
                    (r) => r.row.id !== row.id
                );

                setAllFaultyRows(newRows);

                onUpdateRow?.(row.id, "isFaulty", false);
                onUpdateRow?.(row.id, "faultyOn", undefined);
            } else {
                // add faulty WITHOUT modal
                onUpdateRow?.(row.id, "isFaulty", true);
                onUpdateRow?.(row.id, "faultyOn", faultyOnDefault);

                const newRows: FaultyRow[] = [
                    ...allFaultyRows,
                    {
                        row: {
                            ...row,
                            isFaulty: true,
                            faultyOn: faultyOnDefault,
                        },
                    },
                ];

                setAllFaultyRows(newRows);
            }

            return;
        }

        // ================= ADVANCED MODE (existing behavior) =================
        if (isChecked) {
            const newRows = allFaultyRows.filter(
                (r) => r.row.id !== row.id
            );

            setAllFaultyRows(newRows);

            onUpdateRow?.(row.id, "isFaulty", false);
            onUpdateRow?.(row.id, "faultyOn", undefined);
        } else {
            setSelectedRow(row);
            setModalOpen(true);
        }
    };

    const handleFaultyConfirm = (rowId: string | number, faultyOn: FaultyOn) => {
        const baseRow = data.find((r) => r.id === rowId);
        if (!baseRow) return;

        onUpdateRow?.(rowId, "isFaulty", true);
        onUpdateRow?.(rowId, "faultyOn", faultyOn);

        const filtered = allFaultyRows.filter(
            (r) => r.row.id !== rowId
        );

        const newRows = [
            ...filtered,
            {
                row: {
                    ...baseRow,
                    isFaulty: true,
                    faultyOn,
                },
            },
        ];

        setAllFaultyRows(newRows);
        setModalOpen(false);
    };

    const dataKeys = data.length ? Object.keys(data[0]) : [];
    const cellStyle = {
        whiteSpace: "normal" as const,
        wordBreak: "break-word" as const,
        maxWidth: 250
    };

    const indexColumn: ColumnsType<RowData>[number] = {
        title: "#",
        key: "#",
        width: 60,
        fixed: "left",
        render: (_, __, i) => i + 1
    };

    const dynamicColumns: ColumnsType<RowData> = dataKeys
        .filter(key => !["media", "remark", "isFaulty"].includes(key))
        .map(key => ({
            title: key,
            dataIndex: key,
            key,

            // ✅ Enable AntD sort UI ONLY
            sorter: true,

            // ✅ Controlled sort state
            sortOrder:
                sortConfig.field === key ? sortConfig.order : null,

            // ✅ Use YOUR sorting logic (not AntD)
            onHeaderCell: () => ({
                onClick: () => {
                    setSortConfig(prev => {
                        const isSame = prev.field === key;

                        return {
                            field: key,
                            order: !isSame
                                ? "ascend"
                                : prev.order === "ascend"
                                    ? "descend"
                                    : "ascend",
                        };
                    });

                    // 🔥 reset chunk so sorting feels correct
                    setChunk(1);
                },
            }),

            onCell: () => ({ style: cellStyle }),
        }));

    const mediaColumn: ColumnsType<RowData>[number] = {
        title: "media",
        dataIndex: "media",
        key: "media",
        width: 320,
        fixed: "left",
        render: v => <LazyMedia url={v} />,
        onCell: () => ({ style: cellStyle }),
    };

    const remarkColumn: ColumnsType<RowData>[number] = {
        title: "remark",
        dataIndex: "remark",
        key: "remark",
        width: 200,
        render: (_, record) => (
            <Input
                value={record.remark}
                onChange={e =>
                    onUpdateRow?.(record.id, "remark", e.target.value)
                }
            />
        ),
    };

    const faultyColumn: ColumnsType<RowData>[number] = {
        title: "isFaulty",
        dataIndex: "isFaulty",
        key: "isFaulty",
        width: 120,
        render: (_, record) => {
            const isChecked = allFaultyRows.some(
                r => r.row.id === record.id
            );
            return (
                <Checkbox
                    checked={isChecked}
                    onChange={() => openFaultyModal(record)}
                >
                    Faulty
                </Checkbox>
            );
        },
    };

    const allColumns: ColumnsType<RowData> = [
        indexColumn,
        ...dynamicColumns,
        mediaColumn,
        remarkColumn,
        faultyColumn
    ];

    // ✅ FIXED (removed undefined)
    const ALWAYS_VISIBLE = ["media", "remark", "isFaulty"];

    const columns =
        visibleColumns.length > 0
            ? allColumns.filter(
                col =>
                    ALWAYS_VISIBLE.includes(String(col.key)) ||
                    visibleColumns.some(
                        v =>
                            v.toLowerCase() ===
                            String(col.key).toLowerCase()
                    )
            )
            : allColumns;

    return (
        <>
            <div style={{ height: "70vh", overflow: "hidden" }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={false}
                    tableLayout="fixed"
                    scroll={{
                        y: "calc(70vh - 55px)",
                        x: "max-content"
                    }}
                    sticky
                    onScroll={e => {
                        const target = e.currentTarget as HTMLElement;
                        if (
                            target.scrollTop + target.clientHeight >=
                            target.scrollHeight - 100
                        ) {
                            onLoadMore?.();
                        }
                    }}
                />
            </div>

            <FaultySelectorModal
                open={modalOpen}
                row={selectedRow}
                onClose={() => setModalOpen(false)}
                onConfirm={handleFaultyConfirm}
            />
        </>
    );
};

export default MediaTable;

