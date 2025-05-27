import { Link } from 'react-router-dom';
import { Film, User, Puzzle } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-semibold text-blue-600 mb-6">PAI Tools</h1>

        <div className="flex flex-col gap-6">
          <Link
            to="/media-inspector"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200"
          >
            <Film className="text-2xl mr-2" />
            Media Inspector
          </Link>

          <Link
            to="/social-tool"
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition duration-200"
          >
            <User className="text-2xl mr-2" />
            Social Tool Data
          </Link>

          <Link
            to="/ad-mosaic-manage"
            className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition duration-200"
          >
            <Puzzle className="text-2xl mr-2" /> {/* Puzzle Icon */}
            Ad Mosaic Manage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
