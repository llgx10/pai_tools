import React, { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    const isCSV = file.name.endsWith(".csv");
  
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
  
      if (isCSV) {
        Papa.parse(bstr as string, {
          header: true,
          skipEmptyLines: true,
          complete: (results: { data: RowData[]; }) => {
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
  };

  const handleExtract = () => {
    alert("Extract triggered!"); // Replace with actual logic
  };

  const renderMedia = (url?: string) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    const commonClasses = "w-full h-min:[50px] object-contain rounded"; // or 'object-cover'
  
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

      <div className="mb-6">
        <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">
          Choose File
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

    

      {visibleData.length > 0 && (
  <div
    className="overflow-auto max-h-[1080px] max-w-full border rounded"
    ref={containerRef}
  >
    <table className="min-w-full border border-gray-300 table-auto" style={{ tableLayout: "fixed" }}>
      <thead className="bg-gray-100 text-left">
        <tr>
          {Object.keys(visibleData[0])
            .filter((key) => key !== "media" && key !== "remark")
            .map((key, index) => (
              <th key={key} className="border px-3 py-2" style={{ width: `${index === 0 ? '150px' : '200px'}`, wordWrap: 'break-word' }}>
                {key}
              </th>
            ))}
          <th className="border px-3 py-2" style={{ width: '250px', wordWrap: 'break-word',margin:'10px' }}>Media</th>
          <th className="border px-3 py-2" style={{ width: '200px', wordWrap: 'break-word' }}>Remark</th>
        </tr>
      </thead>
      <tbody>
        {visibleData.map((row, idx) => (
          <tr key={idx} className="hover:bg-gray-50">
            {Object.keys(row)
              .filter((key) => key !== "media" && key !== "remark")
              .map((key, index) => (
                <td key={key} className="border px-3 py-2 text-sm" style={{
                  width: `${index === 0 ? '150px' : '200px'}`,
                  wordWrap: 'break-word', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  wordBreak: 'break-all',   // Forces break for long words
                  whiteSpace: 'normal'      // Allows the text to wrap
                }}>
                  {row[key]}
                </td>
              ))}
            <td className="border p-0 h-40" style={{ width: '10px' }}>
              {renderMedia(row.media)}
            </td>
            <td className="border px-3 py-2" style={{ width: '150px' }}>
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


      {allData.length > 0 && (
        <button
          onClick={handleExtract}
          className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
        >
          Extract File
        </button>
      )}
    </div>
  );
};

export default MediaInspector;
