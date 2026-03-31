import * as XLSX from "xlsx";
import Papa from "papaparse";

export type RowData = Record<string, any>;

export const parseFile = (file: File): Promise<RowData[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (file.name.endsWith(".csv")) {
        Papa.parse(data as string, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve(res.data as RowData[]),
        });
      } else {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json as RowData[]);
      }
    };
    if (file.name.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  });
};

export const cleanRows = (rows: RowData[]) =>
  rows.filter((row) =>
    Object.values(row).some((v) => v !== null && v !== undefined && v !== "")
  );