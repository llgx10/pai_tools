import type { FaultyRow } from "../components/modals/queryDrawer";

const OTHER_COLUMNS = [
  "CREATIVE_CAMPAIGN_NAME",
  "CREATIVE_LANDINGPAGE_URL",
  "CREATIVE_VIDEO_TITLE",
  "SOCIAL_CAMPAIGN_TEXT",
  "SOCIAL_HEADLINE_TEXT",
  "SOCIAL_DESCRIPTION",
];

export function generateBrandQueries(faultyRows: FaultyRow[]): string {
  if (!faultyRows.length) return "";

  const brandCol = ["brand", "Brand", "BRAND"].find((col) =>
    faultyRows.some((r) => r.row[col])
  );

  const brandGroups: Record<string, FaultyRow[]> = {};

  faultyRows.forEach((fr) => {
    const brand = brandCol ? fr.row[brandCol] || "Unknown" : "All";
    if (!brandGroups[brand]) brandGroups[brand] = [];
    brandGroups[brand].push(fr);
  });

  const blocks: string[] = [];

  Object.entries(brandGroups).forEach(([brand, rows]) => {
    const grouped: Record<string, string[]> = {};

    rows.forEach(({ row }) => {
      const { faultyOn, value } = row.faultyOn;

      if (!grouped[faultyOn]) grouped[faultyOn] = [];
      grouped[faultyOn].push(value);
    });

    const lines: string[] = [];

    if (grouped["CREATIVE_URL_SUPPLIER"]?.length) {
      const unique = Array.from(new Set(grouped["CREATIVE_URL_SUPPLIER"]));

      lines.push(
        `CREATIVE_URL_SUPPLIER NOT IN (${unique
          .map((v) => `'${v}'`)
          .join(", ")})`
      );
    }

    if (grouped["ADVERTISER_NAME"]?.length) {
      const regex = Array.from(
        new Set(grouped["ADVERTISER_NAME"].map((v) => v.toUpperCase()))
      ).join("|");

      lines.push(
        `NOT REGEXP_CONTAINS(UPPER(ADVERTISER_NAME), '${regex}')`
      );
    }

    if (grouped["OTHER"]?.length) {
      const regex = Array.from(
        new Set(grouped["OTHER"].map((v) => v.toUpperCase()))
      ).join("|");

      const block =
        "NOT (\n" +
        OTHER_COLUMNS.map(
          (col) =>
            `REGEXP_CONTAINS(UPPER(COALESCE(${col},'')), r'${regex}')`
        ).join("\nOR ") +
        "\n)";

      lines.push(block);
    }

    const brandHeader = brand !== "All" ? `-----${brand.toLowerCase()}\n` : "";

    blocks.push(`${brandHeader}${lines.join("\nAND\n")}`);
  });

  return blocks.join("\n\n");
}