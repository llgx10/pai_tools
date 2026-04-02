import EmbeddedMedia from "../components/modals/EmbeddedMedia";

export const renderMedia = (url?: string, disableLink = false) => {
  if (!url) return null;

  const lower = url.toLowerCase();

  // 🎵 TikTok
  if (lower.includes("tiktok.com")) {
    return <EmbeddedMedia url={url} disableLink={disableLink} />;
  }

  // ▶ YouTube
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    let id = "";

    if (lower.includes("youtube.com")) {
      const params = new URL(url).searchParams;
      id = params.get("v") || "";
    }

    if (lower.includes("youtu.be")) {
      id = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${id}`}
        frameBorder="0"
        allowFullScreen
      />
    );
  }

  // 🎬 Video files
  if (lower.match(/\.(mp4|webm|mov)/)) {
    return (
      <video
        src={url}
        controls
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  // 🖼 Image
  return (
    <img
      src={url}
      alt="media"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};