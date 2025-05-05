import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const REQUIRED_COLUMNS = ['COUNTRY', 'CATEGORY', 'BRAND', 'PLATFORM', 'MONTH', 'IMPRESSIONS'];

const GetSocialToolData: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'substitute' | 'manage'>('substitute');
    const [error, setError] = useState<string | null>(null);
    const [fileData, setFileData] = useState<any>(null);
    const [zeroRows, setZeroRows] = useState<number[]>([]);
    const [highlightIndex, setHighlightIndex] = useState<number>(-1);
    const [modifiedZeroRows, setModifiedZeroRows] = useState<number[]>([]);
    const [SubstitutedData, setSubstitutedData] = useState<any[]>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setError(null);
        setFileData(null);

        if (!file) return;

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            let workbook;

            if (fileExt === 'csv') {
                const text = e.target?.result as string;
                workbook = XLSX.read(text, { type: 'string' });
            } else {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                workbook = XLSX.read(data, { type: 'array' });
            }

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

            if (json.length === 0) {
                setError('The uploaded file is empty.');
                return;
            }

            const headers = json[0].map((h) => h.toString().trim().toUpperCase());
            const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
            if (missing.length > 0) {
                setError(`Missing required columns: ${missing.join(', ')}`);
                return;
            }

            const requiredIndexes = REQUIRED_COLUMNS.map(col => headers.indexOf(col));

            const filteredData = json.map((row, index) => {
                const filteredRow = requiredIndexes.map(i => {
                    let value = row[i];
                    if (headers[i] === 'MONTH' && index !== 0) {
                        value = formatDate(value);
                    }
                    return value;
                });
                return filteredRow;
            });

            setFileData(filteredData);

            const impressionsIndex = REQUIRED_COLUMNS.indexOf('IMPRESSIONS');
            const rowsWithZero = filteredData
                .map((row, i) => i > 0 && Number(row[impressionsIndex]) === 0 ? i : -1)
                .filter(i => i !== -1);

            setZeroRows(rowsWithZero);
            setHighlightIndex(rowsWithZero.length > 0 ? 0 : -1);
        };

        if (fileExt === 'csv') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    const formatDate = (dateValue: any) => {
        const dateStr = dateValue?.toString();
        if (!isNaN(dateValue)) {
            const excelStartDate = new Date(1900, 0, 1);
            const date = new Date(excelStartDate.getTime() + (dateValue - 2) * 86400000);
            return date.toISOString().split('T')[0];
        }

        if (dateStr && dateStr.includes('/')) {
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
                const [month, day, year] = dateParts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return '';
    };

    const handleDeleteRow = (index: number) => {
        setSubstitutedData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const handleDownloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(SubstitutedData);  // Convert the data to a worksheet
        const wb = XLSX.utils.book_new();  // Create a new workbook
        XLSX.utils.book_append_sheet(wb, ws, "SUBSTITUTED Logs");  // Append the worksheet to the workbook

        // Generate and download the Excel file
        XLSX.writeFile(wb, "SUBSTITUTED_Logs.xlsx");
    };

    return (
        <div className="p-8 flex flex-col items-center min-h-screen bg-gray-50">
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    className={`px-6 py-2 font-semibold text-sm rounded-t-md transition ${activeTab === 'substitute'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    onClick={() => setActiveTab('substitute')}
                >
                    Substitute Data
                </button>
                <button
                    className={`ml-2 px-6 py-2 font-semibold text-sm rounded-t-md transition ${activeTab === 'manage'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    onClick={() => setActiveTab('manage')}
                >
                    Manage Data
                </button>
            </div>
            <div className="w-full max-w-10xl border border-gray-300 rounded-md p-6 bg-white shadow-xl">
                {activeTab === 'substitute' && (
                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-semibold mb-6">Substitute Data</h2>
                        <label
                            htmlFor="xlsx-upload"
                            className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700 transition"
                        >
                            Upload XLSX/CSV File
                        </label>
                        <input
                            id="xlsx-upload"
                            type="file"
                            accept=".xlsx,.csv"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        {error && (
                            <div className="mt-6 text-red-600 text-sm font-medium bg-red-100 px-4 py-2 rounded">
                                {error}
                            </div>
                        )}
                        {fileData && (
                            <div className="grid grid-cols-2 gap-6 mt-6 w-full">
                                <div className="border border-gray-300 h-96 overflow-y-auto relative">
                                    {zeroRows.length > 0 && (
                                        <div className="sticky top-0 z-10 flex justify-between bg-white border-b border-gray-200 px-4 py-2">
                                            <h3 className="font-semibold text-lg mt-3 ml-3">AGG File</h3> {/* AGG File Header */}
                                            <div>
                                                <button
                                                    onClick={() => setHighlightIndex(prev => Math.max(0, prev - 1))}
                                                    className="px-3 py-1 text-xl bg-gray-200 rounded hover:bg-gray-300 mr-2"
                                                    title="Previous Zero"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => setHighlightIndex(prev => Math.min(zeroRows.length - 1, prev + 1))}
                                                    className="px-3 py-1 text-xl bg-gray-200 rounded hover:bg-gray-300"
                                                    title="Next Zero"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-6 pt-2">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr>
                                                    {fileData[0].map((col: string, index: number) => (
                                                        <th key={index} className="border px-4 py-2">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fileData.slice(1).map((row: string[], rowIndex: number) => (
                                                    <tr key={rowIndex}>
                                                        {row.map((cell: string, colIndex: number) => (
                                                            <td
                                                                key={colIndex}
                                                                className={`border px-4 py-2 ${REQUIRED_COLUMNS[colIndex] === 'IMPRESSIONS' &&
                                                                        Number(cell) === 0 &&
                                                                        rowIndex + 1 === zeroRows[highlightIndex]
                                                                        ? 'bg-red-300 font-semibold'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                {REQUIRED_COLUMNS[colIndex] === 'IMPRESSIONS' &&
                                                                    modifiedZeroRows.includes(rowIndex + 1) ? (
                                                                    <div className="flex items-center justify-between">
                                                                        <span>{cell}</span>
                                                                        <button
                                                                            className="ml-2 text-red-500 font-bold"
                                                                            onClick={() => {
                                                                                setFileData((prevData: any[][]) => {
                                                                                    const updated = [...prevData];
                                                                                    updated[rowIndex + 1][colIndex] = 0;

                                                                                    return updated;
                                                                                });

                                                                                setModifiedZeroRows(prev => prev.filter(i => i !== rowIndex + 1));
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    cell
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>


                                <div className="border border-gray-300 p-6 flex flex-col justify-between h-full">
                                    <h3 className="font-semibold mb-4">Social Tools Data</h3>
                                    <div className="flex gap-4 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="border px-3 py-2 rounded-md text-sm w-full"
                                        />
                                        <select className="border px-2 py-2 rounded-md text-sm">
                                            <option value="">Country</option>
                                            <option value="US">US</option>
                                            <option value="CA">CA</option>
                                            <option value="IN">IN</option>
                                        </select>
                                        <select className="border px-2 py-2 rounded-md text-sm">
                                            <option value="">Category</option>
                                            <option value="Retail">Retail</option>
                                            <option value="Tech">Tech</option>
                                            <option value="Travel">Travel</option>
                                        </select>
                                    </div>
                                    <div className="overflow-x-auto flex-grow">
                                        <table className="min-w-full table-auto border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 border-b text-left">Brand</th>
                                                    <th className="px-4 py-2 border-b text-left">Country</th>
                                                    <th className="px-4 py-2 border-b text-left">Platform</th>
                                                    <th className="px-4 py-2 border-b text-left">Metric</th>
                                                    <th className="px-4 py-2 border-b text-left">Value</th>
                                                    <th className="px-4 py-2 border-b text-left">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { brand_id: 'Facebook-123', brand: 'Brand A', platform: 'Facebook', metric: 'Taking About Trend', country: 'US', value: 1000 },
                                                    { brand_id: 'Instagram-123', brand: 'Brand B', platform: 'Instagram', metric: 'New Follower Trend', country: 'CA', value: 1500 },
                                                    { brand_id: 'Twitter-123', brand: 'Brand C', platform: 'Twitter', metric: 'New Follower Trend', country: 'IN', value: 1300 },
                                                ].map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        <td className="px-4 py-2 border-b text-left">{row.brand}</td>
                                                        <td className="px-4 py-2 border-b text-left">{row.country}</td>
                                                        <td className="px-4 py-2 border-b text-left">{row.platform}</td>
                                                        <td className="px-4 py-2 border-b text-left">{row.metric}</td>
                                                        <td className="px-4 py-2 border-b text-left">{row.value}</td>
                                                        <td className="px-4 py-2 border-b text-left">
                                                            <button
                                                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                                                onClick={() => {
                                                                    if (highlightIndex === -1) return;

                                                                    const rowToUpdate = zeroRows[highlightIndex];

                                                                    setFileData((prevData: any[][]) => {
                                                                        const headers = prevData[0];
                                                                        const impIndex = headers.findIndex(h => h.toUpperCase() === 'IMPRESSIONS');
                                                                        const updated = [...prevData];
                                                                        updated[rowToUpdate][impIndex] = row.value;

                                                                        return updated;
                                                                    });

                                                                    setModifiedZeroRows(prev => [...prev, zeroRows[highlightIndex]]);

                                                                    // Get the SUBSTITUTED data from second grid and add to SUBSTITUTEDData state
                                                                    const newSUBSTITUTEDRow = {
                                                                        COUNTRY: fileData[rowToUpdate][0],  // Assuming COUNTRY is in column 0 of the uploaded file
                                                                        CATEGORY: fileData[rowToUpdate][1], // Assuming CATEGORY is in column 1 of the uploaded file
                                                                        BRAND: fileData[rowToUpdate][2],    // Assuming BRAND is in column 2 of the uploaded file
                                                                        PLATFORM: fileData[rowToUpdate][3],    // Assuming MONTH is in column 3 of the uploaded file
                                                                        MONTH: fileData[rowToUpdate][4],
                                                                        SUBSTITUTED_BRAND_ID: row.brand_id,
                                                                        SUBSTITUTED_BRAND: row.brand,
                                                                        SUBSTITUTED_BRAND_COUNTRY: row.country,
                                                                        SUBSTITUTED_BRAND_METRIC: row.metric,
                                                                        SUBSTITUTED_BRAND_PLATFORM: row.platform,
                                                                        SUBSTITUTED_VALUE: row.value
                                                                    };

                                                                    setSubstitutedData(prev => [...prev, newSUBSTITUTEDRow]);
                                                                }}
                                                            >
                                                                Substitute
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Grid 3 */}
                                <div className="col-span-2 border border-gray-300 p-6 mt-6">
                                    <h3 className="font-semibold text-sm">Substituted Logs</h3>
                                    <table className="w-full table-auto border-collapse mt-4">
                                        <thead>
                                            <tr>
                                                <th className="px-2 py-1 border-b text-left text-xs">COUNTRY</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">CATEGORY</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">BRAND</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">PLATFORM</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">MONTH</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">SUBSTITUTED_BRAND</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">SUBSTITUTED_BRAND_COUNTRY</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">SUBSTITUTED_BRAND_PLATFORM</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">SUBSTITUTED_BRAND_METRIC</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">SUBSTITUTED_VALUE</th>
                                                <th className="px-2 py-1 border-b text-left text-xs">ACTION</th> {/* Added Action column for X button */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SubstitutedData.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="px-2 py-1 border-b text-xs">{row.COUNTRY}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.CATEGORY}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.BRAND}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.PLATFORM}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.MONTH}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.SUBSTITUTED_BRAND}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.SUBSTITUTED_BRAND_COUNTRY}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.SUBSTITUTED_BRAND_PLATFORM}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.SUBSTITUTED_BRAND_METRIC}</td>
                                                    <td className="px-2 py-1 border-b text-xs">{row.SUBSTITUTED_VALUE}</td>
                                                    <td className="px-2 py-1 border-b text-xs">
                                                        <button
                                                            className="text-red-500 font-bold"
                                                            onClick={() => handleDeleteRow(index)}
                                                            title="Delete Row"
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-6">
                                        <button
                                            onClick={handleDownloadExcel}
                                            className="bg-green-600 text-white px-6 py-2 rounded-md shadow hover:bg-green-700 transition"
                                        >
                                            Save SUBSTITUTED
                                        </button>
                                    </div>
                                </div>


                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'manage' && (
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Manage Data</h2>
                        <p>This tab will allow users to manage existing data entries.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GetSocialToolData;
