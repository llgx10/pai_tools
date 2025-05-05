'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CreatePageModal({
  open,
  setOpen,
  onPageCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  onPageCreated?: () => void;
}) {
  const [pageName, setPageName] = useState('');
  const [tables, setTables] = useState<string[]>([]);
  const [sourceTable, setSourceTable] = useState('');
  const [valueType, setValueType] = useState<'NORMALIZED' | 'UNNORMALIZED' | ''>('');

  useEffect(() => {
    if (open) {
      axios
        .get('/api/bigquery/tables')
        .then((res) => setTables(res.data.tables || []))
        .catch(console.error);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!pageName || !sourceTable || !valueType) return;
  
    try {
      await axios.post('http://localhost:3001/create', {
        pageName,
        sourceTable,
        valueType,
      }, {
        withCredentials: true, // important for session cookie!
      });
  
      onPageCreated?.();
      setOpen(false);
      setPageName('');
      setSourceTable('');
      setValueType('');
    } catch (err) {
      console.error('Error creating page:', err);
    }
  };
  

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold">Create New Page</h2>

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

        <div>
          <label className="block text-sm font-medium mb-1">Value Type</label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={valueType}
            onChange={(e) => setValueType(e.target.value as 'NORMALIZED' | 'UNNORMALIZED')}
          >
            <option value="" disabled>
              Select value type...
            </option>
            <option value="NORMALIZED">NORMALIZED</option>
            <option value="UNNORMALIZED">UNNORMALIZED</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!pageName || !sourceTable || !valueType}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
