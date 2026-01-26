import React, { useState, useEffect } from "react";
import Header from '..//modals/Headers';
import { Layout } from "antd";


const TextConverter: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [separator, setSeparator] = useState(",");
  const [wrapChar, setWrapChar] = useState("");
  const [toUppercase, setToUppercase] = useState(false);
  const [result, setResult] = useState("");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Update body background on theme change
  useEffect(() => {
    document.body.style.backgroundColor = themeMode === "light" ? "#f0f0f0" : "#121212";
    document.body.style.color = themeMode === "light" ? "#000" : "#f0f0f0";
  }, [themeMode]);

  const handleConvert = () => {
    let lines = inputText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "");

    if (wrapChar) lines = lines.map(line => `${wrapChar}${line}${wrapChar}`);
    if (toUppercase) lines = lines.map(line => line.toUpperCase());

    setResult(lines.join(separator + "\n"));
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: themeMode === "light" ? "#f9f9f9" : "#1f1f1f",
    color: themeMode === "light" ? "#000" : "#f0f0f0",
    borderRadius: "12px",
    boxShadow: themeMode === "light" ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.5)",
    transition: "0.3s",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "10px",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "15px",
    backgroundColor: themeMode === "light" ? "#fff" : "#2c2c2c",
    color: themeMode === "light" ? "#000" : "#f0f0f0",
    borderColor: themeMode === "light" ? "#ccc" : "#555",
    transition: "0.3s",
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    width: "60px",
    marginLeft: "5px",
    backgroundColor: themeMode === "light" ? "#fff" : "#2c2c2c",
    color: themeMode === "light" ? "#000" : "#f0f0f0",
    borderColor: themeMode === "light" ? "#ccc" : "#555",
    transition: "0.3s",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "10px",
    fontWeight: 500,
  };

  const floatButtonStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1000,
    width: 50,
    height: 50,
    borderRadius: "50%",
    backgroundColor: themeMode === "light" ? "#4CAF50" : "#888",
    color: "#fff",
    fontSize: "20px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "0.3s",
  };

  return (
    <>
      {/* ✅ Header */}
      <Layout>
        <Header />
      </Layout>

      {/* Page Wrapper to avoid header overlap */}
      <div
        style={{
          paddingTop: 80, // important because header is sticky
        }}
      >
        <div style={containerStyle}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            Text Converter
          </h2>

          <textarea
            rows={8}
            style={textareaStyle}
            placeholder="Paste your text here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>
              Separator:
              <input
                type="text"
                value={separator}
                onChange={e => setSeparator(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Wrap each line with:
              <input
                type="text"
                value={wrapChar}
                onChange={e => setWrapChar(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={toUppercase}
                onChange={e => setToUppercase(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Convert to uppercase
            </label>
          </div>

          <button
            style={buttonStyle}
            onMouseOver={e =>
              (e.currentTarget.style.backgroundColor = "#45a049")
            }
            onMouseOut={e =>
              (e.currentTarget.style.backgroundColor = "#4CAF50")
            }
            onClick={handleConvert}
          >
            Convert
          </button>

          <h3 style={{ marginTop: "20px" }}>Result:</h3>

          <textarea
            rows={8}
            style={{
              ...textareaStyle,
              backgroundColor:
                themeMode === "light" ? "#f1f1f1" : "#333",
            }}
            value={result}
            readOnly
          />
        </div>
      </div>

      {/* 🌙 Floating Theme Toggle Button */}
      <button
        style={floatButtonStyle}
        onClick={() =>
          setThemeMode(prev => (prev === "light" ? "dark" : "light"))
        }
      >
        {themeMode === "light" ? "🌙" : "☀️"}
      </button>
    </>
  );

};

export default TextConverter;
