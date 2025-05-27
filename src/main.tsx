import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import App from './App';
import AdMosaicManage from './components/page/AdMosaicManage';
import GetSocialToolData from './components/page/GetSocialToolData'; // ✅ Import the component
import MediaInspector from './components/page/MediaInspector';
import PagePreview from './components/page/PagePreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ad-mosaic-manage" element={<AdMosaicManage />} />
        <Route path="/ad-mosaic-manage/page/:pageId" element={<PagePreview />} />
        <Route path="/social-tool" element={<GetSocialToolData />} />
        <Route path="/media-inspector" element={<MediaInspector />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
