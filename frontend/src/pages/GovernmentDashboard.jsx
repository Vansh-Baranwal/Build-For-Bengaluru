import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { Building2, RefreshCw } from 'lucide-react';

const GovernmentDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [trendingData, setTrendingData] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [allComplaints, trending] = await Promise.all([
        api.getAllComplaints(),
        api.getTrendingIssues()
      ]);
      setComplaints(allComplaints);
      setTrendingData(trending);

      if (trending.length > 0) {
        setAlertMessage(
          `High number of ${trending[0].issue_type} complaints detected near ${trending[0].latitude.toFixed(4)}, ${trending[0].longitude.toFixed(4)}.`
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  City Overview
                </h1>
                <p className="text-gray-600 mt-1">
                  High-level insights into city infrastructure and active reports
                </p>
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Civic Alert Banner */}
        {alertMessage && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Civic Alert</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{alertMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Complaints</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {complaints.length}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                Across the city
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">
                {complaints.filter((c) => c.status === 'pending').length}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-yellow-600 flex items-center">
                Review required
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {complaints.filter((c) => c.status === 'in_progress').length}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-blue-600 flex items-center">
                Currently being fixed
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resolved</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-green-600 flex items-center">
                Completed issues
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GovernmentDashboard;
