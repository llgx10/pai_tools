// src/components/modals/MediaGrid.tsx
import React, { useState, useEffect } from "react";
import { Card, Modal, Input, Checkbox } from "antd";
import { LazyMedia } from "./LazyMedia";
import FaultySelectorModal, { FaultyOn } from "./FaultySelectorModal";
import type { RowData } from "../../types/RowData";
import type { FaultyRow } from "./queryDrawer";

type Props = {
    data: RowData[];
    onLoadMore?: () => void;
    allFaultyRows: FaultyRow[];
    setAllFaultyRows: React.Dispatch<React.SetStateAction<FaultyRow[]>>;
    onUpdateRow?: (id: string | number, field: string, value: any) => void;
    faultyMode: "legacy" | "advanced"; // ✅ ADD
};

export const MediaGrid: React.FC<Props> = ({
    data,
    onLoadMore,
    allFaultyRows,
    setAllFaultyRows,
    onUpdateRow,
    faultyMode,
}) => {
    const [rows, setRows] = useState<RowData[]>(data);
    const [selected, setSelected] = useState<RowData | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRow, setModalRow] = useState<RowData | null>(null);

    useEffect(() => {
        setRows(data);
    }, [data]);

    // 🔧 Update row locally
    const handleUpdateRow = (id: string | number, field: string, value: any) => {
        setRows((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    // 🔧 Toggle faulty checkbox
    const handleFaultyClick = (row: RowData) => {
        const existing = allFaultyRows.find((r) => r.row.id === row.id);

        // ================= LEGACY MODE =================
        if (faultyMode === "legacy") {
            if (existing) {
                // ❌ REMOVE
                setAllFaultyRows((prev) =>
                    prev.filter((r) => r.row.id !== row.id)
                );

                handleUpdateRow(row.id, "isFaulty", false);
                handleUpdateRow(row.id, "faultyOn", undefined);

                onUpdateRow?.(row.id, "isFaulty", false);
                onUpdateRow?.(row.id, "faultyOn", undefined);
            } else {
                const faultyOn: FaultyOn = {
                    faultyOn: "OTHER",
                    value: "legacy_toggle",
                };

                const updated: FaultyRow = {
                    row: { ...row, isFaulty: true, faultyOn },
                };

                setAllFaultyRows((prev) => [...prev, updated]);

                handleUpdateRow(row.id, "isFaulty", true);

                onUpdateRow?.(row.id, "isFaulty", true);
                onUpdateRow?.(row.id, "faultyOn", faultyOn);
            }

            return; // 🚨 stop (no modal)
        }

        // ================= ADVANCED MODE (existing behavior) =================
        if (existing) {
            // ❌ REMOVE
            setAllFaultyRows((prev) =>
                prev.filter((r) => r.row.id !== row.id)
            );

            handleUpdateRow(row.id, "isFaulty", false);
            handleUpdateRow(row.id, "faultyOn", undefined);

            onUpdateRow?.(row.id, "isFaulty", false);
            onUpdateRow?.(row.id, "faultyOn", undefined);
        } else {
            // ✅ OPEN modal
            setModalRow(row);
            setModalOpen(true);
        }
    };

    // 🔧 Confirm faulty selection
    const handleModalConfirm = (rowId: string | number, faultyOn: FaultyOn) => {
        const row = rows.find((r) => r.id === rowId);
        if (!row) return;

        const updated: FaultyRow = {
            row: { ...row, faultyOn },
        };

        setAllFaultyRows((prev) => {
            const exists = prev.find((r) => r.row.id === rowId);
            if (exists) {
                return prev.map((r) =>
                    r.row.id === rowId ? updated : r
                );
            }
            return [...prev, updated];
        });

        // ✅ update LOCAL
        handleUpdateRow(rowId, "isFaulty", true);

        // 🔥 update PARENT (THIS FIXES EXPORT)
        onUpdateRow?.(rowId, "isFaulty", true);
        onUpdateRow?.(rowId, "faultyOn", faultyOn);

        setModalOpen(false);
    };

    useEffect(() => {
        setAllFaultyRows((prev) =>
            prev.map((f) => {
                const updatedRow = rows.find((r) => r.id === f.row.id);
                if (!updatedRow) return f;

                return {
                    ...f,
                    row: {
                        ...updatedRow,
                        faultyOn: f.row.faultyOn, // ✅ preserve required field
                    },
                };
            })
        );
    }, [rows, setAllFaultyRows]);

    const HIDDEN_FIELDS = ["__search"];

    return (
        <>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))",
                    gap: 16,
                    maxHeight: "70vh",
                    overflowY: "auto",
                    paddingRight: 10,
                }}
                onScroll={(e) => {
                    const target = e.currentTarget;
                    if (
                        target.scrollTop + target.clientHeight >=
                        target.scrollHeight - 200
                    ) {
                        onLoadMore?.();
                    }
                }}
            >
                {rows.map((row, index) => {
                    const mediaUrl =
                        row.CREATIVE_URL_SUPPLIER || row.media || "";

                    const isChecked = !!row.isFaulty;

                    return (
                        <Card
                            key={row.id}
                            hoverable
                            bodyStyle={{ padding: 10 }}
                            onClick={() => setSelected(row)}
                            cover={
                                <div
                                    style={{
                                        aspectRatio: "9/16",
                                        overflow: "hidden",
                                        background: "#f5f5f5",
                                    }}
                                >
                                    <LazyMedia url={mediaUrl} disableLink />
                                </div>
                            }
                        >
                            {/* Index + Advertiser */}
                            <div style={{ fontWeight: 600 }}>
                                {index + 1}.{" "}
                                {row.ADVERTISER_NAME || "Unknown"}
                            </div>

                            <div style={{ fontSize: 12 }}>
                                {row.BRAND}
                            </div>

                            {/* Controls */}
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginTop: 6 }}
                            >
                                <Input
                                    placeholder="Add remark"
                                    value={row.remark || ""}
                                    onChange={(e) => {
                                        handleUpdateRow(row.id, "remark", e.target.value);
                                        onUpdateRow?.(row.id, "remark", e.target.value);
                                    }}
                                />

                                <Checkbox
                                    style={{ marginTop: 6 }}
                                    checked={isChecked}
                                    onChange={() =>
                                        handleFaultyClick(row)
                                    }
                                >
                                    Faulty
                                </Checkbox>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Preview Modal */}
            <Modal
                open={!!selected}
                onCancel={() => setSelected(null)}
                footer={null}
                width={900}
            >
                {selected && (
                    <>
                        <div
                            style={{
                                marginBottom: 20,
                                aspectRatio: "9/16",
                                maxHeight: 500,
                                overflow: "hidden",
                            }}
                        >
                            <LazyMedia
                                url={
                                    selected.CREATIVE_URL_SUPPLIER ||
                                    selected.media ||
                                    ""
                                }
                                disableLink={false}
                            />
                        </div>

                        {Object.entries(selected)
                            .filter(
                                ([key]) => !HIDDEN_FIELDS.includes(key)
                            )
                            .map(([key, value]) => (
                                <div
                                    key={key}
                                    style={{
                                        marginBottom: 8,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    <b>{key}</b>: {String(value)}
                                </div>
                            ))}
                    </>
                )}
            </Modal>

            {/* Faulty Selector Modal */}
            <FaultySelectorModal
                open={modalOpen}
                row={modalRow}
                onClose={() => setModalOpen(false)}
                onConfirm={handleModalConfirm}
            />
        </>
    );
};

export default MediaGrid;