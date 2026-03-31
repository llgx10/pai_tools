export const calculateESOV = (
  search: any[],
  spend: any[]
) => {

  const map = new Map();

  search.forEach((s) => {
    const key = `${s.Month}_${s.Brand}`;

    map.set(key, {
      Month: s.Month,
      Brand: s.Brand,
      Share_of_Search: s.Share,
      Share_of_Spend: 0,
    });
  });

  spend.forEach((s) => {
    const key = `${s.Month}_${s.Brand}`;

    if (!map.has(key)) {
      map.set(key, {
        Month: s.Month,
        Brand: s.Brand,
        Share_of_Search: 0,
        Share_of_Spend: s.Share,
      });
    } else {
      map.get(key).Share_of_Spend = s.Share;
    }
  });

  return Array.from(map.values()).map((r: any) => ({
    ...r,
    eSOV: Number((r.Share_of_Spend - r.Share_of_Search).toFixed(2)),
  }));
};