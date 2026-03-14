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

  // Calculate metrics for current department
  const deptComplaints = complaints.filter(c => c.department_group === activeTab);
  const urgentCount = deptComplaints.filter(c => c.issue_type === 'Emergency').length;
  const pendingCount = deptComplaints.filter(c => c.status === 'pending').length;
  const resolvedCount = deptComplaints.filter(c => c.status === 'resolved').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Accessing Official Monitoring System..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Side Navigation - Standard Admin Portal Look */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2.5 rounded-2xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">NAMMAFIX</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Gov Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Departments</p>
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              const isActive = activeTab === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveTab(dept.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-sm">{dept.id}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logged in as</p>
            <p className="text-sm font-bold text-white">Administrator</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Departmental Oversight</h1>
            <p className="text-slate-500 font-medium">Monitoring {activeTab} Operations & Civic Compliance</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchDashboardData}
              className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="h-10 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">John Admin</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Master Official</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-black border-2 border-white shadow-sm font-sans">
                JA
              </div>
            </div>
          </div>
        </header>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Issues</p>
            <p className="text-3xl font-black text-slate-900">{deptComplaints.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Emergency</p>
            <p className="text-3xl font-black text-rose-600">{urgentCount}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Awaiting Action</p>
            <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-emerald-600 p-6 rounded-[2rem] shadow-xl shadow-emerald-100 ring-4 ring-emerald-50">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Resolved Today</p>
            <p className="text-3xl font-black text-white">{resolvedCount}</p>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Records & Compliance</h2>
              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-2xl">
                {ISSUE_FILTERS.map((filter) => {
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`
                        px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                        ${isActive 
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-400 hover:text-slate-600'
                        }
                      `}
                    >
                      {filter.id}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {filteredComplaints.length} entries
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredComplaints.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                  <Clock className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-xl font-black uppercase tracking-widest">No Active Filings</p>
                  <p className="text-sm font-bold">Clear of all {activeFilter !== 'All' ? activeFilter : 'category'} reports</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div 
                    key={complaint.complaint_id}
                    className="group bg-slate-50/50 hover:bg-white rounded-[2.5rem] p-8 border border-transparent hover:border-slate-200 transition-all hover:shadow-2xl hover:shadow-slate-200/50"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <span className={`
                            text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border
                            ${complaint.issue_type === 'Emergency' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                              complaint.issue_type === 'Recurring' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-white text-slate-600 border-slate-200'}
                          `}>
                            {complaint.issue_type}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-400 shadow-sm">
                            CASE #{complaint.complaint_id.slice(0, 6)}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize block">{complaint.category}</h3>
                      </div>

                      <div className="text-right">
                        <span className={`
                          px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest
                          ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-50' : 
                            complaint.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700 shadow-sm shadow-indigo-50' : 
                            'bg-amber-100 text-amber-700 shadow-sm shadow-amber-50'}
                        `}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <div className="mt-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Integrity Score</p>
                          <StarRating score={complaint.reporter_reputation || 50} />
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 font-medium leading-relaxed mb-8">
                      {complaint.description}
                    </p>

                    {complaint.image_url && (
                      <div className="relative h-64 mb-8 rounded-[2rem] overflow-hidden bg-slate-200 border-4 border-white shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                        <img 
                          src={complaint.image_url} 
                          alt="Evidence File" 
                          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <ExternalLink className="w-3 h-3" /> Photographic Evidence
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {complaint.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(complaint.complaint_id, 'in_progress')}
                            disabled={updatingId === complaint.complaint_id}
                            className="bg-indigo-600 hover:bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                          >
                            Assign Task
                          </button>
                        )}
                        {complaint.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusUpdate(complaint.complaint_id, 'resolved')}
                            disabled={updatingId === complaint.complaint_id}
                            className="bg-emerald-600 hover:bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                          >
                            Mark Complete
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
      </main>
    </div>
  );
};

export default GovernmentDashboard;
