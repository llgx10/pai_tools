import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportExcel = async (data: any[]) => {

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("eSOV");

  ws.columns = Object.keys(data[0]).map((k) => ({
    header: k,
    key: k,
  }));

  ws.addRows(data);

  const buffer = await wb.xlsx.writeBuffer();

  saveAs(new Blob([buffer]), "esov_result.xlsx");
};