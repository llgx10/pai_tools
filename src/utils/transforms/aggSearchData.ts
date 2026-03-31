// file: utils/exportMonthlyBrandSum.ts

export type DataRow = {
  Time: string;
  [brand: string]: string;
};

export type AggregatedRow = {
  date: string; // changed from month -> date
  brand: string;
  value: number;
};

export function aggSearchData(data: DataRow[]): AggregatedRow[] {
  // Step 1: Unpivot and normalize date
  const unpivoted: AggregatedRow[] = data.flatMap(row => {
    const date = row.Time.slice(0, 7) + "-01"; // first day of month
    return Object.entries(row)
      .filter(([key]) => key !== "Time")
      .map(([brand, value]) => ({
        date,
        brand,
        value: Number(value)
      }));
  });

  // Step 2: Aggregate values by date + brand
  const aggregated: AggregatedRow[] = Object.values(
    unpivoted.reduce((acc, { date, brand, value }) => {
      const key = `${date}-${brand}`;
      if (!acc[key]) acc[key] = { date, brand, value: 0 };
      acc[key].value += value;
      return acc;
    }, {} as Record<string, AggregatedRow>)
  );

  return aggregated;
}