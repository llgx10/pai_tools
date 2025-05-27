'use client';

import axios from 'axios';

type Page = {
  page_id: number;
  page_name: string;
};

export default function DeletePageModal({
  open,
  setOpen,
  page,
  onPageDeleted,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  page: Page | null;
  onPageDeleted?: () => void;
}) {
  const handleDelete = async () => {
    if (!page) return;

    try {
      await axios.delete(`http://localhost:3001/pages/${page.page_id}`, {
        withCredentials: true,
      });

      onPageDeleted?.();
      setOpen(false);
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  if (!open || !page) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4 shadow-lg text-center">
        <h2 className="text-lg font-semibold">Delete Page</h2>
        <p>
          Are you sure you want to delete <strong>{page.page_name}</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
