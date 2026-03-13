import { useEffect, useState } from 'react';
import { AlertCircle, Droplets, Trash2, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import CityNews from '../components/CityNews';
import ValidationWidget from '../components/ValidationWidget';
import { api } from '../services/api';
import { Newspaper, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedId, setVotedId] = useState(null); // Track locally to remove from list immediately after vote

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsData, newsData] = await Promise.all([
        api.getMyComplaints(),
        api.getCityNews()
      ]);
      setComplaints(complaintsData || []);
      setNews(newsData || []);
      
      // Also check for nearby tasks
      const nearby = await api.getNearbyComplaints();
      setNearbyComplaints(nearby || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Location tracking effect
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.updateLocation(latitude, longitude);
            // After updating location, fetch nearby tasks again for better accuracy
            const nearby = await api.getNearbyComplaints();
            setNearbyComplaints(nearby || []);
          } catch (err) {
            console.error('Error updating user location:', err);
          }
        },
        (error) => {
          console.warn("Location access denied or unavailable:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  // Calculate statistics
  const totalReports = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personal Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your civic complaints and reports</p>
      </div>

      {/* Community Validation Section */}
      {nearbyComplaints.length > 0 && (
        <div className="flex flex-col items-center">
          <ValidationWidget 
            complaint={nearbyComplaints[0]} 
            onActionComplete={() => {
              setNearbyComplaints(prev => prev.slice(1));
            }}
          />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Your Complaints"
          value={totalReports}
          icon={AlertCircle}
          color="blue"
          trend="Total submitted"
        />
        <StatCard
          title="Resolved Issues"
          value={resolvedCount}
          icon={Droplets}
          color="green"
          trend="Successfully addressed"
        />
        <StatCard
          title="Pending Issues"
          value={pendingCount + inProgressCount}
          icon={AlertTriangle}
          color="orange"
          trend="Awaiting resolution"
        />
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Recent Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    You haven't submitted any complaints yet.
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint.complaint_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {complaint.complaint_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {complaint.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* City News Section */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-6">
          <Newspaper className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">City News & Trends</h2>
        </div>
        <CityNews news={news} />
      </div>
    </div>
  );
}
