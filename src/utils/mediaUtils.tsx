import EmbeddedMedia from "../components/modals/EmbeddedMedia";

export const renderMedia = (u?: string) => {
  if (!u) return null;
  if (u.includes("tiktok.com")) {
    return <EmbeddedMedia url={u} />;
  }

  if (u.match(/\.(mp4|webm|ogg)$/i)) {
    return <video src={u} controls style={{ width: "100%" }} />;
  }

  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    const id = u.includes("youtu.be") ? u.split("/").pop() : new URL(u).searchParams.get("v");
    return <iframe src={`https://www.youtube.com/embed/${id}`} width="100%" />;
  }

  return <img src={u} style={{ width: "100%" }} />;
};