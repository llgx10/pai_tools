import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, User } from 'lucide-react';
import axios from 'axios';
import CreatePageModal from '../modals/CreatePageModal';
import EditPageModal from '../modals/EditPageModal';
import DeletePageModal from '../modals/DeletePageModal';

type Page = {
  page_id: number;
  page_name: string;
  source_table_name: string;
  created_at: string;
  updated_at: string;
  ads_list: any[];
};

const ITEMS_PER_PAGE = 8;

function AdMosaicManage() {
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const API_BASE_URL = process.env.API_BASE_URL || '';

  // Check user authentication
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/auth/user`, { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  // Fetch pages if user is logged in
  useEffect(() => {
    if (!user) return;
    fetchPages();
  }, [user]);

  const fetchPages = () => {
    fetch(`${API_BASE_URL}/pages`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPages(data))
      .catch(err => console.error('Failed to fetch pages:', err));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Welcome to Ad Mosaic</h1>
        <a
          href={`${API_BASE_URL}/auth/google`}
          className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-blue-600"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  const filteredItems = pages.filter(p =>
    p.page_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const start = page * ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(start, start + ITEMS_PER_PAGE);

  const handlePrev = () => setPage(p => Math.max(p - 1, 0));
  const handleNext = () => setPage(p => Math.min(p + 1, totalPages - 1));

  const fullLogout = async () => {
    await fetch(`${API_BASE_URL}/pages/logout`, {
      method: 'GET',
      credentials: 'include',
    });

    window.location.href =
      'https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:5173';
  };

  // Open edit modal with selected page
  const openEditModal = (page: Page) => {
    setSelectedPage(page);
    setEditModalOpen(true);
  };

  // Open delete modal with selected page
  const openDeleteModal = (page: Page) => {
    setSelectedPage(page);
    setDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">📄 Ad Mosaic Pages</h1>
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Plus size={22} />
            </button>

            {/* User Dropdown */}
            <div className="relative group">
              <button className="text-gray-600 hover:text-gray-800 focus:outline-none">
                <User size={22} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-md text-sm text-gray-700 hidden group-hover:block group-focus:block">
                <div className="px-4 py-3 border-b">{user.displayName || user.name || 'User'}</div>
                <button
                  onClick={fullLogout}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <input
            type="text"
            placeholder="🔍 Search pages..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full p-4 mb-6 rounded-2xl bg-white shadow-inner border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
          />

          <div className="grid gap-4">
            {currentItems.map(item => {
              const adsList = Array.isArray(item.ads_list)
                ? item.ads_list
                : typeof item.ads_list === 'string'
                  ? JSON.parse(item.ads_list || '[]')
                  : [];

              const brandCount = new Set(adsList.map((ad: any) => ad.brand)).size;
              const videoCount = adsList.length;

              return (
                <div
                  key={item.page_id}
                  className="relative group bg-white rounded-2xl shadow-sm p-4 text-gray-800 flex flex-col gap-2 hover:shadow-md transition cursor-pointer"
                  onClick={() => window.open(`/ad-mosaic-manage/page/${item.page_id}`, '_blank')}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold hover:underline">{item.page_name}</div>
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {brandCount} brand{brandCount !== 1 && 's'} · {videoCount} video{videoCount !== 1 && 's'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={page === 0}
            className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold shadow hover:bg-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ◀ Prev
          </button>

          <span className="text-gray-600 text-sm">
            Page {page + 1} of {totalPages || 1}
          </span>

          <button
            onClick={handleNext}
            disabled={page >= totalPages - 1}
            className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold shadow hover:bg-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next ▶
          </button>
        </div>
      </footer>

      {/* Modals */}
      <CreatePageModal
        open={createModalOpen}
        setOpen={setCreateModalOpen}
        onPageCreated={fetchPages}
      />
      {selectedPage && (
        <>
          <EditPageModal
            open={editModalOpen}
            setOpen={setEditModalOpen}
            page={selectedPage}
            onPageUpdated={() => {
              fetchPages();
              setEditModalOpen(false);
            }}
          />
          <DeletePageModal
            open={deleteModalOpen}
            setOpen={setDeleteModalOpen}
            page={selectedPage}
            onPageDeleted={() => {
              fetchPages();
              setDeleteModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

export default AdMosaicManage;
