import { Menu, Activity } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center ml-2 lg:ml-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">NammaFix</h1>
                <p className="text-xs text-gray-500">Civic Intelligence Platform</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-sm font-medium text-green-700">City Monitoring Active</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
