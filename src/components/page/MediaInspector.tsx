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
  const [fileName, setFileName] = useState<string | null>(null); // Track the file name
  const [fileUploaded, setFileUploaded] = useState(false); // Track whether the file has been uploaded
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  
  
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
  
            const withMedia = jsonData.map((row) => ({
              ...row,
              media: row["CREATIVE_URL_SUPPLIER"],
              remark: "",
            }));
  
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
  
        const withMedia = jsonData.map((row) => ({
          ...row,
          media: row["CREATIVE_URL_SUPPLIER"],
          remark: "",
        }));
  
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

    const handlePopState = (e: PopStateEvent) => {
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
  
  const handleRemarkChange = (index: number, value: string) => {
    const updated = [...visibleData];
    updated[index].remark = value;
    setVisibleData(updated);
  
    const globalIndex = (currentChunk - 1) * CHUNK_SIZE + index;
    const globalData = [...allData];
    if (globalIndex < globalData.length) {
      globalData[globalIndex].remark = value;
      setAllData(globalData);
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
        <div className="flex items-center gap-4 mb-4">
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
      )}

      {visibleData.length > 0 && (
        <div
          className="overflow-auto max-h-[1080px] max-w-full border rounded"
          ref={containerRef}
        >
          <table
            className="min-w-full border border-gray-300 table-auto"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="bg-gray-100 text-left">
              <tr>
                {Object.keys(visibleData[0])
                  .filter((key) => key !== "media" && key !== "remark")
                  .map((key, index) => (
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
                <th
                  className="border px-3 py-2"
                  style={{
                    width: "250px",
                    wordWrap: "break-word",
                    margin: "10px",
                  }}
                >
                  Media
                </th>
                <th
                  className="border px-3 py-2"
                  style={{ width: "200px", wordWrap: "break-word" }}
                >
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.keys(row)
                    .filter((key) => key !== "media" && key !== "remark")
                    .map((key, index) => (
                      <td
                        key={key}
                        className="border px-3 py-2 text-sm"
                        style={{
                          width: index === 0 ? "150px" : "200px",
                          wordWrap: "break-word",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          wordBreak: "break-all",
                          whiteSpace: "normal",
                        }}
                      >
                        {row[key]}
                      </td>
                    ))}
                  <td className="border p-0 h-40" style={{ width: "10px" }}>
                    {renderMedia(row.media)}
                  </td>
                  <td className="border px-3 py-2" style={{ width: "150px" }}>
                    <input
                      type="text"
                      value={row.remark ?? ""}
                      onChange={(e) => handleRemarkChange(idx, e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Add remark"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
