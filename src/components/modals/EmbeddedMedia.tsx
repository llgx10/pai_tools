import React, { useEffect, useState } from "react";
import axios from "axios";

interface EmbeddedMediaProps {
  url: string;
}

const EmbeddedMedia: React.FC<EmbeddedMediaProps> = ({ url }) => {
  const [embedHtml, setEmbedHtml] = useState<string>("");

  useEffect(() => {
    // If YouTube, just render iframe
    if (url.includes("youtube.com") || url.includes("youtu.be")) return;

    // If TikTok, fetch oEmbed from your API
    if (url.includes("tiktok.com")) {
      const fetchTikTokEmbed = async () => {
        try {
          const res = await axios.get("/api/getEmbededLink", { params: { url } });
          setEmbedHtml(res.data.html);
        } catch (err) {
          console.error("Error fetching TikTok embed:", err);
        }
      };
      fetchTikTokEmbed();
    }
  }, [url]);

  useEffect(() => {
    // Load TikTok embed script dynamically
    if (!embedHtml) return;
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [embedHtml]);

  // 1️⃣ TikTok embed
  if (url.includes("tiktok.com")) {
    return <div dangerouslySetInnerHTML={{ __html: embedHtml }} />;
  }

  // 2️⃣ YouTube embed
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return null;

    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return null;
};

export default EmbeddedMedia;