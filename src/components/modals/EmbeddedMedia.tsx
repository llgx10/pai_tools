import React, { useEffect, useState } from "react";

// ✅ GLOBAL cache + queue
const tiktokCache = new Map<string, string | "INVALID_VIDEO" | "INVALID_PHOTO" | null>();
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
      await sleep(10);
    }
  }
  isProcessing = false;
};
const enqueue = (task: () => Promise<void>) => {
  queue.push(task);
  processQueue();
};

const EmbeddedMedia: React.FC<{ url: string }> = ({ url }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    // ✅ check cache
    const cached = tiktokCache.get(url);
    if (cached !== undefined) {
      if (cached === "INVALID_VIDEO") {
        setThumbnail(null);
        return;
      }
      if (cached === "INVALID_PHOTO") {
        setThumbnail(null);
        return;
      }
      setThumbnail(cached);
      return;
    }

    // 🎯 TikTok logic
    if (url.includes("tiktok.com")) {
      // photo link
      if (url.includes("/photo/")) {
        tiktokCache.set(url, "INVALID_PHOTO");
        if (isMounted) setThumbnail(null);
        return;
      }

      // not a video link
      if (!url.includes("/video/")) {
        tiktokCache.set(url, "INVALID_VIDEO");
        if (isMounted) setThumbnail(null);
        return;
      }

      // enqueue video thumbnail fetch
      enqueue(async () => {
        try {
          const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
          if (!res.ok) {
            tiktokCache.set(url, "INVALID_VIDEO");
            if (isMounted) setThumbnail(null);
            return;
          }
          const data = await res.json();
          const thumb = data.thumbnail_url || null;
          tiktokCache.set(url, thumb);
          if (isMounted) setThumbnail(thumb);
        } catch (err) {
          console.error("TikTok fetch failed:", err);
          if (isMounted) setThumbnail(null);
        }
      });
    }

    return () => { isMounted = false; };
  }, [url]);

  // Render messages based on URL type
  if (url.includes("/photo/")) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#999"
      }}>
        Invalid TikTok photo
      </div>
    );
  }
  if (!url.includes("/video/") && url.includes("tiktok.com")) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#999"
      }}>
        Invalid TikTok URL
      </div>
    );
  }

  if (!thumbnail) return <div style={{ textAlign: "center" }}>Loading...</div>;

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