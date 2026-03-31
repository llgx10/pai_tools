import Papa from "papaparse";
import * as XLSX from "xlsx";

export const useFileParser = () => {
  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const bstr = e.target?.result as any;

        const process = (rows: any[]) => {
          resolve(
            rows.map((r, i) => ({
              ...r,
              id: `row-${i}`, // ✅ better unique id
              media: r.CREATIVE_URL_SUPPLIER,

              // ✅ ADD THESE
              remark: r.remark ?? "",
              isFaulty:
                typeof r.isFaulty === "boolean"
                  ? r.isFaulty
                  : ["true", "1", "yes"].includes(
                      String(r.isFaulty).toLowerCase()
                    ),

              // ✅ search string safe
              __search: Object.values(r)
                .filter((v) => typeof v === "string" || typeof v === "number")
                .join(" ")
                .toLowerCase(),
            }))
          );
        };

        if (file.name.endsWith(".csv")) {
          Papa.parse(bstr, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => process(r.data),
          });
        } else {
          const wb = XLSX.read(bstr, { type: "binary" });
          const json = XLSX.utils.sheet_to_json(
            wb.Sheets[wb.SheetNames[0]]
          );
          process(json);
        }
      };

      file.name.endsWith(".csv")
        ? reader.readAsText(file)
        : reader.readAsBinaryString(file);
    });
  };

  return { parseFile };
};