// src/types/RowData.ts
export type RowData = {
  id: string | number;
  media?: string;
  isFaulty?: boolean;
  __search: string;

  ADVERTISER_NAME?: string;
  CREATIVE_CAMPAIGN_NAME?: string;

  [key: string]: any;
};