import { useState } from 'react';
import { Link  } from 'react-router-dom';
import { Film,ALargeSmall,Hammer  } from 'lucide-react';
import { ConfigProvider, FloatButton, theme as antdTheme } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css'; // Reset Ant Design styles
import AppHeader from "./components/modals/Headers";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AppHeader />
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'bg-[#141414]' : 'bg-gray-100'
        } py-12 px-6`}
      >
        <div
          className={`max-w-md w-full space-y-6 p-8 rounded-lg shadow-lg text-center transition-colors duration-300 ${
            isDarkMode ? 'bg-[#1f1f1f] text-white' : 'bg-white text-black'
          }`}
        >
          <h1 className="text-3xl font-semibold text-blue-600 mb-6">PAI Tools</h1>

          <div className="flex flex-col gap-6">
            {/* <Link
              to="/media-inspector"
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200"
            >
              <Film className="text-2xl mr-2" />
              Media Inspector
            </Link> */}

            <Link
              to="/media-inspector2"
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition duration-200"
            >
              <Film className="text-2xl mr-2" />
              Media Inspector v2
            </Link>
            <Link
              to="/text-converter"
              className="flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-green-700 transition duration-200"
            >
              <ALargeSmall  className="text-2xl mr-2" />
              Text Converter
            </Link>
            <Link
              to="/query-builder"
              className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition duration-200"
            >
              <Hammer   className="text-2xl mr-2" />
              Query Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Theme Toggle Button */}
      <FloatButton
        icon={<BulbOutlined />}
        type="primary"
        tooltip={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </ConfigProvider>
  );
}

export default App;
