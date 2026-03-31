import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, ALargeSmall, Hammer, BarChart2 } from 'lucide-react';
import { ConfigProvider, FloatButton, theme as antdTheme } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const tiles = [
    {
      title: 'Media Inspector v3',
      icon: <Film className="text-3xl" />,
      link: '/media-inspector3',
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'eSOV Calculator',
      icon: <BarChart2 className="text-3xl" />,
      link: '/esov-calculator',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      title: 'Media Inspector v2',
      icon: <Film className="text-3xl" />,
      link: '/media-inspector2',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      title: 'Text Converter',
      icon: <ALargeSmall className="text-3xl" />,
      link: '/text-converter',
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
    },
    {
      title: 'Query Builder',
      icon: <Hammer className="text-3xl" />,
      link: '/query-builder',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <div
        className={`min-h-screen flex flex-col items-center justify-start transition-colors duration-300 ${
          isDarkMode ? 'bg-[#141414]' : 'bg-gray-100'
        } py-12 px-4`}
      >
        <h1
          className={`text-4xl font-bold mb-12 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}
        >
          PAI Tools
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {tiles.map((tile) => (
            <Link
              key={tile.title}
              to={tile.link}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-lg shadow-md transition duration-200 text-white ${tile.color} ${tile.hoverColor}`}
            >
              {tile.icon}
              <span className="text-lg font-semibold">{tile.title}</span>
            </Link>
          ))}
        </div>
      </div>

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