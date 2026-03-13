import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
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
import ComplaintManagement from './pages/ComplaintManagement';
import NewsDashboard from './pages/NewsDashboard';
import IssueAnalytics from './pages/IssueAnalytics';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Routes>
            {/* Authentication Routes - No Sidebar/Navbar */}
            <Route path="/login/citizen" element={<CitizenLogin />} />
            <Route path="/login/government" element={<GovernmentLogin />} />
            <Route path="/login/news" element={<NewsLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Application Routes - Wrapped in MainLayout */}
            <Route element={<MainLayout />}>
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
              
              {/* Protected Role-specific Dashboards */}
              <Route
                path="/government"
                element={
                  <ProtectedRoute requiredRole="government">
                    <GovernmentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/government/complaints"
                element={
                  <ProtectedRoute requiredRole="government">
                    <ComplaintManagement />
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
              <Route
                path="/news/analytics"
                element={
                  <ProtectedRoute requiredRole="news">
                    <IssueAnalytics />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>

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
