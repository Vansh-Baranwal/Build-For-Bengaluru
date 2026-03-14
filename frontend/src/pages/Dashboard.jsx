import { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Trophy,
  Filter,
  BarChart3,
  Calendar,
  Star,
  Map as MapIcon,
  Navigation,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    reputation: 85 // Mock reputation
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const data = await api.getMyComplaints();
        setComplaints(data || []);
        
        // Calculate summary
        const total = data.length;
        const active = data.filter(c => c.status !== 'resolved').length;
        const resolved = data.filter(c => c.status === 'resolved').length;
        setSummary(prev => ({ ...prev, total, active, resolved }));
      } catch (error) {
        toast.error('Failed to load your complaints');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-20">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse-soft"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse-soft"></div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Citizen Intelligence Hub</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
              Welcome Back, <span className="text-gradient">Citizen</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-md">Your active contribution to Bengaluru's infrastructure monitoring system.</p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-premium flex items-center gap-3 pr-8 pl-6 h-16 group shadow-2xl shadow-indigo-200"
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Report Infrastructure Issue</span>
          </motion.button>
        </motion.div>

        {/* Executive Summary Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
        >
          {[
            { label: 'Reported Cases', value: summary.total, icon: BarChart3, color: 'indigo' },
            { label: 'In Progress', value: summary.active, icon: MapIcon, color: 'blue' },
            { label: 'Impact Made', value: summary.resolved, icon: Trophy, color: 'emerald' },
            { label: 'Citizen Score', value: `${summary.reputation}/100`, icon: Star, color: 'amber' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="stat-card group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-${stat.color}-50 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all duration-500`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.color === 'amber' && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />)}
                  </div>
                )}
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tighter mb-1">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Recent Activity Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Ledger</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors border border-slate-100 shadow-sm">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key="loading-citizen"
                  className="space-y-4"
                >
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/50 backdrop-blur-sm rounded-3xl animate-pulse border border-slate-100"></div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  key="list-citizen"
                  className="space-y-6"
                >
                  {complaints.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-[3rem] border-2 border-dashed border-slate-200">
                      <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-float" />
                      <p className="text-slate-500 font-bold mb-6">No reports filed yet. Start by reporting an issue above.</p>
                    </div>
                  ) : (
                    complaints.map((complaint) => (
                      <motion.div
                        key={complaint.complaint_id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="group glass-card rounded-[2.5rem] p-8 transition-all duration-500 hover:border-indigo-100 relative overflow-hidden"
                      >
                        {/* Status Glow Overlay */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30 ${
                          complaint.status === 'resolved' ? 'bg-emerald-400' :
                          complaint.status === 'in_progress' ? 'bg-blue-400' : 'bg-amber-400'
                        }`}></div>

                        <div className="flex flex-col md:flex-row gap-8 relative z-10">
                          {/* Image Evidence */}
                          <div className="w-full md:w-56 h-40 rounded-[2rem] overflow-hidden shadow-2xl group-hover:shadow-indigo-100/50 transition-all duration-700">
                            <img 
                              src={complaint.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800'} 
                              alt="Issue evidence" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full text-slate-500">Case #{complaint.complaint_id.slice(0, 8)}</span>
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {complaint.status === 'resolved' ? <CheckCircle2 className="w-3 h-3" /> : 
                                 complaint.status === 'in_progress' ? <Navigation className="w-3 h-3 animate-pulse" /> : 
                                 <Clock className="w-3 h-3" />}
                                {complaint.status.replace('_', ' ')}
                              </div>
                              {complaint.is_escalated && (
                                <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-rose-100">Escalated</span>
                              )}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{complaint.category}</h3>
                            <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-6 leading-relaxed uppercase tracking-tighter">{complaint.description}</p>

                            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100/50">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(complaint.created_at).toLocaleDateString()}</span>
                              </div>
                              {complaint.deadline && complaint.status !== 'resolved' && (
                                <div className={`flex items-center gap-2 ${complaint.is_escalated ? 'text-rose-600' : 'text-slate-600 font-bold'}`}>
                                  <Clock className={`w-3.5 h-3.5 ${complaint.is_escalated ? 'animate-spin' : ''}`} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Expected: {new Date(complaint.deadline).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Stats sidebar for desktop */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:w-80 space-y-8"
          >
            {/* Reputation Widget */}
            <div className="glass-card rounded-[3rem] p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-shimmer"></div>
              <div className="mb-6 relative">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-50/50 group-hover:scale-110 transition-transform duration-500">
                  <Star className="w-12 h-12 text-indigo-600 fill-indigo-600 animate-pulse-soft" />
                </div>
                <div className="absolute top-0 right-1/4 bg-white shadow-lg w-10 h-10 rounded-2xl flex items-center justify-center animate-float">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reputation Status</h4>
              <p className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Gold Level</p>
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-indigo-600 h-full rounded-full shadow-lg shadow-indigo-200"
                ></motion.div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">85/100 XP</p>
            </div>

            {/* Validation Widget */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-3xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest">Village Validation</h4>
                </div>
                <p className="text-indigo-200 text-xs font-bold leading-relaxed mb-6">Can you verify a pothole reported 200m away near <span className="text-white">Central Market</span>?</p>
                <button className="w-full bg-indigo-500 hover:bg-white hover:text-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40 active:scale-95">
                  Confirm Incident
                </button>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mb-16 -mr-16"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
