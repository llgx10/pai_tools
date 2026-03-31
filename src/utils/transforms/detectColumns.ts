export const detectSearchDate = (cols: string[]) => {
  return cols.find((c) => c.toLowerCase().includes("time") || c.toLowerCase().includes("date")) || "";
};

export const detectSpendColumns = (cols: string[]) => {
  const brand = cols.find((c) => c.toLowerCase().includes("brand"));
  const spend = cols.find((c) => c.toLowerCase().includes("spend"));
  const date = cols.find((c) => c.toLowerCase().includes("date"));
  return { brand: brand || "", value: spend || "", date: date || "" };
};