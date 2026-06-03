// src/components/modals/MediaDrillView.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
    Modal,
    Collapse,
    Select,
} from "antd";

import { LazyMedia } from "./LazyMedia";
import FaultySelectorModal, { FaultyOn } from "./FaultySelectorModal";
import { GroupGrid } from "./GroupGrid"
import type { RowData } from "../../types/RowData";
import type { FaultyRow } from "./queryDrawer";

type Props = {
    data: RowData[];
    // onLoadMore?: () => void;

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
    // const scrollRef = useRef<HTMLDivElement>(null);
    // useEffect(() => {
    //     const el = scrollRef.current;

    //     if (
    //         el &&
    //         el.scrollHeight <= el.clientHeight
    //     ) {
    //         onLoadMore?.();
    //     }
    // }, [rows.length, onLoadMore]);
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
    console.log("Drill rows:", rows.length);
    console.log("Data prop:", data.length);
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
            >
                <Collapse
                    defaultActiveKey={[]}
                    destroyOnHidden={false}
                    items={groupedData.map(
                        ([group, items]) => ({
                            key: group,
                            label: `${group} (${items.length})`,
                            children: (
                                <GroupGrid
                                    items={items}
                                    mediaField={mediaField}
                                    onSelect={setSelected}
                                    onFaultyClick={handleFaultyClick}
                                    onUpdateRow={handleUpdateRow}
                                    externalUpdateRow={onUpdateRow}
                                />
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
