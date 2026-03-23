import React, { useEffect, useState } from "react";

// ✅ GLOBAL cache + queue (reuse from before)
const tiktokCache = new Map<string, string | "INVALID" | null>();
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
      await sleep(10); // 🔥 1 req/sec
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    // Example simple check for photo/video
    if (url.includes("tiktok.com")) {
      if (url.includes("photo")) {
        setErrorMsg("TikTok photo cannot be displayed");
        setThumbnail(null);
        return;
      } else if (!url.includes("/video/")) {
        setErrorMsg("Invalid TikTok URL");
        setThumbnail(null);
        return;
      }

      // Proceed to fetch thumbnail for video
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!isMounted) return;
          setThumbnail(data.thumbnail_url || null);
          setErrorMsg(null); // clear any previous error
        })
        .catch(err => {
          console.error("TikTok fetch failed", err);
          if (!isMounted) return;
          setThumbnail(null);
          setErrorMsg("Invalid TikTok URL");
        });
    }

    return () => { isMounted = false; };
  }, [url]);

  if (errorMsg) {
    return <div style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      color: "#999"
    }}>{errorMsg}</div>;
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