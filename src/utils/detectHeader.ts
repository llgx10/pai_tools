export const detectHeader = (rows: string[][]) => {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].join(" ").toLowerCase();

    if (row.includes("week") || row.includes("date")) {
      return i;
    }
  }

  return 0;
};