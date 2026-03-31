const columnGroups: Record<string, string[]> = {
    advertiser: [
        "VISIT_ID", "ADVERTISER_ID", "ADVERTISER_NAME", "ADVERTISER_DOMAIN",
        "ADVERTISER_MAIN_CATEGORY", "ADVERTISER_SECOND_CATEGORY",
        "MASTER_BRAND", "BRAND", "SUBBRAND",
    ],
    publisher: [
        "CHANNEL_NAME", "PUBLISHER_ID", "PUBLISHER_NAME", "PUBLISHER_CATEGORY",
        "PUBLISHER_DOMAIN", "YT_CHANNEL_NAME", "PUBLISHER_URL_ID", "PUBLISHER_URL",
    ],
    creative: [
        "CREATIVE_ID", "CREATIVE_LANDINGPAGE_URL", "CREATIVE_LANDINGPAGE_KEYWORDS",
        "CREATIVE_CAMPAIGN_NAME", "CREATIVE_CAMPAIGN_ID", "CREATIVE_SIGNATURE",
        "CREATIVE_FIRST_SEEN_DATE", "CREATIVE_MIME_TYPE", "CREATIVE_WIDTH",
        "CREATIVE_HEIGHT", "CREATIVE_SIZE", "CREATIVE_URL_SUPPLIER",
        "CREATIVE_INVENTORY_TYPE", "SOCIAL_AD_PLACEMENT", "CREATIVE_VIDEO_TITLE",
        "CREATIVE_VIDEO_DURATION", "DAISY_CHAIN", "CLICK_CHAIN", "TRANSACTION_METHOD",
    ],
    occurrence: [
        "OCCURENCE_VISIBILITY", "OCCURENCE_COLLECTIONDATE", "OCCURENCE_COLLECTIONTIME",
        "OCCURENCE_USER_DEVICE", "OCCURENCE_USER_APP_TYPE", "OCCURENCE_AD_POSITION_X",
        "OCCURENCE_AD_POSITION_Y", "OCCURENCE_VIDEO_POSITION", "OCCURENCE_VIDEO_SKIPPABLE",
        "OCCURENCE_VIDEO_CONTENT_TITLE", "OCCURENCE_VIDEO_CONTENT_DURATION",
        "OCCURENCE_USER_AGENT", "OCCURENCE_UNIQUES",
    ],
    youtube: [
        "YOUTUBE_SOURCE_VIDEO_DURATION_SEC", "YOUTUBE_AD_PUBLISHED_DATE",
        "YOUTUBE_AD_CATEGORY_NAME", "YOUTUBE_AD_VIDEO_TITLE", "VIDEO_URL",
    ],
    social: [
        "SOCIAL_PAGE_LINK", "SOCIAL_PAGE_NAME", "SOCIAL_CAMPAIGN_TEXT",
        "SOCIAL_CAMPAIGN_TEXT_LINKS", "SOCIAL_HEADLINE_LINK", "SOCIAL_HEADLINE_TEXT",
        "SOCIAL_DESCRIPTION", "SOCIAL_CTA_BUTTON_TEXT", "SOCIAL_CTA_LINK",
    ],
    metrics: ["IMPRESSIONS", "SPEND"],
};

const groupColorsDark: Record<string, string> = {
    country: "#ff5054",
    advertiser: "#2eab59",
    publisher: "#ff7c44",
    creative: "#167dff",
    occurrence: "#84074b",
    youtube: "#697c21",
    social: "#fe6d70",
    metrics: "#104a5e",
};


const groupColorsLight: Record<string, string> = {
    country: "#FFF5F5",
    advertiser: "#F0FFF4",
    publisher: "#F0F9FF",
    creative: "#FFFAF0",
    occurrence: "#F5FAF7",
    youtube: "#FEF9E7",
    social: "#FDF2FF",
    metrics: "#F9F9F9",
};
export const getColumnGroup = (colKey: string): string | undefined => {
  for (const [group, keys] of Object.entries(columnGroups)) {
    if (keys.includes(colKey)) return group;
  }
  return undefined;
};

export const getColumnColor = (
  colKey: string,
  themeMode: "light" | "dark"
) => {
  const groupColors = themeMode === "dark" ? groupColorsDark : groupColorsLight;

  const group = Object.entries(columnGroups).find(([_, cols]) =>
    cols.includes(colKey)
  )?.[0];

  return group ? groupColors[group] : undefined;
};