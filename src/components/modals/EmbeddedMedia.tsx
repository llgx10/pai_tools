import React, { useEffect, useState } from "react";

// ✅ GLOBAL cache + queue
const tiktokCache = new Map<string, string | "INVALID_VIDEO" | "INVALID_PHOTO">();
const queue: (() => Promise<void>)[] = [];
let isProcessing = false;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const task = queue.shift();
    if (task) {
      await task();
      await sleep(10); // throttle
    }
  }

  isProcessing = false;
};

const enqueue = (task: () => Promise<void>) => {
  queue.push(task);
  processQueue();
};

const EmbeddedMedia: React.FC<{ url: string }> = ({ url }) => {
  const [thumbnail, setThumbnail] = useState<string | "INVALID_VIDEO" | "INVALID_PHOTO" | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    // ✅ check cache
    const cached = tiktokCache.get(url);
    if (cached !== undefined) {
      setThumbnail(cached);
      return;
    }

    // 🎯 TikTok logic
    if (url.includes("tiktok.com")) {
      // Photo URL
      if (url.includes("/photo/")) {
        tiktokCache.set(url, "INVALID_PHOTO");
        if (isMounted) setThumbnail("INVALID_PHOTO");
        return;
      }

      // Not a video URL
      if (!url.includes("/video/")) {
        tiktokCache.set(url, "INVALID_VIDEO");
        if (isMounted) setThumbnail("INVALID_VIDEO");
        return;
      }

      // Enqueue video thumbnail fetch
      enqueue(async () => {
        try {
          const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
          if (!res.ok) {
            tiktokCache.set(url, "INVALID_VIDEO");
            if (isMounted) setThumbnail("INVALID_VIDEO");
            return;
          }

          const data = await res.json();
          const thumb = data.thumbnail_url || "INVALID_VIDEO";
          tiktokCache.set(url, thumb);

          if (isMounted) setThumbnail(thumb);
        } catch (err) {
          console.error("TikTok fetch failed:", err);
          tiktokCache.set(url, "INVALID_VIDEO");
          if (isMounted) setThumbnail("INVALID_VIDEO");
        }
      });
    }

    return () => { isMounted = false; };
  }, [url]);

  // Render messages based on type
  if (thumbnail === "INVALID_VIDEO") {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#999"
      }}>
        Invalid TikTok Video URL
      </div>
    );
  }

  if (thumbnail === "INVALID_PHOTO") {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#999"
      }}>
        TikTok Photo URLs are not supported
      </div>
    );
  }

  if (!thumbnail) {
    return <div style={{ textAlign: "center" }}>Loading...</div>;
  }

  // Render valid video thumbnail
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img
        src={thumbnail}
        alt="thumbnail"
        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
      />
    </a>
  );
};

export default EmbeddedMedia;