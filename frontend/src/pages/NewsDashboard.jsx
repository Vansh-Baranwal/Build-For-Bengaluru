import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CityNews from '../components/CityNews';
import { Newspaper, TrendingUp, MapPin } from 'lucide-react';

const NewsDashboard = () => {
  const [trendingIssues, setTrendingIssues] = useState([]);
  const [news, setNews] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [trending, heatmap, newsData] = await Promise.all([
          api.getTrendingIssues(),
          api.getHeatmapData(),
          api.getCityNews()
        ]);
        setTrendingIssues(trending);
        setHeatmapData(heatmap);
        setNews(newsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate category statistics
  const categoryStats = heatmapData.reduce((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

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
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-3 rounded-lg">
              <Newspaper className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                City Trends
              </h1>
              <p className="text-gray-600 mt-1">
                Analyze top civic complaint trends and patterns
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recent Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {heatmapData.length}
                </p>
              </div>
              <MapPin className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trending Hotspots</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {trendingIssues.length}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500" />
            </div>
          </div>
        </div>

        {/* Trending Issues List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Trending Issues
          </h2>
          {trendingIssues.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No trending issues at the moment
            </p>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {trendingIssues.map((issue, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {issue.issue_type ? issue.issue_type : issue.category || 'Unknown Category'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Location: {issue.latitude?.toFixed(4) || 'N/A'}, {issue.longitude?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {issue.complaint_count || issue.count || 0} complaints in cluster
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live City News */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Newspaper className="h-5 w-5 mr-2 text-purple-600" />
            Live Bengaluru Civic News
          </h2>
          <CityNews news={news} />
        </div>

      </div>
    </div>
  );
};

export default NewsDashboard;
