export const CHUNK_SIZE = 35;

/**
 * Group columns by domain
 */
export const columnGroups: Record<string, string[]> = {
  advertiser: [
    "ADVERTISER_NAME",
    "BRAND",
    "SUBBRAND",
  ],

  creative: [
    "CREATIVE_LANDINGPAGE_URL",
    "CREATIVE_URL_SUPPLIER",
    "CREATIVE_CAMPAIGN_NAME",
  ],

  publisher: [
    "PUBLISHER_NAME",
    "PUBLISHER_DOMAIN",
  ],

  metrics: [
    "IMPRESSIONS",
    "SPEND",
  ],
};

/**
 * Light theme colors
 */
export const groupColorsLight: Record<string, string> = {
  advertiser: "#F0FFF4",
  creative: "#FFFAF0",
  publisher: "#F0F9FF",
  metrics: "#F9F9F9",
};

/**
 * Dark theme colors
 */
export const groupColorsDark: Record<string, string> = {
  advertiser: "#1f3d2b",
  creative: "#3d2f1f",
  publisher: "#1f2d3d",
  metrics: "#2a2a2a",
};