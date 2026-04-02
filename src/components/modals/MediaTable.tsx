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
};

export const MediaTable: React.FC<Props> = ({
    data,
    visibleColumns = [],
    onLoadMore,
    onUpdateRow,
    allFaultyRows,
    setAllFaultyRows,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<RowData | null>(null);

    const openFaultyModal = (row: RowData) => {
        const isChecked = allFaultyRows.some(r => r.row.id === row.id);
        if (isChecked) {
            // Remove faulty immediately
            setAllFaultyRows(allFaultyRows.filter(r => r.row.id !== row.id));
            onUpdateRow?.(row.id, "isFaulty", false);
        } else {
            // Open modal to mark faulty
            setSelectedRow(row);
            setModalOpen(true);
        }
    };

    const handleFaultyConfirm = (rowId: string | number, faultyOn: FaultyOn) => {
        onUpdateRow?.(rowId, "isFaulty", true);

        const filtered = allFaultyRows.filter(r => r.row.id !== rowId);
        setAllFaultyRows([...filtered, { row: { ...data.find(r => r.id === rowId)!, faultyOn } }]);
    };

    const dataKeys = data.length ? Object.keys(data[0]) : [];
    const cellStyle = { whiteSpace: "normal" as const, wordBreak: "break-word" as const, maxWidth: 250 };

    const indexColumn: ColumnsType<RowData>[number] = { title: "#", key: "index", width: 60, fixed: "left", render: (_, __, i) => i + 1 };

    const dynamicColumns: ColumnsType<RowData> = dataKeys
        .filter(key => !["media", "remark", "isFaulty"].includes(key))
        .map(key => ({
            title: key,
            dataIndex: key,
            key,
            onCell: () => ({ style: cellStyle }),
            sorter: (a, b) =>
                String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, { numeric: true }),
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
        render: (_, record) => <Input value={record.remark} onChange={e => onUpdateRow?.(record.id, "remark", e.target.value)} />,
    };

    const faultyColumn: ColumnsType<RowData>[number] = {
        title: "isFaulty",
        dataIndex: "isFaulty",
        key: "isFaulty",
        width: 120,
        render: (_, record) => {
            const isChecked = allFaultyRows.some(r => r.row.id === record.id);
            return (
                <Checkbox checked={isChecked} onChange={() => openFaultyModal(record)}>
                    Faulty
                </Checkbox>
            );
        },
    };

    const allColumns: ColumnsType<RowData> = [indexColumn, ...dynamicColumns, mediaColumn, remarkColumn, faultyColumn];

    const ALWAYS_VISIBLE = ["media", "remark", "isFaulty"];
    const columns =
        visibleColumns.length > 0
            ? allColumns.filter(
                col =>
                    ALWAYS_VISIBLE.includes(String(col.key)) ||
                    visibleColumns.some(v => v.toLowerCase() === String(col.key).toLowerCase())
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
                    scroll={{ y: "calc(70vh - 55px)", x: "max-content" }}
                    sticky
                    onScroll={e => {
                        const target = e.currentTarget as HTMLElement;
                        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
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