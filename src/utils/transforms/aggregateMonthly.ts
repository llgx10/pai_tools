import dayjs from "dayjs";

export const aggregateMonthly = (
  rows: any[],
  valueField: string
) => {

  const map: Record<string, number> = {};

  rows.forEach((r) => {

    const month = dayjs(r.Date).format("YYYY-MM");
    const key = `${month}_${r.Brand}`;

    map[key] = (map[key] || 0) + Number(r[valueField] || 0);
  });

  return Object.entries(map).map(([key, value]) => {

    const [month, brand] = key.split("_");

    return {
      Month: month,
      Brand: brand,
      Value: value,
    };
  });
};