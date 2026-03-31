// utils/normalizeDate.ts
export function normalizeDate(dateVal: string) {
  if (!dateVal) return dateVal;

  // Try standard ISO parse first
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  // Try MMM-yy like "Aug-25"
  const m = dateVal.match(/^([a-zA-Z]+)-(\d{2})$/);
  if (m) {
    const monthStr = m[1];
    const yearStr = m[2];

    const month = new Date(`${monthStr} 1, 2000`).getMonth(); // parse month index
    const year = 2000 + Number(yearStr); // assume 2000+year

    const firstDay = new Date(year, month, 1);
    return firstDay.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  return dateVal; // fallback
}