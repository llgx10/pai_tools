export const calcShare = (rows: any[], valueKey: string) => {
  const totals: Record<string, number> = {};
  rows.forEach((r) => { totals[r.date] = (totals[r.date] || 0) + r[valueKey]; });
  return rows.map((r) => ({ ...r, share: totals[r.date] ? r[valueKey] / totals[r.date] : 0 }));
};