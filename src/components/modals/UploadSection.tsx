import { Upload, Button, Card, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Dragger } = Upload;
const { Text } = Typography;

type Props = {
  onUpload: (file: File) => void;
  themeMode?: "light" | "dark"; // optional, default to light
};

export const UploadSection: React.FC<Props> = ({ onUpload, themeMode = "light" }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleBeforeUpload = (newFile: File) => {
    setFile(newFile);  // replace old file
    onUpload(newFile); // notify parent
    return false;      // prevent auto upload
  };

  const handleRemove = () => setFile(null);

  // Dynamic colors based on theme
  const colors = {
    light: {
      cardBg: "#fafafa",
      border: "#1890ff",
      text: "#000",
      secondaryText: "#999",
      icon: "#1890ff",
    },
    dark: {
      cardBg: "#1f1f1f",
      border: "#3f86ff",
      text: "#fff",
      secondaryText: "#ccc",
      icon: "#3f86ff",
    },
  };

  const themeColors = themeMode === "dark" ? colors.dark : colors.light;

  return (
    <Card
      style={{
        marginBottom: 20,
        border: `2px dashed ${themeColors.border}`,
        borderRadius: 8,
        textAlign: "center",
        background: themeColors.cardBg,
      }}
    >
      {file ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text strong style={{ color: themeColors.text }}>{file.name}</Text>
          <Button size="small" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <Dragger
          multiple
          showUploadList={false}
          beforeUpload={handleBeforeUpload}
          style={{
            padding: 20,
            background: themeColors.cardBg,  // <--- add this
            border: `2px dashed ${themeColors.border}`, // optional: highlight border inside drag area
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <UploadOutlined style={{ fontSize: 24, color: themeColors.icon }} />
          <p style={{ marginTop: 8, color: themeColors.text }}>Drag file here or click to upload</p>
          <p style={{ color: themeColors.secondaryText, fontSize: 12 }}>Supports CSV/XLSX files</p>
        </Dragger>
      )}
    </Card>
  );
};