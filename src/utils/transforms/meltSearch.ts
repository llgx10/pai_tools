// src/utils/transforms/meltSearch.ts
import { RowData as ParseRowData } from "../parseFile";
import dayjs from "dayjs";

export type MeltedSearch = {
  month: string;
  brand: string;
  value: number;
};

export function meltSearch(
  rows: ParseRowData[],
  dateColumn: string,
  renameMap: Record<string, string> = {}
): MeltedSearch[] {
  const aggregated: Record<string, Record<string, number>> = {};

  rows.forEach(row => {
    const rawDate = row[dateColumn];
    if (!rawDate) return;

    // convert to "YYYY-MM" month key
    const month = dayjs(rawDate).format("YYYY-MM");

    if (!aggregated[month]) aggregated[month] = {};

    Object.keys(row).forEach(key => {
      if (key === dateColumn) return;
      const brand = renameMap[key] || key;

      const val = Number(row[key] ?? 0);
      if (!aggregated[month][brand]) aggregated[month][brand] = 0;
      aggregated[month][brand] += val;
    });
  });

  const result: MeltedSearch[] = [];

  Object.entries(aggregated).forEach(([month, brandMap]) => {
    Object.entries(brandMap).forEach(([brand, value]) => {
      result.push({ month, brand, value });
    });
  });

  return result;
}