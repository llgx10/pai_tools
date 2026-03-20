import React, { useEffect, useState } from "react";

// Memoized EmbeddedMedia component
interface EmbeddedMediaProps {
  url: string;
}

const EmbeddedMedia: React.FC<EmbeddedMediaProps> = React.memo(
  ({ url }) => {
    const [embedHtml, setEmbedHtml] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;

      // Reset when URL changes
      setEmbedHtml(null);
      setThumbnailUrl(null);

      // Simple cache object to avoid redundant fetches
      const tiktokCache: Record<string, { embedHtml?: string; thumbnail?: string }> = {};

      const loadMedia = async () => {
        if (!url) return;

        // If cached, use cached values
        if (tiktokCache[url]) {
          if (isMounted) {
            setEmbedHtml(tiktokCache[url].embedHtml || null);
            setThumbnailUrl(tiktokCache[url].thumbnail || null);
          }
          return;
        }

        try {
          // TikTok oEmbed
          if (url.includes("tiktok.com")) {
            const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            tiktokCache[url] = { embedHtml: data.html, thumbnail: data.thumbnail_url };
            if (isMounted) {
              setEmbedHtml(data.html);
              setThumbnailUrl(data.thumbnail_url);
            }
          }

          // YouTube
          else if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = url.split("v=")[1] || url.split("/").pop();
            const embed = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            if (embed && isMounted) setEmbedHtml(`<iframe src="${embed}" frameborder="0" allowfullscreen></iframe>`);
          }

          // Fallback for other URLs: show thumbnail if possible
          else {
            if (isMounted) setThumbnailUrl(url);
          }
        } catch (err) {
          console.error("Failed to load media for URL:", url, err);
        }
      };

      loadMedia();

      return () => {
        isMounted = false; // cleanup
      };
    }, [url]);

    // Render either iframe/embed HTML or thumbnail
    return (
      <div style={{ width: 300, height: 300 }}>
        {embedHtml ? (
          <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
        ) : thumbnailUrl ? (
          <img src={thumbnailUrl} alt="media thumbnail" style={{ maxWidth: "100%", maxHeight: "100%" }} />
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  },
  // Only rerender if URL changes
  (prev, next) => prev.url === next.url
);

export default EmbeddedMedia;