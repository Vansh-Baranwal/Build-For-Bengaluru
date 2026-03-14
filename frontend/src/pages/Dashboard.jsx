import { useState, useEffect } from 'react';
import { AlertCircle, Droplets, Trash2, AlertTriangle, Star, Trophy, Newspaper, MapPin, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import CityNews from '../components/CityNews';
import ValidationWidget from '../components/ValidationWidget';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const StarRating = ({ score }) => {
  const rating = Math.min(5, Math.max(1, Math.ceil(score / 20)));
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your civic complaints and reports</p>
        </div>
        
        {/* Reputation Badge */}
        <div className="bg-white px-6 py-4 rounded-3xl shadow-lg border-2 border-amber-50 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Citizen Reputation</span>
              <StarRating score={user?.reputation_score || 50} />
            </div>
            <p className="text-2xl font-black text-slate-800">{user?.reputation_score || 50} <span className="text-xs font-bold text-gray-400 uppercase tracking-normal">Points</span></p>
          </div>
        </div>
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
                  Expected Completion
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {complaint.deadline ? (
                        <div className="flex flex-col">
                          <span className={`flex items-center gap-1.5 font-bold ${complaint.is_escalated ? 'text-rose-600' : 'text-gray-600'}`}>
                            <Clock className={`w-3 h-3 ${complaint.is_escalated ? 'animate-pulse' : ''}`} />
                            {new Date(complaint.deadline).toLocaleDateString()}
                          </span>
                          {complaint.is_escalated && (
                            <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-0.5">Escalated to Authority</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Calculating SLA...</span>
                      )}
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
