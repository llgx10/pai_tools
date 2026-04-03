import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    // Ensure we only parse JSON if Content-Type is JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("TikTok oEmbed returned non-JSON:", text);
      res.status(500).json({ error: "TikTok oEmbed returned non-JSON" });
      return;
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json(data);
  } catch (err) {
    console.error("TikTok fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch TikTok oEmbed" });
  }
}