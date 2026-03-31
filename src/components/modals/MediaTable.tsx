import React from "react";
import { Table, Input, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LazyMedia } from "./LazyMedia";
import type { RowData } from "../../types/RowData";

type Props = {
    data: RowData[];
    visibleColumns?: string[];
    onLoadMore?: () => void;
    onUpdateRow?: (id: string | number, field: string, value: any) => void;
};

export const MediaTable: React.FC<Props> = ({
    data,
    visibleColumns = [],
    onLoadMore,
    onUpdateRow,
}) => {
    const dataKeys = data.length ? Object.keys(data[0]) : [];

    const cellStyle = {
        whiteSpace: "normal" as const,
        wordBreak: "break-word" as const,
        maxWidth: 250,
    };

    // Index column
    const indexColumn: ColumnsType<RowData>[number] = {
        title: "#",
        key: "index",
        width: 60,
        fixed: "left",
        render: (_: any, __: RowData, index: number) => index + 1,
    };

    // Dynamic columns (excluding special)
    const dynamicColumns: ColumnsType<RowData> = dataKeys
        .filter((key) => !["media", "remark", "isFaulty"].includes(key))
        .map((key) => ({
            title: key,
            dataIndex: key,
            key,
            onCell: () => ({ style: cellStyle }),
            sorter: (a, b) =>
                String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, {
                    numeric: true,
                }),
        }));

    // Media column
    const mediaColumn: ColumnsType<RowData>[number] = {
        title: "media",
        dataIndex: "media",
        key: "media",
        width: 320,
        fixed: "left",
        render: (v?: string) => <LazyMedia url={v} />,
        onCell: () => ({ style: cellStyle }),
    };

    // Remark column
    const remarkColumn: ColumnsType<RowData>[number] = {
        title: "remark",
        dataIndex: "remark",
        key: "remark",
        width: 200,
        render: (_: any, record) => (
            <Input
                value={record.remark}
                onChange={(e) =>
                    onUpdateRow?.(record.id, "remark", e.target.value)
                }
            />
        ),
    };

    // Faulty column
    const faultyColumn: ColumnsType<RowData>[number] = {
        title: "isFaulty",
        dataIndex: "isFaulty",
        key: "isFaulty",
        width: 120,
        render: (_: any, record) => (
            <Checkbox
                checked={record.isFaulty}
                onChange={() =>
                    onUpdateRow?.(record.id, "isFaulty", !record.isFaulty)
                }
            />
        ),
    };

    // Combine columns
    const allColumns: ColumnsType<RowData> = [
        indexColumn,
        ...dynamicColumns,
        mediaColumn,
        remarkColumn,
        faultyColumn,
    ];

    // Always visible special columns
    const ALWAYS_VISIBLE = ["media", "remark", "isFaulty"];

    const columns =
        visibleColumns.length > 0
            ? allColumns.filter(
                  (col) =>
                      ALWAYS_VISIBLE.includes(String(col.key)) ||
                      visibleColumns.some(
                          (v) =>
                              v.toLowerCase() === String(col.key).toLowerCase()
                      )
              )
            : allColumns;

    return (
        <div style={{ height: "70vh", overflow: "hidden" }}>
            <Table<RowData>
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={false}
                tableLayout="fixed"
                scroll={{ y: "calc(70vh - 55px)", x: "max-content" }}
                sticky
                onScroll={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
                        onLoadMore?.();
                    }
                }}
            />
        </div>
    );
};