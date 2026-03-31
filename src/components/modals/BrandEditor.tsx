// file: BrandEditor.tsx
import { Input, Table, Select } from "antd";

type Props = {
  brands: string[];
  renameMap: Record<string, string>;
  setRenameMap: (map: Record<string, string>) => void;
  spendBrands?: string[]; // optional for dropdown
};

// Clean brand name by removing trailing _2, _2_2, etc.
function cleanBrand(name: string) {
  return name.replace(/(_2)+$/, "").trim();
}

export default function BrandEditor({ brands, renameMap, setRenameMap, spendBrands = [] }: Props) {
  // filter out empty strings and duplicates
  const uniqueBrands = Array.from(new Set(brands.filter((b) => b && b.trim() !== "")));

  // prepare table data
  const data = uniqueBrands.map((b, index) => ({
    key: `${b}_${index}`,    // unique key
    original: b,             // raw brand column for display
    cleaned: cleanBrand(b),  // cleaned version for renameMap key
    renamed: renameMap[cleanBrand(b)] || cleanBrand(b),
  }));

  return (
    <Table
      pagination={false}
      dataSource={data}
      columns={[
        { title: "Original", dataIndex: "original" },
        {
          title: "Rename To",
          render: (_, row) => {
            const value = renameMap[row.cleaned] || row.cleaned;

            return spendBrands.length ? (
              <Select
                value={value}
                style={{ width: "100%" }}
                onChange={(v) => setRenameMap({ ...renameMap, [row.cleaned]: v })}
              >
                {spendBrands.map((b) => (
                  <Select.Option key={b} value={b}>
                    {b}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input
                value={value}
                onChange={(e) =>
                  setRenameMap({ ...renameMap, [row.cleaned]: cleanBrand(e.target.value) })
                }
              />
            );
          },
        },
      ]}
    />
  );
}