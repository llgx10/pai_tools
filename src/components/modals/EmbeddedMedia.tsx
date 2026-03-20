import React, { useEffect, useState } from "react";

// ✅ GLOBAL cache + queue (reuse from before)
const tiktokCache = new Map<string, string | null>();

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
      await sleep(1000); // 🔥 1 req/sec
    }
  }

  isProcessing = false;
};

const enqueue = (task: () => Promise<void>) => {
  queue.push(task);
  processQueue();
};

const EmbeddedMedia: React.FC<{ url: string }> = React.memo(
  ({ url }) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;

      const loadThumbnail = async () => {
        if (!url) return;

        // ✅ cache hit
        if (tiktokCache.has(url)) {
          if (isMounted) setThumbnail(tiktokCache.get(url)!);
          return;
        }

        // 🎯 TikTok → fetch thumbnail only
        if (url.includes("tiktok.com")) {
          enqueue(async () => {
            try {
              const res = await fetch(
                `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
              );
              const data = await res.json();

              const thumb = data.thumbnail_url || null;

              tiktokCache.set(url, thumb);

              if (isMounted) setThumbnail(thumb);
            } catch (err) {
              console.error("TikTok thumbnail failed:", err);
              if (isMounted) setThumbnail(null);
            }
          });
        }

        // 🎯 YouTube → use thumbnail directly (no API needed)
        else if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const videoId =
            url.includes("youtu.be")
              ? url.split("/").pop()
              : new URL(url).searchParams.get("v");

          if (videoId && isMounted) {
            setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
          }
        }

        // 🎯 fallback image
        else {
          if (isMounted) setThumbnail(url);
        }
      };

      loadThumbnail();

      return () => {
        isMounted = false;
      };
    }, [url]);

    if (!thumbnail) {
      return <div style={{ textAlign: "center" }}>Loading...</div>;
    }

    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={thumbnail}
          alt="thumbnail"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
      </a>
    );
  },
  (prev, next) => prev.url === next.url
);

export default EmbeddedMedia;