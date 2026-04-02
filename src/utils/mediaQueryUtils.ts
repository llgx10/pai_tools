// src/utils/mediaQueryUtils.ts
import type { RowData } from "../types/RowData";

export const generateQuerySnippet = (
  row: RowData,
  faultyCols: string[]
): string => {
  if (!row || faultyCols.length === 0) return "";

  let query = "";

  faultyCols.forEach((col) => {
    const value = String(row[col] || "").toUpperCase();

    if (!value) return;

    if (col === "ADVERTISER_NAME") {
      query += `AND NOT REGEXP_CONTAINS(UPPER(COALESCE(${col},'')), "${value}")\n`;
    } else if (col === "CREATIVE_URL_SUPPLIER") {
      query += `AND ${col} NOT IN ("${value}")\n`;
    } else {
      query += `AND (`;
      query += `  NOT REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_CAMPAIGN_NAME,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_LANDINGPAGE_URL,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(CREATIVE_VIDEO_TITLE,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_CAMPAIGN_TEXT,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_PAGE_NAME,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_HEADLINE_TEXT,'')), "${value}")\n`;
      query += `  OR REGEXP_CONTAINS(UPPER(COALESCE(SOCIAL_DESCRIPTION,'')), "${value}") )\n`;
    }
  });

  return query;
};