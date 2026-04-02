import React, { useMemo, useState } from "react";
import { Drawer, Button, Typography, message } from "antd";
import type { RowData } from "../../types/RowData";
import { generateBrandQueries } from "../../utils/generateBrandQueries";

export type FaultyRow = {
  row: RowData & {
    faultyOn: {
      faultyOn: "ADVERTISER_NAME" | "CREATIVE_URL_SUPPLIER" | "OTHER";
      value: string;
    };
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  allFaultyRows: FaultyRow[];
  setAllFaultyRows: (rows: FaultyRow[]) => void;
};

const QueryDrawer: React.FC<Props> = ({
  open,
  onClose,
  allFaultyRows,
//   setAllFaultyRows,
}) => {
  const [copied, setCopied] = useState(false);

  const queryText = useMemo(() => {
    return generateBrandQueries(allFaultyRows);
  }, [allFaultyRows]);

  const handleCopy = () => {
    if (!queryText) return;

    navigator.clipboard.writeText(queryText).then(() => {
      setCopied(true);
      message.success("Query copied to clipboard!");
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Drawer open={open} title="Query Drawer" onClose={onClose} width={600}>
      {allFaultyRows.length === 0 ? (
        <Typography.Text>No faulty rows selected</Typography.Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              lineHeight: 1.6,
              padding: 12,
              border: "2px solid #1890ff",
              borderRadius: 8,
              backgroundColor: "#f0f5ff",
              whiteSpace: "pre-wrap",
            }}
          >
            {queryText}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="primary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>

          </div>
        </div>
      )}
    </Drawer>
  );
};

export default QueryDrawer;