import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type Ad = {
  brand: string;
  url: string;
  impression: number;
  spend: number;
};

export default function PagePreview() {
  const { pageId } = useParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [brandFilter, setBrandFilter] = useState('All Brands');

  useEffect(() => {
    fetch(`http://localhost:3001/pages/${pageId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAds(data.ads_list))
      .catch(console.error);
  }, [pageId]);

  const brands = Array.from(new Set(ads.map(ad => ad.brand)));

  const filteredAds = (() => {
    if (brandFilter === 'All Brands') {
      return [...ads].sort((a, b) => b.impression - a.impression).slice(0, 15);
    } else {
      return ads
        .filter(ad => ad.brand === brandFilter)
        .sort((a, b) => b.impression - a.impression)
        .slice(0, 15);
    }
  })();

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Filter Dropdown */}
      <div className="mb-6">
      <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="h-9 px-3 border border-orange-500 bg-black text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
            <option>All Brands</option>
            {brands.map(b => (
                <option key={b}>{b}</option>
            ))}
            </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad, i) => (
          <div
            key={i}
            className="border-2 border-orange-500 shadow p-3 flex flex-col items-center"
          >
            <video
              controls
              src={ad.url}
              className="w-full h-48 object-cover mb-2"
            />
            <div className="text-sm text-white font-medium text-center">
              {i + 1}. {ad.brand}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
