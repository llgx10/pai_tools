import React, { useState, useEffect } from "react";
import Header from "../modals/Headers";
import { Input, Button, Select, Space, Card } from "antd";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy, dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Trash2 } from "lucide-react";

const { TextArea } = Input;
const { Option } = Select;

const columns = [
  "ADVERTISER_NAME",
  "CREATIVE_CAMPAIGN_NAME",
  "CREATIVE_LANDINGPAGE_URL",
  "CREATIVE_VIDEO_TITLE",
  "SOCIAL_CAMPAIGN_TEXT",
  "SOCIAL_PAGE_NAME",
  "SOCIAL_HEADLINE_TEXT",
  "SOCIAL_DESCRIPTION",
];

type Exclusion = {
  column: string;
  keywords: string;
};

type Inclusion = {
  column: string;
  keywords: string;
  type: "IN" | "REGEXP_CONTAINS";
  connector: "AND" | "OR";
};

type UrlExclusion = {
  type: "NOT IN" | "NOT REGEXP_CONTAINS";
  urls: string;
};

const QueryBuilder: React.FC = () => {
  const [baseKeywords, setBaseKeywords] = useState("");
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [inclusions, setInclusions] = useState<Inclusion[]>([]);
  const [urlExclusion, setUrlExclusion] = useState<UrlExclusion>({
    type: "NOT IN",
    urls: "",
  });
  const [result, setResult] = useState("");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Update body background on theme change
  useEffect(() => {
    document.body.style.backgroundColor = themeMode === "light" ? "#f0f0f0" : "#121212";
    document.body.style.color = themeMode === "light" ? "#000" : "#f0f0f0";
  }, [themeMode]);

  // Add / Remove handlers
  const handleAddExclusion = () =>
    setExclusions([...exclusions, { column: columns[0], keywords: "" }]);
  const handleAddInclusion = () =>
    setInclusions([...inclusions, { column: columns[0], keywords: "", type: "IN", connector: "AND" }]);
  const handleRemoveExclusion = (index: number) => setExclusions(exclusions.filter((_, i) => i !== index));
  const handleRemoveInclusion = (index: number) => setInclusions(inclusions.filter((_, i) => i !== index));

  const handleExclusionChange = (index: number, field: keyof Exclusion, value: string) => {
    const newExclusions = [...exclusions];
    newExclusions[index][field] = value;
    setExclusions(newExclusions);
  };

  const handleInclusionChange = (
    index: number,
    field: keyof Inclusion,
    value: string | Inclusion["type"] | Inclusion["connector"]
  ) => {
    const newInclusions = [...inclusions];
    if (field === "type" && (value === "IN" || value === "REGEXP_CONTAINS")) {
      newInclusions[index][field] = value as Inclusion["type"];
    } else if (field === "connector" && (value === "AND" || value === "OR")) {
      newInclusions[index][field] = value as Inclusion["connector"];
    } else if (field === "column" || field === "keywords") {
      newInclusions[index][field] = value as string;
    }
    setInclusions(newInclusions);
  };

  const processUrlExclusion = (urls: string) =>
    urls
      .split(",")
      .map((u) =>
        u
          .replace("https://ads.adclarity.com/creatives/", "")
          .replace("https://ads.adclarity.com/creatives_capture/", "")
          .replace("_video", "")
          .replace(".mp4", "")
          .replace(".jpeg", "")
          .replace(".gif", "")
          .trim()
      )
      .filter(Boolean)
      .join("|");

  const generateQuery = () => {
    const baseArr = baseKeywords.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean);

    let query = "";

    // Base Keywords
    if (baseArr.length > 0) {
      const pattern = baseArr.join("|");
      query += `( REGEXP_CONTAINS(UPPER(ADVERTISER_NAME), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_CAMPAIGN_NAME,'')), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(CREATIVE_LANDINGPAGE_URL), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_VIDEO_TITLE,'')), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_CAMPAIGN_TEXT,'')), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(SOCIAL_PAGE_NAME), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_HEADLINE_TEXT,'')), "${pattern}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_DESCRIPTION,'')), "${pattern}") )`;
    }


    // Inclusions
    if (inclusions.length > 0) {
      const incStatements: string[] = inclusions
        .map((inc) => {
          const arr = inc.keywords.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean);
          if (arr.length === 0) return "";
          if (inc.type === "IN") {
            return `${inc.column} IN (${arr.map((v) => `"${v}"`).join(",")})`;
          } else {
            return `REGEXP_CONTAINS(UPPER(COALESCE(${inc.column},'')), "${arr.join("|")}")`;
          }
        })
        .filter(Boolean);

      if (incStatements.length > 0) {
        // join all statements with their connector
        const combined = incStatements
          .map((stmt, idx) => (idx === 0 ? stmt : `${inclusions[idx].connector} ${stmt}`))
          .join("\n  ");
        query += `\nAND (\n  ${combined}\n)`;
      }
    }


    // Exclusions
    exclusions.forEach((ex) => {
      const exArr = ex.keywords.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean);
      if (exArr.length > 0) {
        query += `\nAND NOT REGEXP_CONTAINS(UPPER(COALESCE(${ex.column},'')), "${exArr.join("|")}")`;
      }
    });

    // URL Exclusion
    const urlArr = urlExclusion.urls.split(",").map((u) => u.trim()).filter(Boolean);
    if (urlArr.length > 0) {
      if (urlExclusion.type === "NOT IN") {
        const quoted = urlArr.map((u) => `"${u}"`).join(",");
        query += `\nAND CREATIVE_URL_SUPPLIER NOT IN (${quoted})`;
      } else {
        const pattern = processUrlExclusion(urlExclusion.urls);
        if (pattern)
          query += `\nAND NOT REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_URL_SUPPLIER,'')), "${pattern}")`;
      }
    }

    setResult(query);
  };

  const floatButtonStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 20,
    right: 20,
    borderRadius: "50%",
    width: 50,
    height: 50,
    fontSize: 24,
    cursor: "pointer",
    backgroundColor: themeMode === "light" ? "#333" : "#f0f0f0",
    color: themeMode === "light" ? "#fff" : "#000",
    border: "none",
    zIndex: 1000,
  };

  const cardBg = themeMode === "light" ? "#fff" : "#1e1e1e";
  const cardColor = themeMode === "light" ? "#000" : "#f0f0f0";

  const rowStyle = (color: string) => ({
    padding: 10,
    borderRadius: 8,
    backgroundColor: color,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
  });

  return (
    <div>
      <Header />

      <Card
        title={<span style={{ color: cardColor }}>Query Builder</span>}
        style={{ maxWidth: 900, margin: "20px auto", backgroundColor: cardBg, color: cardColor }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Base Keywords */}
          <div>
            <label>Base Keywords (comma-separated)</label>
            <TextArea rows={4} value={baseKeywords} onChange={(e) => setBaseKeywords(e.target.value)} style={{ marginTop: 4 }} />
          </div>

          {/* Inclusions */}
          <div>
            <label>Inclusions (IN / REGEXP_CONTAINS)</label>
            {inclusions.map((inc, idx) => (
              <div key={idx} style={rowStyle("#d4fcd4")}>
                <Select value={inc.connector} onChange={(val) => handleInclusionChange(idx, "connector", val)} style={{ width: 80 }}>
                  <Option value="AND">AND</Option>
                  <Option value="OR">OR</Option>
                </Select>
                <Select value={inc.column} onChange={(val) => handleInclusionChange(idx, "column", val)} style={{ flex: 1 }}>
                  {columns.map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
                <Select value={inc.type} onChange={(val) => handleInclusionChange(idx, "type", val)} style={{ width: 160 }}>
                  <Option value="IN">IN</Option>
                  <Option value="REGEXP_CONTAINS">REGEXP_CONTAINS</Option>
                </Select>
                <Input
                  placeholder="Comma-separated keywords"
                  value={inc.keywords}
                  onChange={(e) => handleInclusionChange(idx, "keywords", e.target.value)}
                  style={{ flex: 2 }}
                />
                <Trash2 size={20} color="red" style={{ cursor: "pointer" }} onClick={() => handleRemoveInclusion(idx)} />
              </div>
            ))}
            <Button onClick={handleAddInclusion} type="dashed">Add Inclusion</Button>
          </div>

          {/* Exclusions */}
          <div>
            <label>Exclusions (AND NOT REGEXP_CONTAINS)</label>
            {exclusions.map((ex, idx) => (
              <div key={idx} style={rowStyle("#ffdada")}>
                <Select value={ex.column} onChange={(val) => handleExclusionChange(idx, "column", val)} style={{ flex: 1 }}>
                  {columns.map((c) => (
                    <Option key={c} value={c}>{c}</Option>
                  ))}
                </Select>
                <Input
                  placeholder="Comma-separated keywords"
                  value={ex.keywords}
                  onChange={(e) => handleExclusionChange(idx, "keywords", e.target.value)}
                  style={{ flex: 2 }}
                />
                <Trash2 size={20} color="red" style={{ cursor: "pointer" }} onClick={() => handleRemoveExclusion(idx)} />
              </div>
            ))}
            <Button onClick={handleAddExclusion} type="dashed">Add Exclusion</Button>
          </div>

          {/* URL Exclusion */}
          <div>
            <label>CREATIVE_URL_SUPPLIER Exclusion</label>
            <Space direction="vertical" style={{ width: "100%", marginBottom: 8 }}>
              <Select value={urlExclusion.type} onChange={(val) => setUrlExclusion({ ...urlExclusion, type: val })} style={{ width: "100%" }}>
                <Option value="NOT IN">NOT IN</Option>
                <Option value="NOT REGEXP_CONTAINS">NOT REGEXP_CONTAINS</Option>
              </Select>
              <Input placeholder="Comma-separated URLs" value={urlExclusion.urls} onChange={(e) => setUrlExclusion({ ...urlExclusion, urls: e.target.value })} />
            </Space>
          </div>

          <Button type="primary" onClick={generateQuery}>Generate Query</Button>

          <div>
            <label>Resulting Query</label>
            <div style={{ marginTop: 4 }}>
              <SyntaxHighlighter language="sql" style={themeMode === "light" ? coy : dark} wrapLines>{result}</SyntaxHighlighter>
            </div>
          </div>
        </Space>
      </Card>

      {/* 🌙 Floating Theme Toggle Button */}
      <button style={floatButtonStyle} onClick={() => setThemeMode((prev) => (prev === "light" ? "dark" : "light"))}>
        {themeMode === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
};

export default QueryBuilder;
