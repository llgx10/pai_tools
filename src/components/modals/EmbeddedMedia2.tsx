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
      await sleep(10);
    }
  }

  isProcessing = false;
};

const enqueue = (task: () => Promise<void>) => {
  queue.push(task);
  processQueue();
};

const EmbeddedMedia2: React.FC<{ url: string; disableLink?: boolean }> = ({
  url,
  disableLink = false
}) => {

  const [videoUrl, setVideoUrl] = useState<
    string | "INVALID_VIDEO" | "INVALID_PHOTO" | null
  >(null);

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    // ✅ check cache
    const cached = tiktokCache.get(url);
    if (cached !== undefined) {
      setVideoUrl(cached);
      return;
    }

    // 🎯 TikTok logic
    if (url.includes("tiktok.com")) {

      if (url.includes("/photo/")) {
        tiktokCache.set(url, "INVALID_PHOTO");
        if (isMounted) setVideoUrl("INVALID_PHOTO");
        return;
      }

      if (!url.includes("/video/")) {
        tiktokCache.set(url, "INVALID_VIDEO");
        if (isMounted) setVideoUrl("INVALID_VIDEO");
        return;
      }

      enqueue(async () => {
        try {

          const res = await fetch(
            `/api/tiktok-video?url=${encodeURIComponent(url)}`
          );

          if (!res.ok) {
            tiktokCache.set(url, "INVALID_VIDEO");
            if (isMounted) setVideoUrl("INVALID_VIDEO");
            return;
          }

          const data = await res.json();
          const video = data.video || "INVALID_VIDEO";

          tiktokCache.set(url, video);

          if (isMounted) setVideoUrl(video);

        } catch (err) {

          console.error("TikTok fetch failed:", err);

          tiktokCache.set(url, "INVALID_VIDEO");

          if (isMounted) setVideoUrl("INVALID_VIDEO");
        }
      });
    }

    return () => {
      isMounted = false;
    };

  }, [url]);

  // ❌ invalid video
  if (videoUrl === "INVALID_VIDEO") {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#999"
        }}
      >
        Video unavailable (removed/private video)
      </div>
    );
  }

  // ❌ unsupported photo
  if (videoUrl === "INVALID_PHOTO") {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#999"
        }}
      >
        TikTok Photo URLs are not supported
      </div>
    );
  }

  // ⏳ loading
  if (!videoUrl) {
    return <div style={{ textAlign: "center" }}>Loading...</div>;
  }

  const video = (
    <video
      src={videoUrl}
      muted
      controls
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        cursor: disableLink ? "default" : "pointer"
      }}
    />
  );

  if (disableLink) return video;

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {video}
    </a>
  );
};

export default EmbeddedMedia2;

