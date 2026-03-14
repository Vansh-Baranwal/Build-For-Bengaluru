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
    <div className="flex min-h-full w-full">
      {/* Sidebar - Visual only for branding */}
      <motion.aside 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-20 lg:w-72 glass-panel lg:my-0 my-6 lg:rounded-none rounded-[3rem] border-white/5 text-white flex flex-col items-center lg:items-start py-10 transition-all duration-300 z-10 shadow-3xl"
      >
        <div className="px-8 mb-16 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-[1.25rem] flex items-center justify-center animate-float shadow-xl">
            <Building2 className="w-6 h-6 text-slate-900" />
          </div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Government</p>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">NAMMA<span className="text-indigo-400">FIX</span></span>
          </div>
        </div>
        
        <nav className="flex-1 w-full space-y-3 px-4">
          <p className="hidden lg:block px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Operations Sectors</p>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={`w-full flex items-center gap-4 px-5 py-5 rounded-[1.5rem] transition-all duration-500 group ${
                activeTab === dept.id 
                  ? 'bg-white/10 text-white border border-white/5 shadow-2xl shadow-indigo-500/10' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <dept.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${activeTab === dept.id ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className="hidden lg:block text-[11px] font-black uppercase tracking-widest text-left">{dept.name}</span>
              {activeTab === dept.id && (
                <motion.div layoutId="activeDept" className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-6 w-full">
           <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">System Status</p>
              </div>
              <p className="text-[10px] font-bold text-white uppercase tracking-tighter">All Nodes Operational</p>
           </div>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-x-hidden bg-transparent relative custom-scrollbar">
        <div className="w-full px-4 lg:px-6 py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-16"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-indigo-500 rounded-full">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Security Level Alpha</span>
                </div>
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node: BLR-CENTRAL-01</span>
              </div>
              <h1 className="mb-4">
                Unified <span className="text-gradient">Command</span>
              </h1>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60">Bengaluru Civic Response & Intelligence Matrix</p>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Scan incident IDs..."
                  className="bg-white/5 border border-white/5 rounded-[1.75rem] pl-14 pr-8 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 w-full transition-all outline-none placeholder:text-slate-600 text-white"
                />
              </div>
              <button className="bg-white text-slate-900 w-14 h-14 rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {[
              { label: 'Incident Vector', value: stats.total, icon: BarChart3, color: 'indigo' },
              { label: 'SLA Breaches', value: stats.urgent, icon: AlertTriangle, color: 'rose' },
              { label: 'Active Tasks', value: stats.active, icon: TrendingUp, color: 'blue' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'emerald' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner`}>
                    <stat.icon className={`w-6 h-6 text-white`} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      stat.color === 'rose' ? 'text-rose-400' : 
                      stat.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'}`}>+12.4%</span>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">v/s Last 24h</p>
                  </div>
                </div>
                <p className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Filters Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-60 space-y-8"
            >
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">Priority Filter</h3>
                <div className="space-y-2">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`w-full text-left px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group ${
                        activeFilter === f 
                          ? 'bg-white/10 text-white border border-white/5 shadow-2xl shadow-indigo-500/10' 
                          : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="relative z-10">{f}</span>
                      {activeFilter === f && (
                        <motion.div layoutId="activeFilterBlob" className="absolute left-0 top-0 w-1 h-full bg-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">Intelligence Note</h4>
                  <p className="text-xs font-black leading-relaxed text-slate-600 uppercase tracking-tighter">Emergency reports require response initiation within 300 seconds as per Protocol 7.</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
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
                    className="flex flex-col items-center justify-center py-32"
                  >
                    <div className="w-16 h-16 border-[6px] border-slate-900/5 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Data Streams...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-8"
                  >
                    {filteredComplaints.length === 0 ? (
                      <div className="text-center py-32 glass-card rounded-[3.5rem] border-2 border-dashed border-slate-200/50">
                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zero incidents detected in this sector.</p>
                      </div>
                    ) : (
                      filteredComplaints.map((complaint) => (
                        <motion.div
                          key={complaint.complaint_id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.01, x: 8 }}
                          className={`group glass-card rounded-[3.5rem] p-10 transition-all duration-700 hover:border-white/20 relative border-white/5 ${
                            complaint.is_escalated ? 'ring-4 ring-rose-500/20' : ''
                          }`}
                        >
                          <div className="flex flex-col xl:flex-row gap-10">
                            <div className="w-full xl:w-72 h-56 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                              <img 
                                src={complaint.image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800'} 
                                alt="Incident Evidence" 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-[1500ms] group-hover:scale-110"
                              />
                              <div className="absolute top-4 left-4 flex gap-2">
                                <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 ${
                                  complaint.priority === 'high' || complaint.issue_type === 'Emergency'
                                    ? 'bg-rose-500 text-white' 
                                    : 'bg-slate-900/90 text-white shadow-xl'
                                }`}>
                                  {complaint.issue_type}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/5">Case ID: {complaint.complaint_id.slice(0, 8)}</span>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reporter Integrity</span>
                                      <StarRating score={complaint.reporter_reputation || 50} />
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Entry Timestamp</p>
                                    <p className="text-xs font-black text-white">{new Date(complaint.created_at).toLocaleString()}</p>
                                  </div>
                                </div>

                                <h3 className="text-3xl font-black text-white tracking-tight uppercase">{complaint.category}</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">{complaint.description}</p>
                              </div>

                              <div className="pt-8 mt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                                <div className="flex items-center gap-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-white flex items-center justify-center shadow-lg">
                                      {activeTab === 'BBMP' ? <Building2 className="w-5 h-5 text-slate-900" /> : 
                                       activeTab === 'Traffic Police' ? <Car className="w-5 h-5 text-slate-900" /> : 
                                       <Trash2 className="w-5 h-5 text-slate-900" />}
                                    </div>
                                    <div className="hidden sm:block">
                                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Assigned Sector</p>
                                       <span className="text-[10px] font-black uppercase tracking-wider text-white">{activeTab}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 py-2 px-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                                      complaint.status === 'resolved' ? 'bg-emerald-500' :
                                      complaint.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{complaint.status.replace('_', ' ')}</span>
                                  </div>
                                </div>

                                <div className="flex gap-4">
                                  {complaint.status === 'pending' && (
                                    <div className="flex items-center gap-4">
                                      <div className="relative group">
                                         <select 
                                            id={`deadline-${complaint.complaint_id}`}
                                            className="bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-widest pl-6 pr-12 py-4 rounded-[1.5rem] outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none min-w-[160px]"
                                          >
                                            <option value="1" className="bg-slate-900">1 MIN SLA</option>
                                            <option value="2" className="bg-slate-900">2 MIN SLA</option>
                                            <option value="5" className="bg-slate-900">5 MIN SLA</option>
                                          </select>
                                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-indigo-500 transition-colors">
                                            <Clock className="w-4 h-4" />
                                          </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const mins = document.getElementById(`deadline-${complaint.complaint_id}`).value;
                                          const deadline = new Date();
                                          deadline.setMinutes(deadline.getMinutes() + parseInt(mins));
                                          handleStatusUpdate(complaint.complaint_id, 'in_progress', deadline.toISOString());
                                        }}
                                        disabled={updatingId === complaint.complaint_id}
                                        className="bg-white text-slate-900 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                      >
                                        Deploy Unit
                                      </button>
                                    </div>
                                  )}
                                  {complaint.status === 'in_progress' && (
                                    <button
                                      onClick={() => handleStatusUpdate(complaint.complaint_id, 'resolved')}
                                      disabled={updatingId === complaint.complaint_id}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                      Finalize Resolution
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {complaint.deadline && complaint.status !== 'resolved' && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`mt-8 p-6 rounded-[2rem] flex items-center justify-between overflow-hidden relative ${
                                      complaint.is_escalated ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/5 border border-white/5 shadow-2xl'
                                    }`}
                                  >
                                    <div className="flex items-center gap-6 relative z-10">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${complaint.is_escalated ? 'bg-rose-500/20 shadow-inner' : 'bg-white/10'}`}>
                                        <Clock className={`w-6 h-6 ${complaint.is_escalated ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
                                      </div>
                                      <div>
                                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${complaint.is_escalated ? 'text-rose-400' : 'text-slate-500'}`}>
                                          {complaint.is_escalated ? 'SLA Critical Threshold Breached' : 'Active Mission Window'}
                                        </p>
                                        <p className={`text-lg font-black tracking-tight text-white`}>
                                          {new Date(complaint.deadline).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    </div>
                                    {complaint.is_escalated && (
                                      <div className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 relative z-10 animate-pulse">
                                        Priority Alpha
                                      </div>
                                    )}
                                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] -mr-16 -mb-16"></div>
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
