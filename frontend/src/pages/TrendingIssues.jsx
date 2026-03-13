import { useEffect, useState } from 'react';
import { TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TrendingIssues() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const data = await api.getTrendingIssues();
      setTrending(data);
    } catch (error) {
      console.error('Error fetching trending issues:', error);
      toast.error('Failed to load trending issues');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading trending issues..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-primary-600" />
          Trending Issues
        </h1>
        <p className="text-gray-600 mt-1">Complaint clusters sorted by frequency</p>
      </div>

      {trending.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trending Issues</h3>
          <p className="text-gray-600">There are currently no complaint clusters to display.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Issue Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Complaint Count
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cluster ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trending.map((cluster, index) => (
                  <tr key={cluster.cluster_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                            index === 1 ? 'bg-gray-100 text-gray-800' : 
                            index === 2 ? 'bg-orange-100 text-orange-800' : 
                            'bg-blue-50 text-blue-800'}
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900 capitalize">
                          {cluster.issue_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {cluster.latitude?.toFixed(4)}, {cluster.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        {cluster.complaint_count} complaints
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {cluster.cluster_id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {trending.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Clusters</p>
              <p className="text-2xl font-bold text-gray-900">{trending.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Complaints</p>
              <p className="text-2xl font-bold text-gray-900">
                {trending.reduce((sum, c) => sum + c.complaint_count, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Issue</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {trending[0]?.issue_type || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
