'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

type Page = {
  page_id: number;
  page_name: string;
  source_table_name: string;
  // Add other fields if needed
};

export default function EditPageModal({
  open,
  setOpen,
  page,
  onPageUpdated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  page: Page | null;
  onPageUpdated?: () => void;
}) {
  const [pageName, setPageName] = useState('');
  const [sourceTable, setSourceTable] = useState('');

  useEffect(() => {
    if (page && open) {
      setPageName(page.page_name);
      setSourceTable(page.source_table_name);
    }
  }, [page, open]);

  const handleUpdate = async () => {
    if (!page || !pageName || !sourceTable) return;

    try {
      await axios.put(
        `http://localhost:3001/pages/${page.page_id}`,
        {
          pageName,
          sourceTable,
        },
        {
          withCredentials: true,
        }
      );

      onPageUpdated?.();
      setOpen(false);
    } catch (err) {
      console.error('Error updating page:', err);
    }
  };

  if (!open || !page) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold">Edit Page</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Page Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g. UL TH Nutrition"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source Table</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            placeholder="project_id.dataset_id.table_id"
            value={sourceTable}
            onChange={(e) => setSourceTable(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!pageName || !sourceTable}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
