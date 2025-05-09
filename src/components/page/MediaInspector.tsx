import React, { useState, useEffect, useRef } from "react";
import { saveAs } from 'file-saver';

import * as XLSX from "xlsx";
import Papa from "papaparse";

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
  const [filterFaulty, setFilterFaulty] = useState(false);
  const baseKeys = Object.keys(visibleData[0] || {}).filter(
    (key) => !["media", "remark", "isFaulty"].includes(key)
  );
  const totalRows = allData.length;
  const faultyRows = allData.filter((row) => row.isFaulty).length;

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

    const filteredData = filterFaulty
    ? visibleData
        .map((row, originalIndex) => ({ row, originalIndex }))
        .filter(({ row }) => row.isFaulty)
    : visibleData.map((row, originalIndex) => ({ row, originalIndex }));

  const handleFaultyChange = (index: number) => {
      const currentValue = visibleData[index]?.isFaulty ?? false;
      updateRow(index, "isFaulty", !currentValue);
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

  const handleExport = () => {
    if (allData.length === 0) return;

    const exportData = allData.map(({ media, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Media Data");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const exportFileName = fileName?.replace(/\.(xlsx|xls|csv)$/i, "") || "exported_data";
    saveAs(blob, `${exportFileName}_remarks.xlsx`);
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
    index: number,
    field: string,
    value: any
  ) => {
    const updatedVisible = [...visibleData];
    updatedVisible[index] = {
      ...updatedVisible[index],
      [field]: value,
    };
    setVisibleData(updatedVisible);
  
    const row = visibleData[index];
    const globalIndex = allData.findIndex(r => r === row);
    if (globalIndex !== -1) {
      const updatedAll = [...allData];
      updatedAll[globalIndex] = {
        ...updatedAll[globalIndex],
        [field]: value,
      };
      setAllData(updatedAll);
    }
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
        <div className="flex justify-center items-center min-h-[400px]">
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


      <div className="overflow-auto max-h-[1080px] max-w-full border rounded" ref={containerRef}>
        {/* Filter summary or message */}
        {filterFaulty && filteredData.length === 0 && (
          <div className="p-4 text-center text-gray-500">No faulty rows found.</div>
        )}

        <table className="min-w-full border border-gray-300 table-auto" style={{ tableLayout: "fixed" }}>
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
            <tr>
              <th className="border px-3 py-2 w-[80px] text-center">Index</th>
              {baseKeys.map((key, index) => (
                <th
                  key={key}
                  className="border px-3 py-2"
                  style={{
                    width: index === 0 ? "150px" : "200px",
                    wordWrap: "break-word",
                  }}
                >
                  {key}
                </th>
              ))}
              <th className="border px-3 py-2" style={{ width: "250px" }}>Media</th>
              <th className="border px-3 py-2" style={{ width: "200px" }}>Remark</th>
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
                filteredData.map((data, idx) => (
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

                    <td className="border p-0 h-40" style={{ width: "10px" }}>
                      {renderMedia(data.row.media)}
                    </td>

                    <td className="border px-3 py-2" style={{ width: "150px" }}>
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
                        className="form-checkbox"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>

        </table>
      </div>

      {fileUploaded && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
          >
            Export File
          </button>
        </div>
      )}
    </div>
  );

};

export default MediaInspector;
