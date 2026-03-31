import React from "react";
import { Button, Select, Tooltip, Progress } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

type Props = {
  exportMode: "with-media" | "without-media";
  setExportMode: (mode: "with-media" | "without-media") => void;

  onExport: () => void;

  isExporting: boolean;
  progress: number;

  disabled?: boolean;
};

const ExportControls: React.FC<Props> = ({
  exportMode,
  setExportMode,
  onExport,
  isExporting,
  progress,
  disabled,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Select
        value={exportMode}
        onChange={setExportMode}
        options={[
          { label: "Without Media", value: "without-media" },
          { label: "With Media", value: "with-media" },
        ]}
        style={{ width: 180 }}
      />

      <Tooltip title="Embed media thumbnails into exported file">
        <InfoCircleOutlined />
      </Tooltip>

      <Button
        type="primary"
        onClick={onExport}
        loading={isExporting}
        disabled={disabled}
      >
        Export File
      </Button>

      {isExporting && (
        <Progress percent={progress} size="small" style={{ width: 200 }} />
      )}
    </div>
  );
};

export default React.memo(ExportControls);