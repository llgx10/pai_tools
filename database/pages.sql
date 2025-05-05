CREATE TABLE IF NOT EXISTS pages (
  page_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_name TEXT NOT NULL,
  source_table_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ads_list TEXT -- store JSON as a string
);

INSERT INTO pages (page_name, source_table_name, ads_list) VALUES
(
  'Facebook',
  'fb_ads',
  '[
    {
      "brand": "Axe",
      "url": "https://ads.adclarity.com/capturer_creatives/5f599f83266197ae5d9091010345ddf3_video.mp4",
      "impression": 230,
      "spend": 2040
    },
    {
      "brand": "Dove",
      "url": "https://ads.adclarity.com/capturer_creatives/abc123_video.mp4",
      "impression": 180,
      "spend": 990
    }
  ]'
),
(
  'Twitter',
  'twitter_ads',
  '[
    {
      "brand": "Tesla",
      "url": "https://ads.adclarity.com/capturer_creatives/tesla_video.mp4",
      "impression": 600,
      "spend": 7200
    }
  ]'
);