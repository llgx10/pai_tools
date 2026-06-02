// src/components/modals/MediaDrillView.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    Modal,
    Input,
    Checkbox,
    Collapse,
    Select,
} from "antd";

import { LazyMedia } from "./LazyMedia";
import FaultySelectorModal, { FaultyOn } from "./FaultySelectorModal";

import type { RowData } from "../../types/RowData";
import type { FaultyRow } from "./queryDrawer";

type Props = {
    data: RowData[];
    onLoadMore?: () => void;

    allFaultyRows: FaultyRow[];
    setAllFaultyRows: React.Dispatch<
        React.SetStateAction<FaultyRow[]>
    >;

    onUpdateRow?: (
        id: string | number,
        field: string,
        value: any
    ) => void;

    faultyMode: "legacy" | "advanced";
    mediaField: string;
};

const MediaDrill: React.FC<Props> = ({
    data,
    onLoadMore,
    allFaultyRows,
    setAllFaultyRows,
    onUpdateRow,
    faultyMode,
    mediaField
}) => {
    const [rows, setRows] = useState<RowData[]>(data);

    const [selected, setSelected] =
        useState<RowData | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalRow, setModalRow] =
        useState<RowData | null>(null);

    const [groupBy, setGroupBy] = useState<
        "ADVERTISER_NAME" | "BRAND"
    >("ADVERTISER_NAME");

    useEffect(() => {
        setRows(data);
    }, [data]);

    const handleUpdateRow = (
        id: string | number,
        field: string,
        value: any
    ) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? { ...row, [field]: value }
                    : row
            )
        );
    };

    const handleFaultyClick = (row: RowData) => {
        const existing = allFaultyRows.find(
            (r) => r.row.id === row.id
        );

        if (faultyMode === "legacy") {
            if (existing) {
                setAllFaultyRows((prev) =>
                    prev.filter(
                        (r) => r.row.id !== row.id
                    )
                );

                handleUpdateRow(
                    row.id,
                    "isFaulty",
                    false
                );

                onUpdateRow?.(
                    row.id,
                    "isFaulty",
                    false
                );

                onUpdateRow?.(
                    row.id,
                    "faultyOn",
                    undefined
                );
            } else {
                const faultyOn: FaultyOn = {
                    faultyOn: "OTHER",
                    value: "legacy_toggle",
                };

                setAllFaultyRows((prev) => [
                    ...prev,
                    {
                        row: {
                            ...row,
                            isFaulty: true,
                            faultyOn,
                        },
                    },
                ]);

                handleUpdateRow(
                    row.id,
                    "isFaulty",
                    true
                );

                onUpdateRow?.(
                    row.id,
                    "isFaulty",
                    true
                );

                onUpdateRow?.(
                    row.id,
                    "faultyOn",
                    faultyOn
                );
            }

            return;
        }

        if (existing) {
            setAllFaultyRows((prev) =>
                prev.filter(
                    (r) => r.row.id !== row.id
                )
            );

            handleUpdateRow(
                row.id,
                "isFaulty",
                false
            );

            onUpdateRow?.(
                row.id,
                "isFaulty",
                false
            );

            onUpdateRow?.(
                row.id,
                "faultyOn",
                undefined
            );
        } else {
            setModalRow(row);
            setModalOpen(true);
        }
    };

    const handleModalConfirm = (
        rowId: string | number,
        faultyOn: FaultyOn
    ) => {
        const row = rows.find(
            (r) => r.id === rowId
        );

        if (!row) return;

        const updated: FaultyRow = {
            row: {
                ...row,
                isFaulty: true,
                faultyOn,
            },
        };

        setAllFaultyRows((prev) => {
            const exists = prev.find(
                (r) => r.row.id === rowId
            );

            if (exists) {
                return prev.map((r) =>
                    r.row.id === rowId
                        ? updated
                        : r
                );
            }

            return [...prev, updated];
        });

        handleUpdateRow(
            rowId,
            "isFaulty",
            true
        );

        onUpdateRow?.(
            rowId,
            "isFaulty",
            true
        );

        onUpdateRow?.(
            rowId,
            "faultyOn",
            faultyOn
        );

        setModalOpen(false);
    };

    useEffect(() => {
        setAllFaultyRows((prev) =>
            prev.map((f) => {
                const updatedRow = rows.find(
                    (r) => r.id === f.row.id
                );

                if (!updatedRow) return f;

                return {
                    ...f,
                    row: {
                        ...updatedRow,
                        faultyOn:
                            f.row.faultyOn,
                    },
                };
            })
        );
    }, [rows, setAllFaultyRows]);

    const groupedData = useMemo(() => {
        const groups: Record<
            string,
            RowData[]
        > = {};

        rows.forEach((row) => {
            const key = String(
                row[groupBy] || "Unknown"
            );

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(row);
        });

        return Object.entries(groups).sort(
            (a, b) =>
                b[1].length - a[1].length
        );
    }, [rows, groupBy]);

    const HIDDEN_FIELDS = ["__search"];

    return (
        <>
            <div
                style={{
                    marginBottom: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                }}
            >
                <span>Group By:</span>

                <Select
                    value={groupBy}
                    style={{ width: 220 }}
                    onChange={(value) =>
                        setGroupBy(value)
                    }
                    options={[
                        {
                            label:
                                "Advertiser",
                            value:
                                "ADVERTISER_NAME",
                        },
                        {
                            label: "Brand",
                            value: "BRAND",
                        },
                    ]}
                />
            </div>

            <div
                style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
                onScroll={(e) => {
                    const target =
                        e.currentTarget;

                    if (
                        target.scrollTop +
                        target.clientHeight >=
                        target.scrollHeight -
                        200
                    ) {
                        onLoadMore?.();
                    }
                }}
            >
                <Collapse
                    defaultActiveKey={groupedData.map(
                        ([group]) => group
                    )}
                    items={groupedData.map(
                        ([group, items]) => ({
                            key: group,
                            label: `${group} (${items.length})`,
                            children: (
                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fill,minmax(260px,1fr))",
                                        gap: 16,
                                    }}
                                >
                                    {items.map(
                                        (
                                            row,
                                            index
                                        ) => {
                                            const mediaUrl =
                                                row[mediaField as keyof RowData] ||
                                                row.CREATIVE_URL_SUPPLIER ||
                                                row.media ||
                                                "";

                                            return (
                                                <Card
                                                    key={
                                                        row.id
                                                    }
                                                    hoverable
                                                    bodyStyle={{
                                                        padding: 10,
                                                    }}
                                                    onClick={() =>
                                                        setSelected(
                                                            row
                                                        )
                                                    }
                                                    cover={
                                                        <div
                                                            style={{
                                                                aspectRatio:
                                                                    "9/16",
                                                                overflow:
                                                                    "hidden",
                                                                background:
                                                                    "#f5f5f5",
                                                            }}
                                                        >
                                                            <LazyMedia
                                                                url={
                                                                    mediaUrl
                                                                }
                                                                disableLink
                                                            />
                                                        </div>
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {index +
                                                            1}

                                                        .{" "}
                                                        {row.ADVERTISER_NAME ||
                                                            "Unknown"}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {
                                                            row.BRAND
                                                        }
                                                    </div>

                                                    <div
                                                        onClick={(
                                                            e
                                                        ) =>
                                                            e.stopPropagation()
                                                        }
                                                        style={{
                                                            marginTop: 6,
                                                        }}
                                                    >
                                                        <Input
                                                            placeholder="Add remark"
                                                            value={
                                                                row.remark ||
                                                                ""
                                                            }
                                                            onChange={(
                                                                e
                                                            ) => {
                                                                handleUpdateRow(
                                                                    row.id,
                                                                    "remark",
                                                                    e
                                                                        .target
                                                                        .value
                                                                );

                                                                onUpdateRow?.(
                                                                    row.id,
                                                                    "remark",
                                                                    e
                                                                        .target
                                                                        .value
                                                                );
                                                            }}
                                                        />

                                                        <Checkbox
                                                            style={{
                                                                marginTop: 6,
                                                            }}
                                                            checked={
                                                                !!row.isFaulty
                                                            }
                                                            onChange={() =>
                                                                handleFaultyClick(
                                                                    row
                                                                )
                                                            }
                                                        >
                                                            Faulty
                                                        </Checkbox>
                                                    </div>
                                                </Card>
                                            );
                                        }
                                    )}
                                </div>
                            ),
                        })
                    )}
                />
            </div>

            <Modal
                open={!!selected}
                onCancel={() =>
                    setSelected(null)
                }
                footer={null}
                width={900}
            >
                {selected && (
                    <>
                        <div
                            style={{
                                marginBottom: 20,
                                maxHeight: "80vh",
                                overflow: "auto",
                                textAlign: "center",
                            }}
                        >
                            <LazyMedia
                                url={
                                    selected[mediaField as keyof RowData] ||
                                    selected.CREATIVE_URL_SUPPLIER ||
                                    selected.media ||
                                    ""
                                }
                                disableLink={false}
                            />
                        </div>

                        {Object.entries(
                            selected
                        )
                            .filter(
                                ([key]) =>
                                    !HIDDEN_FIELDS.includes(
                                        key
                                    )
                            )
                            .map(
                                ([
                                    key,
                                    value,
                                ]) => (
                                    <div
                                        key={
                                            key
                                        }
                                        style={{
                                            marginBottom: 8,
                                            wordBreak:
                                                "break-word",
                                        }}
                                    >
                                        <b>
                                            {
                                                key
                                            }
                                        </b>
                                        :{" "}
                                        {String(
                                            value
                                        )}
                                    </div>
                                )
                            )}
                    </>
                )}
            </Modal>

            <FaultySelectorModal
                open={modalOpen}
                row={modalRow}
                onClose={() =>
                    setModalOpen(false)
                }
                onConfirm={
                    handleModalConfirm
                }
            />
        </>
    );
};

export default MediaDrill;