import { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const useExportExcel = (baseData: any[], fileName?: string) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🎬 Extract thumbnail from video
  const getVideoThumbnail = (videoUrl: string): Promise<Blob> =>
    new Promise((res, rej) => {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.src = videoUrl;
      v.currentTime = 1;
      v.muted = true;
      v.playsInline = true;

      v.onloadeddata = () => {
        try {
          const c = document.createElement("canvas");
          c.width = v.videoWidth;
          c.height = v.videoHeight;

          const ctx = c.getContext("2d");
          if (!ctx) return rej("Canvas error");

          ctx.drawImage(v, 0, 0);

          c.toBlob((b) => (b ? res(b) : rej("No blob")), "image/jpeg");
        } catch (err) {
          rej(err);
        }
      };

      v.onerror = () => rej("Video load error");
    });

  // 📦 MAIN EXPORT
  const exportFile = async (
    mode: "with-media" | "without-media",
    dataOverride?: any[]
  ) => {
    const data = dataOverride || baseData;
    if (!data.length) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Media Data");

      // 🧠 safer headers (avoid undefined issues)
      const headers = Object.keys(data[0] || {}).filter(
        (k) => k !== "media"
      );

      // 📊 define columns
      ws.columns =
        mode === "with-media"
          ? [
              ...headers.map((h) => ({ header: h, key: h })),
              { header: "Media Preview", key: "thumbnail" },
            ]
          : headers.map((h) => ({ header: h, key: h }));

      // 🚀 loop rows
      for (let i = 0; i < data.length; i++) {
        const r = data[i];

        const row = ws.addRow(
          headers.map((h) => (r[h] !== undefined ? r[h] : ""))
        );

        // 🖼️ MEDIA HANDLING
        if (mode === "with-media" && r.media) {
          try {
            let blob: Blob | null = null;

            // 🎬 video → thumbnail
            if (r.media.match(/\.(mp4|webm|ogg)$/i)) {
              blob = await getVideoThumbnail(r.media);
            } else {
              // 🖼️ image
              const res = await fetch(r.media);
              blob = await res.blob();
            }

            if (blob) {
              const buffer = await blob.arrayBuffer();

              const imgId = wb.addImage({
                buffer,
                extension: "jpeg",
              });

              ws.addImage(imgId, {
                tl: { col: headers.length, row: row.number - 1 },
                ext: { width: 160, height: 160 },
              });

              // optional: adjust row height
              ws.getRow(row.number).height = 120;
            }
          } catch (err) {
            console.warn("Media export failed:", r.media, err);
          }
        }

        // 📈 smoother progress update
        if (i % 5 === 0 || i === data.length - 1) {
          setProgress(Math.round(((i + 1) / data.length) * 100));
        }
      }

      // 💾 write file
      const buffer = await wb.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer]),
        `${(fileName || "export").replace(/\.(xlsx|csv)$/i, "")}${
          mode === "with-media" ? "_with_media" : ""
        }.xlsx`
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return {
    exportFile,
    isExporting,
    progress,
  };
};