import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Building2, 
  TrafficCone, 
  Trash2, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Repeat,
  TrendingUp,
  MapPin,
  RefreshCw,
  ExternalLink,
  Star
} from 'lucide-react';

const StarRating = ({ score }) => {
  // Map score (default 50) to 1-5 stars
  // <= 20: 1, 21-40: 2, 41-60: 3, 61-80: 4, 81+: 5
  const rating = Math.min(5, Math.max(1, Math.ceil(score / 20)));
  
  return (
    <div className="flex gap-0.5" title={`Reputation Score: ${score}`}>
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
        />
      ))}
    </div>
  );
};

const DEPARTMENTS = [
  { id: 'BBMP', icon: Building2, color: 'blue' },
  { id: 'Traffic Police', icon: TrafficCone, color: 'orange' },
  { id: 'Cleaning Work', icon: Trash2, color: 'emerald' },
  { id: 'Others', icon: Briefcase, color: 'purple' }
];

const ISSUE_FILTERS = [
  { id: 'All', icon: Clock },
  { id: 'Emergency', icon: Zap },
  { id: 'Recurring', icon: Repeat },
  { id: 'Regular Problem', icon: AlertTriangle },
  { id: 'Trends', icon: TrendingUp }
];

const GovernmentDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BBMP');
  const [activeFilter, setActiveFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const allComplaints = await api.getAllComplaints();
      setComplaints(allComplaints || []);
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

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.updateComplaintStatus(id, newStatus);
      toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
      // Update local state
      setComplaints(prev => prev.map(c => 
        c.complaint_id === id ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesDept = c.department_group === activeTab;
    const matchesFilter = activeFilter === 'All' || c.issue_type === activeFilter;
    return matchesDept && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Accessing Government Portal..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                  <Building2 className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Unified Command Center</h1>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live Civic Monitoring
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={fetchDashboardData}
              className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-bold transition-all hover:bg-indigo-100 active:scale-95"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Sync Data
            </button>
          </div>
          
          {/* Department Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mt-8 pb-1">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              const isActive = activeTab === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveTab(dept.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold whitespace-nowrap transition-all duration-300 border-b-2
                    ${isActive 
                      ? `bg-indigo-50 text-indigo-600 border-indigo-600` 
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {dept.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Sub-Filters */}
        <div className="flex flex-wrap gap-2 mb-8 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter px-3 mr-2">Quick Filter:</span>
          {ISSUE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                  ${isActive 
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {filter.id}
              </button>
            );
          })}
        </div>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredComplaints.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No {activeFilter === 'All' ? '' : activeFilter} issues in {activeTab}</p>
              <p className="text-sm">Everything seems to be in order for now.</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div 
                key={complaint.complaint_id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className={`
                      text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md w-fit
                      ${complaint.issue_type === 'Emergency' ? 'bg-rose-100 text-rose-600' : 
                        complaint.issue_type === 'Recurring' ? 'bg-amber-100 text-amber-600' :
                        complaint.issue_type === 'Trends' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-slate-100 text-slate-600'}
                    `}>
                      {complaint.issue_type}
                    </span>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 capitalize">{complaint.category}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-black uppercase
                      ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                        complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        'bg-orange-100 text-orange-700'}
                    `}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Reporter Trust</span>
                      <StarRating score={complaint.reporter_reputation || 50} />
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {complaint.description}
                </p>

                {complaint.image_url && (
                  <div className="relative h-48 mb-6 rounded-2xl overflow-hidden bg-gray-100">
                    <img 
                      src={complaint.image_url} 
                      alt="Evidence" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                    <MapPin className="w-3 h-3" />
                    ID: {complaint.complaint_id.slice(0, 8)}...
                  </div>
                  
                  <div className="flex gap-2">
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.complaint_id, 'in_progress')}
                        disabled={updatingId === complaint.complaint_id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                      >
                        Start Work
                      </button>
                    )}
                    {complaint.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.complaint_id, 'resolved')}
                        disabled={updatingId === complaint.complaint_id}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
