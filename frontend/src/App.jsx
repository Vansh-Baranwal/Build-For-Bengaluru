import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import TrackComplaint from './pages/TrackComplaint';
import CityMap from './pages/CityMap';
import TrendingIssues from './pages/TrendingIssues';
import CitizenLogin from './pages/CitizenLogin';
import GovernmentLogin from './pages/GovernmentLogin';
import NewsLogin from './pages/NewsLogin';
import Register from './pages/Register';
import GovernmentDashboard from './pages/GovernmentDashboard';
import NewsDashboard from './pages/NewsDashboard';
import Unauthorized from './pages/Unauthorized';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="flex-1 overflow-auto">
              <Routes>
                {/* Public / Landing Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
                <Route path="/track" element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><CityMap /></ProtectedRoute>} />
                <Route path="/trending" element={<ProtectedRoute><TrendingIssues /></ProtectedRoute>} />
                
                {/* Authentication Routes - Three Separate Login Pages */}
                <Route path="/login/citizen" element={<CitizenLogin />} />
                <Route path="/login/government" element={<GovernmentLogin />} />
                <Route path="/login/news" element={<NewsLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected Routes */}
                <Route
                  path="/government"
                  element={
                    <ProtectedRoute requiredRole="government">
                      <GovernmentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/news"
                  element={
                    <ProtectedRoute requiredRole="news">
                      <NewsDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
