// api/getEmbededLink.js
import fetch from "node-fetch"; // Node 18+ you can omit this

export default async function handler(req, res) {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    let oembedApi = "";
    if (videoUrl.includes("tiktok.com")) {
      oembedApi = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    } else if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      oembedApi = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    } else {
      return res.status(400).json({ error: "Unsupported video platform" });
    }

    const oembedResponse = await fetch(oembedApi);
    if (!oembedResponse.ok) {
      return res.status(oembedResponse.status).json({ error: "Failed to fetch oEmbed data" });
    }

    const data = await oembedResponse.json();

    res.status(200).json({
      html: data.html,
      title: data.title,
      author_name: data.author_name,
      author_url: data.author_url,
      thumbnail_url: data.thumbnail_url,
      width: data.width,
      height: data.height,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}