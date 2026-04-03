// src/components/modals/FaultySelectorModal.tsx
import React, { useState, useEffect } from "react";
import { Modal, Radio, Input, Button } from "antd";
import type { RowData } from "../../types/RowData";

// Ensure faultyOn matches RowData type
export type FaultyOn = {
  faultyOn: "ADVERTISER_NAME" | "CREATIVE_URL_SUPPLIER" | "OTHER";
  value: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  row: RowData | null;
  onConfirm: (rowId: string | number, faultyOn: FaultyOn) => void;
};

const FaultySelectorModal: React.FC<Props> = ({ open, onClose, row, onConfirm }) => {
  const [selectedColumn, setSelectedColumn] = useState<"ADVERTISER_NAME" | "CREATIVE_URL_SUPPLIER" | "OTHER">("ADVERTISER_NAME");
  const [otherValue, setOtherValue] = useState("");

  // Reset modal state when opening
  useEffect(() => {
    if (open) {
      setSelectedColumn("ADVERTISER_NAME");
      setOtherValue("");
    }
  }, [open]);

  if (!row) return null;

  const handleConfirmClick = () => {
    let faultyObj: FaultyOn;

    if (selectedColumn === "ADVERTISER_NAME") {
      faultyObj = { faultyOn: "ADVERTISER_NAME", value: row.ADVERTISER_NAME || "" };
    } else if (selectedColumn === "CREATIVE_URL_SUPPLIER") {
      faultyObj = { faultyOn: "CREATIVE_URL_SUPPLIER", value: row.CREATIVE_URL_SUPPLIER || "" };
    } else {
      faultyObj = { faultyOn: "OTHER", value: otherValue };
    }

    onConfirm(row.id, faultyObj);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Select Faulty Column"
      onCancel={onClose}
      centered
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="ok" type="primary" onClick={handleConfirmClick}>
          Confirm
        </Button>,
      ]}
    >
      <Radio.Group
        value={selectedColumn}
        onChange={(e) => setSelectedColumn(e.target.value)}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="ADVERTISER_NAME">ADVERTISER_NAME</Radio.Button>
        <Radio.Button value="CREATIVE_URL_SUPPLIER">CREATIVE_URL_SUPPLIER</Radio.Button>
        <Radio.Button value="OTHER">OTHER</Radio.Button>
      </Radio.Group>

      {/* VALUE DISPLAY */}
      <div style={{ marginTop: 16 }}>

        {selectedColumn === "ADVERTISER_NAME" && (
          <div
            style={{
              padding: 10,
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              background: "#fafafa",
              wordBreak: "break-word",
            }}
          >
            {row.ADVERTISER_NAME || "Empty"}
          </div>
        )}

        {selectedColumn === "CREATIVE_URL_SUPPLIER" && (
          <div
            style={{
              padding: 10,
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              background: "#fafafa",
              wordBreak: "break-word",
            }}
          >
            {row.CREATIVE_URL_SUPPLIER || "Empty"}
          </div>
        )}

        {selectedColumn === "OTHER" && (
          <Input
            placeholder="Enter keyword"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            style={{ marginTop: 8 }}
          />
        )}

      </div>

      {selectedColumn === "OTHER" && (
        <Input
          placeholder="Enter keyword"
          value={otherValue}
          onChange={(e) => setOtherValue(e.target.value)}
          style={{ marginTop: 12 }}
        />
      )}
    </Modal>
  );
};

export default FaultySelectorModal;