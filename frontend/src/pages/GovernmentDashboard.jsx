import { useState, useEffect } from 'react';
import { 
  Building2, 
  Car, 
  Trash2, 
  MoreHorizontal, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search,
  Filter,
  BarChart3,
  Star,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const StarRating = ({ score }) => {
  const rating = Math.min(5, Math.max(1, Math.ceil(score / 20)));
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
        />
      ))}
    </div>
  );
};

const GovernmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('BBMP');
  const [activeFilter, setActiveFilter] = useState('All');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await api.getAllComplaints();
        setComplaints(data || []);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (id, newStatus, deadline = null) => {
    setUpdatingId(id);
    try {
      await api.updateComplaintStatus(id, newStatus, deadline);
      toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
      setComplaints(prev => prev.map(c => 
        c.complaint_id === id ? { ...c, status: newStatus, deadline: deadline || c.deadline } : c
      ));
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const departments = [
    { id: 'BBMP', name: 'BBMP', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Traffic Police', name: 'Traffic Police', icon: Car, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'Cleaning Work', name: 'Cleaning Work', icon: Trash2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Others', name: 'Others', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  const filters = ['All', 'Emergency', 'Regular Problem', 'Recurring', 'Trends'];

  const filteredComplaints = complaints.filter(c => {
    const tabMatch = c.department_group === activeTab;
    const filterMatch = activeFilter === 'All' || c.issue_type === activeFilter;
    return tabMatch && filterMatch;
  });

  const stats = {
    total: filteredComplaints.length,
    urgent: filteredComplaints.filter(c => c.priority === 'high' || c.issue_type === 'Emergency').length,
    active: filteredComplaints.filter(c => c.status === 'in_progress').length,
    resolved: filteredComplaints.filter(c => c.status === 'resolved').length
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Visual only for branding */}
      <motion.aside 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col items-center lg:items-start py-8 transition-all duration-300 z-10"
      >
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center animate-float">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="hidden lg:block text-xl font-black tracking-tighter">NAMMA<span className="text-indigo-400">FIX</span></span>
        </div>
        
        <nav className="flex-1 w-full space-y-2 px-3">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === dept.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <dept.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest text-left ml-2">{dept.name}</span>
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-transparent relative">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Administrative Portal</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                Unified <span className="text-gradient">Command Center</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium">Monitoring civic health and departmental response times.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-white/50 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search incidents..."
                  className="bg-slate-100 border-none rounded-2xl pl-11 pr-6 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                />
              </div>
              <button className="bg-slate-900 text-white p-3 rounded-2xl hover:scale-110 transition-transform">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { label: 'Total Incidents', value: stats.total, icon: BarChart3, color: 'indigo' },
              { label: 'SLA Breaches', value: stats.urgent, icon: AlertTriangle, color: 'rose' },
              { label: 'Active Tasks', value: stats.active, icon: TrendingUp, color: 'blue' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'emerald' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="stat-card"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${stat.color}-50`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <span className={`text-${stat.color}-600 bg-${stat.color}-100/50 px-2 py-1 rounded-lg text-[10px] font-black`}>+12%</span>
                </div>
                <p className="text-3xl font-black text-slate-800 leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Filters Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-48 space-y-6"
            >
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Issue Priority</h3>
                <div className="space-y-1">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                        activeFilter === f 
                          ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Complaints List */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching Intelligence...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                  >
                    {filteredComplaints.length === 0 ? (
                      <div className="text-center py-20 bg-white/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No active incidents found in this sector.</p>
                      </div>
                    ) : (
                      filteredComplaints.map((complaint) => (
                        <motion.div
                          key={complaint.complaint_id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className={`group glass-card rounded-[2rem] p-8 transition-all duration-500 hover:border-indigo-200 ${
                            complaint.is_escalated ? 'ring-2 ring-rose-500/20' : ''
                          }`}
                        >
                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-56 h-44 rounded-2xl overflow-hidden relative shadow-inner">
                              <img 
                                src={complaint.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800'} 
                                alt="Incident Evidence" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute top-3 left-3 flex gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                                  complaint.priority === 'high' || complaint.issue_type === 'Emergency'
                                    ? 'bg-rose-500/90 text-white' 
                                    : 'bg-white/90 text-slate-900'
                                }`}>
                                  {complaint.issue_type}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black text-indigo-600 tracking-tighter uppercase tracking-widest">Case #{complaint.complaint_id.slice(0, 8)}</span>
                                    <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">Reporter Level:</span>
                                      <StarRating score={complaint.reporter_reputation || 50} />
                                    </div>
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{complaint.category}</h3>
                                  <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4 leading-relaxed">{complaint.description}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-slate-400 block mb-1">RECEIVED</span>
                                  <span className="text-xs font-bold text-slate-900">{new Date(complaint.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                      {activeTab === 'BBMP' ? <Building2 className="w-4 h-4 text-slate-600" /> : 
                                       activeTab === 'Traffic Police' ? <Car className="w-4 h-4 text-slate-600" /> : 
                                       <Trash2 className="w-4 h-4 text-slate-600" />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">{activeTab}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      complaint.status === 'resolved' ? 'bg-emerald-500' :
                                      complaint.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{complaint.status.replace('_', ' ')}</span>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  {complaint.status === 'pending' && (
                                    <div className="flex items-center gap-2">
                                      <select 
                                        id={`deadline-${complaint.complaint_id}`}
                                        className="bg-white border-2 border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-3.5 rounded-2xl outline-none focus:border-indigo-300 transition-all cursor-pointer"
                                      >
                                        <option value="1">1 Minute</option>
                                        <option value="2">2 Minutes</option>
                                        <option value="5">5 Minutes</option>
                                      </select>
                                      <button
                                        onClick={() => {
                                          const mins = document.getElementById(`deadline-${complaint.complaint_id}`).value;
                                          const deadline = new Date();
                                          deadline.setMinutes(deadline.getMinutes() + parseInt(mins));
                                          handleStatusUpdate(complaint.complaint_id, 'in_progress', deadline.toISOString());
                                        }}
                                        disabled={updatingId === complaint.complaint_id}
                                        className="btn-premium flex items-center gap-2"
                                      >
                                        Assign Officer
                                      </button>
                                    </div>
                                  )}
                                  {complaint.status === 'in_progress' && (
                                    <button
                                      onClick={() => handleStatusUpdate(complaint.complaint_id, 'resolved')}
                                      disabled={updatingId === complaint.complaint_id}
                                      className="bg-emerald-600 hover:bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                                    >
                                      Verify & Resolve
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {complaint.deadline && complaint.status !== 'resolved' && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`mt-6 p-5 rounded-2xl flex items-center justify-between overflow-hidden ${
                                      complaint.is_escalated ? 'bg-rose-50 border border-rose-100' : 'bg-slate-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`p-2 rounded-xl ${complaint.is_escalated ? 'bg-rose-100' : 'bg-slate-800'}`}>
                                        <Clock className={`w-4 h-4 ${complaint.is_escalated ? 'text-rose-600 animate-pulse' : 'text-indigo-400'}`} />
                                      </div>
                                      <div>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${complaint.is_escalated ? 'text-rose-500' : 'text-slate-400'}`}>
                                          {complaint.is_escalated ? 'SLA Critical Breach - Escalated' : 'Target Resolution Window'}
                                        </p>
                                        <p className={`text-sm font-black ${complaint.is_escalated ? 'text-rose-700' : 'text-white'}`}>
                                          {new Date(complaint.deadline).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    {complaint.is_escalated && (
                                      <div className="bg-rose-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-200">
                                        Priority Alert
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GovernmentDashboard;
