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
  setAllFaultyRows: (rows: FaultyRow[]) => void;
};

export const MediaGrid: React.FC<Props> = ({
  data,
  onLoadMore,
  allFaultyRows,
  setAllFaultyRows,
}) => {
  const [rows, setRows] = useState<RowData[]>(data);
  const [selected, setSelected] = useState<RowData | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<RowData | null>(null);

  useEffect(() => {
    setRows(data);
  }, [data]);

  const handleUpdateRow = (id: string | number, field: string, value: any) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // ⚡ Checkbox click: either remove or open modal
  const handleFaultyClick = (row: RowData) => {
    const isChecked = allFaultyRows.some((r) => r.row.id === row.id);
    if (isChecked) {
      // Remove faulty
      setAllFaultyRows(allFaultyRows.filter((r) => r.row.id !== row.id));
      handleUpdateRow(row.id, "isFaulty", false);
    } else {
      // Open modal to pick column
      setModalRow(row);
      setModalOpen(true);
    }
  };

  // Called when modal confirms a faulty column
  const handleModalConfirm = (rowId: string | number, faultyOn: FaultyOn) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    setAllFaultyRows([
      ...allFaultyRows,
      { row: { ...row, faultyOn } },
    ]);
    handleUpdateRow(rowId, "isFaulty", true);
  };

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
          if (target.scrollTop + target.clientHeight >= target.scrollHeight - 200) {
            onLoadMore?.();
          }
        }}
      >
        {rows.map((row) => {
          const mediaUrl = row.CREATIVE_URL_SUPPLIER || row.media || "";
          const isChecked = allFaultyRows.some((r) => r.row.id === row.id);

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
              <div style={{ fontWeight: 600 }}>{row.ADVERTISER_NAME || "Unknown"}</div>
              <div style={{ fontSize: 12 }}>{row.BRAND}</div>
              {/* {row.CREATIVE_CAMPAIGN_NAME && <Tag style={{ marginTop: 6 }}>{row.CREATIVE_CAMPAIGN_NAME}</Tag>} */}

              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 6 }}>
                <Input
                  placeholder="Add remark"
                  value={row.remark || ""}
                  onChange={(e) => handleUpdateRow(row.id, "remark", e.target.value)}
                />
                <Checkbox
                  style={{ marginTop: 6 }}
                  checked={isChecked}
                  onChange={() => handleFaultyClick(row)}
                >
                  Faulty
                </Checkbox>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} width={900}>
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
              <LazyMedia url={selected.CREATIVE_URL_SUPPLIER || selected.media || ""} disableLink={false} />
            </div>
            {Object.entries(selected)
              .filter(([key]) => !HIDDEN_FIELDS.includes(key))
              .map(([key, value]) => (
                <div key={key} style={{ marginBottom: 8, wordBreak: "break-word" }}>
                  <b>{key}</b>: {String(value)}
                </div>
              ))}
          </>
        )}
      </Modal>

      {/* ⚡ FaultySelectorModal */}
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