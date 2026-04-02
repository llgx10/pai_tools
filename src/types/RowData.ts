export type FaultyOn = {
  faultyOn: "ADVERTISER_NAME" | "CREATIVE_URL_SUPPLIER" | "OTHER";
  value: string;
};

export type RowData = {
  id: string | number;
  media?: string;
  isFaulty?: boolean;
  faultyOn?: FaultyOn; // ✅ add this
  __search: string;

  ADVERTISER_NAME?: string;
  CREATIVE_CAMPAIGN_NAME?: string;

  [key: string]: any;
};