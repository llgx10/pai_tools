import React from "react";
import { Input, Tag, Checkbox, Button, Dropdown, Divider } from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { Search } = Input;

type Props = {
  searchInput: string;
  setSearchInput: (v: string) => void;

  searchKeywords: string[];
  setSearchKeywords: (v: string[]) => void;

  filterFaulty: boolean;
  setFilterFaulty: (v: boolean) => void;

  columnOptions: { label: string; value: string }[];
  visibleColumns: string[];
  setVisibleColumns: (v: string[]) => void;

  themeMode: "light" | "dark";
};

const FiltersBar: React.FC<Props> = ({
  searchInput,
  setSearchInput,
  searchKeywords,
  setSearchKeywords,
  filterFaulty,
  setFilterFaulty,
  columnOptions,
  visibleColumns,
  setVisibleColumns,
  themeMode,
}) => {
  const handleSearch = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !searchKeywords.includes(trimmed)) {
      setSearchKeywords([...searchKeywords, trimmed]);
    }
    setSearchInput("");
  };

  const removeKeyword = (kw: string) => {
    setSearchKeywords(searchKeywords.filter((k) => k !== kw));
  };

  const columnVisibilityMenu = (
    <div style={{ maxHeight: 300, overflowY: "auto", padding: 12 }}>
      <Checkbox.Group
        value={visibleColumns}
        onChange={(val) => setVisibleColumns(val as string[])}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {columnOptions.map((opt) => (
          <Checkbox key={opt.value} value={opt.value}>
            {opt.label}
          </Checkbox>
        ))}
      </Checkbox.Group>

      <Divider />

      <Button type="link" onClick={() => setVisibleColumns(columnOptions.map(o => o.value))}>
        Show All
      </Button>

      <Button type="link" danger onClick={() => setVisibleColumns([])}>
        Hide All
      </Button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      {/* 🔍 Search */}
      <Search
        placeholder="Enter keyword and press Enter"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onSearch={handleSearch}
        enterButton
        style={{ width: 300 }}
      />

      {/* ❌ Keywords */}
      {searchKeywords.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {searchKeywords.map((k) => (
            <Tag
              key={k}
              closable
              onClose={() => removeKeyword(k)}
            >
              {k}
            </Tag>
          ))}
        </div>
      )}

      {/* ⚠️ Faulty toggle */}
      <Checkbox
        checked={filterFaulty}
        onChange={(e) => setFilterFaulty(e.target.checked)}
      >
        Show Only Faulty
      </Checkbox>

      {/* 👁 Column visibility */}
      <Dropdown
        menu={{ items: [] }}
        popupRender={() => (
          <div
            style={{
              background: themeMode === "dark" ? "#000" : "#fff",
              color: themeMode === "dark" ? "#fff" : "#000",
              borderRadius: 6,
            }}
          >
            {columnVisibilityMenu}
          </div>
        )}
        trigger={["click"]}
      >
        <Button icon={<EyeOutlined />}>Columns</Button>
      </Dropdown>
    </div>
  );
};

export default React.memo(FiltersBar);