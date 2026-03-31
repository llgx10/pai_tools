
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartRow {
  x: string;
  y: number;
}

interface BrandData {
  id: string;
  data: ChartRow[];
}

interface ESOVMonthlyChartProps {
  data: BrandData[];
  metric?: "eSOV" | "spend" | "share";
}

export default function ESOVMonthlyChart({ data, metric = "eSOV" }: ESOVMonthlyChartProps) {
  if (!data || !data.length) {
    return <div style={{ height: 500, textAlign: "center", paddingTop: 200 }}>No data to display</div>;
  }

  const chartData: any[] = [];
  const allBrands = data.map(b => b.id);

  data.forEach((brand) => {
    brand.data.forEach((point) => {
      const existing = chartData.find(d => d.x === point.x);
      if (existing) {
        existing[brand.id] = point.y;
      } else {
        chartData.push({ x: point.x, [brand.id]: point.y });
      }
    });
  });

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 40, right: 100, left: 60, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
          <YAxis
            label={{
              value:
                metric === "eSOV"
                  ? "eSOV"
                  : metric === "spend"
                  ? "Share of Spend"
                  : "Share of Search",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          {allBrands.map((brand, index) => (
            <Line
              key={brand}
              type="monotone"
              dataKey={brand}
              stroke={["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00c49f", "#ff0000"][index % 6]}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}