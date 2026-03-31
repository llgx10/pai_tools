import { Select, Card } from "antd";

type Props = {
  columns: string[];
  mapping: any;
  setMapping: (m: any) => void;
};

export default function ColumnMapper({ columns, mapping, setMapping }: Props) {
  return (
    <Card style={{ marginBottom: 20 }}>
      <h3>Column Mapping</h3>

      <div style={{ marginBottom: 10 }}>
        Date Column
        <Select
          style={{ width: "100%" }}
          value={mapping.date}
          onChange={(v) => setMapping({ ...mapping, date: v })}
        >
          {columns.map((c) => (
            <Select.Option key={c}>{c}</Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ marginBottom: 10 }}>
        Brand Column
        <Select
          style={{ width: "100%" }}
          value={mapping.brand}
          onChange={(v) => setMapping({ ...mapping, brand: v })}
        >
          {columns.map((c) => (
            <Select.Option key={c}>{c}</Select.Option>
          ))}
        </Select>
      </div>

      <div>
        Value Column
        <Select
          style={{ width: "100%" }}
          value={mapping.value}
          onChange={(v) => setMapping({ ...mapping, value: v })}
        >
          {columns.map((c) => (
            <Select.Option key={c}>{c}</Select.Option>
          ))}
        </Select>
      </div>
    </Card>
  );
}