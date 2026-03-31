import { RowData } from "../parseFile";

export const mergeSearchFiles = (datasets: RowData[][], dateColumn: string) => {
  const merged: Record<string, RowData> = {};

  datasets.forEach((rows) => {
    rows.forEach((row) => {
      const date = row[dateColumn];
      if (!merged[date]) merged[date] = { [dateColumn]: date };

      Object.keys(row).forEach((col) => {
        if (col === dateColumn) return;

        // Instead of renaming _2, just sum values if numeric
        const value = Number(row[col]) || 0;
        const existing = Number(merged[date][col]) || 0;
        merged[date][col] = (existing + value).toString();
      });
    });
  });

  return Object.values(merged);
};