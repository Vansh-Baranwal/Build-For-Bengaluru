import { useEffect, useState } from 'react';
import { AlertCircle, Droplets, Trash2, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [heatmap, trending] = await Promise.all([
        api.getHeatmapData(),
        api.getTrendingIssues(),
      ]);
      
      setHeatmapData(heatmap);
      setTrendingData(trending);

      // Set alert for top trending issue
      if (trending.length > 0) {
        const top = trending[0];
        setAlertMessage(
          `High number of ${top.issue_type} complaints detected near ${top.latitude?.toFixed(4)}, ${top.longitude?.toFixed(4)} area. ${top.complaint_count} complaints reported.`
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  // Calculate statistics
  const totalComplaints = heatmapData.length;
  const highPriorityCount = heatmapData.filter(c => c.priority === 'high').length;
  const floodingCount = heatmapData.filter(c => c.category === 'flooding').length;
  const garbageCount = heatmapData.filter(c => c.category === 'garbage').length;

  // Demo clusters if no trending data
  const displayClusters = trendingData.length > 0 ? trendingData : [
    { cluster_id: 'demo-1', issue_type: 'pothole', complaint_count: 12, latitude: 12.9716, longitude: 77.5946 },
    { cluster_id: 'demo-2', issue_type: 'garbage', complaint_count: 8, latitude: 12.9352, longitude: 77.6245 },
    { cluster_id: 'demo-3', issue_type: 'streetlight failure', complaint_count: 5, latitude: 12.9698, longitude: 77.7499 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">City Command Center</h1>
        <p className="text-gray-600 mt-1">Real-time civic infrastructure monitoring</p>
      </div>

      {alertMessage && <AlertBanner message={alertMessage} />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Complaints"
          value={totalComplaints}
          icon={AlertCircle}
          color="blue"
          trend="All active reports"
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          icon={AlertTriangle}
          color="red"
          trend="Requires immediate attention"
        />
        <StatCard
          title="Flooding Reports"
          value={floodingCount}
          icon={Droplets}
          color="purple"
          trend="Water-related issues"
        />
        <StatCard
          title="Garbage Issues"
          value={garbageCount}
          icon={Trash2}
          color="orange"
          trend="Waste management"
        />
      </div>

      {/* City Issue Hotspots */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">City Issue Hotspots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayClusters.map((cluster) => (
            <div
              key={cluster.cluster_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {cluster.issue_type}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {cluster.latitude?.toFixed(4)}, {cluster.longitude?.toFixed(4)}
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {cluster.complaint_count}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {cluster.complaint_count} complaints reported
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
