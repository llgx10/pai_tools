import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './App.css';
import 'antd/dist/reset.css'; // Import Ant Design styles
import App from './App';
import AdMosaicManage from './components/page/AdMosaicManage';
import GetSocialToolData from './components/page/GetSocialToolData'; // ✅ Import the component
import MediaInspector from './components/page/MediaInspector';
import PagePreview from './components/page/PagePreview';
import MediaInspectorV2 from './components/page/MediaInspector2';
import TextConverter from './components/page/TextConverter';
import QueryBuilder from './components/page/QueryBuilder';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ad-mosaic-manage" element={<AdMosaicManage />} />
        <Route path="/ad-mosaic-manage/page/:pageId" element={<PagePreview />} />
        <Route path="/social-tool" element={<GetSocialToolData />} />
        <Route path="/media-inspector" element={<MediaInspector />} />
        <Route path="/media-inspector2" element={<MediaInspectorV2 />} />
         <Route path="/text-converter" element={<TextConverter />} />
        <Route path="/query-builder" element={<QueryBuilder />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
