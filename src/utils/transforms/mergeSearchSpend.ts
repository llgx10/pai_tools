export const mergeSearchSpend = (
  search: { date: string; brand: string; share: number }[],
  spend: { date: string; brand: string; share: number }[],
  renameMap: Record<string, string> = {}
) => {
  const map: Record<string, any> = {};

  // SEARCH
  search.forEach((r) => {
    const brand = renameMap[r.brand] || r.brand;
    const key = r.date + "_" + brand;

    map[key] = {
      date: r.date,
      brand,
      share: r.share ?? 0,
      spend_share: 0
    };
  });

  // SPEND
  spend.forEach((r) => {
    const brand = renameMap[r.brand] || r.brand;
    const key = r.date + "_" + brand;

    if (!map[key]) {
      map[key] = {
        date: r.date,
        brand,
        share: 0,
        spend_share: r.share ?? 0
      };
    } else {
      map[key].spend_share = r.share ?? 0;
    }
  });

  console.log("Search to merge:", search);
  console.log("Spend to merge:", spend);

  return Object.values(map).map((r) => ({
    ...r,
    share: r.share ?? 0,
    spend_share: r.spend_share ?? 0,
    eSOV: (r.spend_share ?? 0) - (r.share ?? 0)
  }));
};