import React, { useState, useEffect, useRef } from "react";
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";
import Papa from "papaparse";
import ExcelJS from "exceljs";


type RowData = {
  [key: string]: any;
  media?: string;
  remark?: string;
};

const CHUNK_SIZE = 20;

const MediaInspector: React.FC = () => {
  const [allData, setAllData] = useState<RowData[]>([]);
  const [visibleData, setVisibleData] = useState<RowData[]>([]);
  const [currentChunk, setCurrentChunk] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterFaulty, setFilterFaulty] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const baseKeys = Object.keys(visibleData[0] || {}).filter(
    (key) => !["media", "remark", "isFaulty"].includes(key)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportMode, setExportMode] = useState<"with-media" | "without-media">("without-media");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);






  const totalRows = allData.length;
  const faultyRows = allData.filter((row) => row.isFaulty).length;

  const [advertiserData, setAdvertiserData] = useState<{ id: string; value: number }[]>([]);
  const [campaignData, setCampaignData] = useState<{ id: string; value: number }[]>([]);

  useEffect(() => {
    if (allData.length > 0) {
      const newAdvertiserData: { id: string; value: number }[] = [];
      const newCampaignData: { id: string; value: number }[] = [];

      allData.forEach((item) => {
        const advertiser = item["ADVERTISER_NAME"];
        if (advertiser) {
          const existingAdvertiser = newAdvertiserData.find((entry) => entry.id === advertiser);
          if (existingAdvertiser) {
            existingAdvertiser.value += 1;
          } else {
            newAdvertiserData.push({ id: advertiser, value: 1 });
          }
        }

        const campaign = item["CREATIVE_CAMPAIGN_NAME"];
        if (campaign) {
          const existingCampaign = newCampaignData.find((entry) => entry.id === campaign);
          if (existingCampaign) {
            existingCampaign.value += 1;
          } else {
            newCampaignData.push({ id: campaign, value: 1 });
          }
        }
      });

      setAdvertiserData(newAdvertiserData);
      setCampaignData(newCampaignData);
    }
  }, [allData]);



  const hasImpressions = allData[0] && "IMPRESSIONS" in allData[0];

  const totalImpressions = hasImpressions
    ? allData.reduce((sum, row) => sum + (parseFloat(row.IMPRESSIONS) || 0), 0)
    : 0;
  const faultyImpressions = hasImpressions
    ? allData
      .filter((row) => row.isFaulty)
      .reduce((sum, row) => sum + (parseFloat(row.IMPRESSIONS) || 0), 0)
    : 0;

  const faultyPercentage = totalRows > 0 ? ((faultyRows / totalRows) * 100).toFixed(2) : 0;
  const impressionPercentage = totalImpressions > 0
    ? ((faultyImpressions / totalImpressions) * 100).toFixed(2)
    : null;

  const keywordFiltered = visibleData
    .map((row, originalIndex) => ({ row, originalIndex }))
    .filter(({ row }) => {
      const searchableText = Object.values(row)
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ")
        .toLowerCase();

      return searchKeywords.every((keyword) =>
        searchableText.includes(keyword.toLowerCase())
      );
    });

  const filteredData = filterFaulty
    ? keywordFiltered.filter(({ row }) => row.isFaulty)
    : keywordFiltered;


  const sortedData = [...filteredData];

  if (sortConfig) {
    sortedData.sort((a, b) => {
      const aValue = a.row[sortConfig.key] ?? "";
      const bValue = b.row[sortConfig.key] ?? "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }



  const getVideoThumbnail = (videoUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoUrl;
      video.currentTime = 1; // Seek to 1 second
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to extract thumbnail blob"));
          }, "image/jpeg");
        } else {
          reject(new Error("Canvas context not available"));
        }
      };

      video.onerror = (err) => reject(err);
    });
  };
  const handleFaultyChange = (originalIndex: number) => {
    const currentValue = allData[originalIndex]?.isFaulty ?? false;
    updateRow(originalIndex, "isFaulty", !currentValue);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isCSV = file.name.endsWith(".csv");
    setFileName(file.name);
    setFileUploaded(true);

    reader.onload = (evt) => {
      const bstr = evt.target?.result;

      if (isCSV) {
        Papa.parse(bstr as string, {
          header: true,
          skipEmptyLines: true,
          complete: (results: { data: RowData[] }) => {
            const jsonData = results.data as RowData[];

            const withMedia = jsonData.map((row) => {
              const rawIsFaulty = row.isFaulty;

              return {
                ...row,
                media: row["CREATIVE_URL_SUPPLIER"],
                remark: row.remark ?? "",
                isFaulty:
                  typeof rawIsFaulty === "boolean"
                    ? rawIsFaulty
                    : ["true", "yes", "1"].includes(String(rawIsFaulty).toLowerCase()),
              };
            });

            setAllData(withMedia);
            setVisibleData(withMedia.slice(0, CHUNK_SIZE));
            localStorage.setItem('mediaData', JSON.stringify(withMedia));
            setCurrentChunk(1);
          },
        });
      } else {
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json<RowData>(ws);

        const withMedia = jsonData.map((row) => {
          const rawIsFaulty = row.isFaulty;

          return {
            ...row,
            media: row["CREATIVE_URL_SUPPLIER"],
            remark: row.remark ?? "",
            isFaulty:
              typeof rawIsFaulty === "boolean"
                ? rawIsFaulty
                : ["true", "yes", "1"].includes(String(rawIsFaulty).toLowerCase()),
          };
        });

        setAllData(withMedia);
        setVisibleData(withMedia.slice(0, CHUNK_SIZE));
        localStorage.setItem('mediaData', JSON.stringify(withMedia));
        setCurrentChunk(1);
      }
    };

    if (isCSV) {
      reader.readAsText(file, "utf-8");
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleExport = async () => {
    if (allData.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Media Data");

    const headers = Object.keys(allData[0]).filter((key) => key !== "media");
    if (exportMode === "with-media") {
      worksheet.columns = [
        ...headers.map((key) => ({ header: key, key })),
        { header: "Media Preview", key: "thumbnail" },
      ];
    } else {
      worksheet.columns = headers.map((key) => ({ header: key, key }));
    }

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      const dataRow = worksheet.addRow(headers.map((k) => row[k]));

      if (exportMode === "with-media") {
        const mediaUrl = row.media;
        if (!mediaUrl) continue;

        try {
          let blob: Blob;
          const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/i);
          if (isVideo) {
            blob = await getVideoThumbnail(mediaUrl); // should return JPEG blob
          } else {
            const res = await fetch(mediaUrl);
            blob = await res.blob();
          }

          const imageBitmap = await createImageBitmap(blob);
          const { width: originalWidth, height: originalHeight } = imageBitmap;

          const maxWidth = 300;
          const maxHeight = 500;

          let displayWidth = maxWidth;
          let displayHeight = (originalHeight / originalWidth) * maxWidth;

          if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = (originalWidth / originalHeight) * maxHeight;
          }


          const buffer = await blob.arrayBuffer();
          const extension = isVideo ? "jpeg" : mediaUrl.endsWith(".png") ? "png" : "jpeg";

          const imageId = workbook.addImage({ buffer, extension });

          const colIndex = headers.length;
          worksheet.getColumn(colIndex + 1).width = displayWidth / 7; // ExcelJS column width ≈ pixels / 7
          worksheet.getRow(dataRow.number).height = displayHeight * 0.75; // ExcelJS row height ≈ pixels / 0.75

          worksheet.addImage(imageId, {
            tl: { col: colIndex, row: dataRow.number - 1 },
            ext: {
              width: displayWidth,
              height: displayHeight,
            },
            editAs: "oneCell",
          });
        } catch (err) {
          console.error("Error embedding media for row", i + 1, err);
        }
      }

      // Update progress
      setExportProgress(Math.round(((i + 1) / allData.length) * 100));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const exportFileName =
      fileName?.replace(/\.(xlsx|xls|csv)$/i, "") || "exported_data";

    const suffix = exportMode === "with-media" ? "_with_media" : "";
    saveAs(blob, `${exportFileName}${suffix}.xlsx`);

    setIsExporting(false);
    setExportProgress(0);
  };



  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (fileUploaded) {
        const message = "You have unsaved data. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    const handlePopState = () => {
      if (fileUploaded) {
        const message = "You have unsaved data. Are you sure you want to leave?";
        const isConfirmed = window.confirm(message);
        if (!isConfirmed) {
          window.history.pushState(null, "", window.location.href);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fileUploaded]);

  const renderMedia = (url?: string) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    const commonClasses = "w-full h-min:[50px] object-contain rounded";

    return isVideo ? (
      <video src={url} controls className={commonClasses} />
    ) : (
      <img src={url} alt="media" className={commonClasses} />
    );
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const bottomReached =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 50;

    if (bottomReached && visibleData.length < allData.length) {
      const nextChunk = currentChunk + 1;
      setVisibleData(allData.slice(0, nextChunk * CHUNK_SIZE));
      setCurrentChunk(nextChunk);
    }
  };

  const handleRemarkChange = (originalIndex: number, value: string) => {
    updateRow(originalIndex, "remark", value);
  };

  const updateRow = (
    globalIndex: number,
    field: string,
    value: any
  ) => {
    const updatedAll = [...allData];
    updatedAll[globalIndex] = {
      ...updatedAll[globalIndex],
      [field]: value,
    };
    setAllData(updatedAll);

    const chunkSize = currentChunk * CHUNK_SIZE;
    setVisibleData(updatedAll.slice(0, chunkSize));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      const isCSV = file.name.endsWith(".csv");
      setFileName(file.name);
      setFileUploaded(true);

      reader.onload = (evt) => {
        const bstr = evt.target?.result;

        if (isCSV) {
          Papa.parse(bstr as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: RowData[] }) => {
              const jsonData = results.data as RowData[];

              const withMedia = jsonData.map((row) => ({
                ...row,
                media: row["CREATIVE_URL_SUPPLIER"],
                remark: "",
              }));

              setAllData(withMedia);
              setVisibleData(withMedia.slice(0, CHUNK_SIZE));
              setCurrentChunk(1);
            },
          });
        } else {
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json<RowData>(ws);

          const withMedia = jsonData.map((row) => ({
            ...row,
            media: row["CREATIVE_URL_SUPPLIER"],
            remark: "",
          }));

          setAllData(withMedia);
          setVisibleData(withMedia.slice(0, CHUNK_SIZE));
          setCurrentChunk(1);
        }
      };

      if (isCSV) {
        reader.readAsText(file, "utf-8");
      } else {
        reader.readAsBinaryString(file);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [visibleData, currentChunk, allData]);

  return (
    <div className="mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Upload Excel or CSV File</h2>

      {!fileUploaded && (
        <div className="flex justify-center items-center min-h-[500px]">
          <div
            className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-blue-500 rounded cursor-pointer w-full max-w-[600px] text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 mb-4">
              Choose File
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            <p className="text-gray-600">Or drag and drop your file here</p>
          </div>
        </div>
      )}

      {fileUploaded && (
        <div className="flex items-center justify-between w-full mb-4">
          {/* Left side: file button + name */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">
              Choose File
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            <span className="text-gray-700">{fileName}</span>
          </div>

          {/* Right side: stats */}
          {totalRows > 0 && (
            <div className="text-sm text-right text-gray-700 space-y-1">
              <div>
                <strong>Faulty Ads Count:</strong> {faultyRows} / {totalRows}
              </div>
              <div>
                <strong>Faulty Ads Count %:</strong> {faultyPercentage}%
              </div>
              <div>
                <strong>Faulty Ads Impression %:</strong>{" "}
                {hasImpressions ? (
                  `${impressionPercentage}%`
                ) : (
                  <span className="text-red-500">Column IMPRESSIONS missing</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full mb-4">
        <div className="w-full flex flex-wrap items-center gap-2 mb-2">
          {searchKeywords.map((keyword, idx) => (
            <span
              key={idx}
              className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full flex items-center"
            >
              {keyword}
              <button
                onClick={() =>
                  setSearchKeywords(searchKeywords.filter((k) => k !== keyword))
                }
                className="ml-1 text-blue-500 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}

          {/* ✅ Clear All Button */}
          {searchKeywords.length > 0 && (
            <button
              onClick={() => setSearchKeywords([])}
              className="ml-2 text-sm text-red-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
            placeholder="Search across all columns and press Enter..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchInput.trim()) {
                const trimmed = searchInput.trim();
                if (!searchKeywords.includes(trimmed)) {
                  setSearchKeywords([...searchKeywords, trimmed]);
                }
                setSearchInput("");
              }
            }}
          />
          <button
            onClick={() => {
              const trimmed = searchInput.trim();
              if (trimmed && !searchKeywords.includes(trimmed)) {
                setSearchKeywords([...searchKeywords, trimmed]);
              }
              setSearchInput("");
            }}
            className="text-blue-600 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            🔍
          </button>
        </div>
      </div>
      <div className="w-[100%] max-h-[1360px] overflow-auto border rounded" ref={containerRef}>
        {filterFaulty && filteredData.length === 0 && (
          <div className="p-4 text-center text-gray-500">No faulty rows found.</div>
        )}

        <table className="min-w-full border border-gray-300 table-auto" style={{ tableLayout: "fixed" }}>
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
            <tr>
              <th className="border px-3 py-2 w-[80px] text-center">Index</th>
              {baseKeys.map((key, index) => {
                const isActive = sortConfig?.key === key;
                const sortIcon = isActive
                  ? sortConfig.direction === "asc" ? "▲" : "▼"
                  : "⇅";

                return (
                  <th
                    key={key}
                    onClick={() => {
                      setSortConfig((prev) => {
                        if (!prev || prev.key !== key) {
                          return { key, direction: "asc" };
                        } else if (prev.direction === "asc") {
                          return { key, direction: "desc" };
                        } else {
                          return null;
                        }
                      });
                    }}
                    className="border px-3 py-2 cursor-pointer hover:bg-gray-200 select-none"
                    style={{
                      width: index === 0 ? "150px" : "200px",
                      wordWrap: "break-word",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{key}</span>
                      <span className="text-xs text-gray-500 ml-2">{sortIcon}</span>
                    </div>
                  </th>
                );
              })}

              <th className="border px-3 py-2 w-1/6">Media</th>
              <th className="border px-3 py-2 w-1/7">Remark</th>
              <th className="border px-3 py-2 text-center align-middle w-[150px]">
                <div className="flex items-center justify-center space-x-1">
                  <span>Is Faulty</span>
                  <button
                    onClick={() => setFilterFaulty(!filterFaulty)}
                    className={`text-sm p-1 rounded ${filterFaulty ? "bg-blue-200" : "bg-gray-100"
                      } hover:bg-blue-300`}
                    title={filterFaulty ? "Remove filter" : "Filter by faulty"}
                  >
                    {filterFaulty ? "❌" : "🔍"}
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={baseKeys.length + 4} className="text-center p-4 text-gray-500">
                  No data to display.
                </td>
              </tr>
            ) : (
              sortedData.map((data, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {/* Index column */}
                  <td className="border px-3 py-2 text-center">{data.originalIndex + 1}</td>

                  {/* Other columns */}
                  {baseKeys.map((key, index) => (
                    <td
                      key={key}
                      className="border px-3 py-2 text-sm"
                      style={{
                        width: index === 0 ? "150px" : "200px", // Keeps your original column sizing
                        wordWrap: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-all",
                        whiteSpace: "normal",
                      }}
                    >
                      {data.row[key]}
                    </td>
                  ))}

                  <td className="border p-0 h-40 w-1/6">
                    {renderMedia(data.row.media)}
                  </td>

                  <td className="border px-3 py-2 w-1/7">
                    <input
                      type="text"
                      value={data.row.remark ?? ""}
                      onChange={(e) => handleRemarkChange(data.originalIndex, e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Add remark"
                    />

                  </td>

                  <td className="border px-3 py-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={data.row.isFaulty ?? false}
                      onChange={() => handleFaultyChange(data.originalIndex)}
                      className="form-checkbox w-5 h-5 text-blue-600"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>


      {fileUploaded && (
        <div className="mt-4 flex flex-col items-center gap-2 w-full">
          {/* Dropdown for selecting export mode */}
          <div className="mb-2">
            <label className="mr-2 font-medium text-gray-700">Export Option:</label>
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as "with-media" | "without-media")}
              className="border rounded px-2 py-1"
            >
              <option value="without-media">Without Media</option>
              <option value="with-media">With Media</option>
            </select>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export File"}
          </button>

          {/* Progress bar */}
          {isExporting && (
            <div className="w-full max-w-md mt-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-500 h-3 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                Embedding media... {exportProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {fileUploaded && (
        <div className="mt-4 flex flex-col gap-6 w-full">
          <h2 className="text-xl font-bold mb-4">File Analysis</h2>

          <div className="flex flex-wrap gap-4">
            {/* Advertiser Pivot Table */}
            <div className="w-full md:w-1/2 bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg mb-2">Advertiser Distribution (Pivot Table)</h3>
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Advertiser</th>
                    <th className="border px-4 py-2 text-left">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {[...advertiserData]
                    .sort((a, b) => b.value - a.value)
                    .map((item: { id: string; value: number }) => (
                      <tr key={item.id}>
                        <td className="border px-4 py-2 break-words">{item.id}</td>
                        <td className="border px-4 py-2">{item.value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Campaign Name Pivot Table */}
            <div className="w-[80%] bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg mb-2">Campaign Distribution (Pivot Table)</h3>
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left max-w-[60%]">Campaign Name</th>
                    <th className="border px-4 py-2 text-left w-[20%]">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {[...campaignData]
                    .sort((a, b) => b.value - a.value)
                    .map((item: { id: string; value: number }) => (
                      <tr key={item.id}>
                        <td className="border px-4 py-2 break-words max-w-[70%]">{item.id}</td>
                        <td className="border px-4 py-2">{item.value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


    </div>
  );

};

export default MediaInspector;
