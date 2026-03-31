import { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const useExportExcel = (data: any[], fileName?: string) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const getVideoThumbnail = (videoUrl: string): Promise<Blob> =>
    new Promise((res, rej) => {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.src = videoUrl;
      v.currentTime = 1;
      v.muted = true;

      v.onloadeddata = () => {
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;

        const ctx = c.getContext("2d");
        if (!ctx) return rej("Canvas error");

        ctx.drawImage(v, 0, 0);
        c.toBlob((b) => (b ? res(b) : rej("No blob")), "image/jpeg");
      };

      v.onerror = rej;
    });

  const exportFile = async (mode: "with-media" | "without-media") => {
    if (!data.length) return;

    setIsExporting(true);
    setProgress(0);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Media Data");

    const headers = Object.keys(data[0]).filter((k) => k !== "media");

    ws.columns =
      mode === "with-media"
        ? [
            ...headers.map((h) => ({ header: h, key: h })),
            { header: "Media Preview", key: "thumbnail" },
          ]
        : headers.map((h) => ({ header: h, key: h }));

    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      const row = ws.addRow(headers.map((h) => r[h]));

      if (mode === "with-media" && r.media) {
        try {
          const blob = r.media.match(/\.(mp4|webm|ogg)$/i)
            ? await getVideoThumbnail(r.media)
            : await fetch(r.media).then((res) => res.blob());

          const buffer = await blob.arrayBuffer();

          const imgId = wb.addImage({
            buffer,
            extension: "jpeg",
          });

          ws.addImage(imgId, {
            tl: { col: headers.length, row: row.number - 1 },
            ext: { width: 200, height: 200 },
          });
        } catch (err) {
          console.warn("Media export failed:", err);
        }
      }

      setProgress(Math.round(((i + 1) / data.length) * 100));
    }

    const buffer = await wb.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      `${(fileName || "export").replace(/\.(xlsx|csv)$/, "")}${
        mode === "with-media" ? "_with_media" : ""
      }.xlsx`
    );

    setIsExporting(false);
    setProgress(0);
  };

  return {
    exportFile,
    isExporting,
    progress,
  };
};