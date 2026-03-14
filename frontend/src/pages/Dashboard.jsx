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
  Sparkles,
  MessageSquare,
  X
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
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  const handleFeedbackSubmit = async (id, rating, comments) => {
    await api.submitFeedback(id, rating, comments);
    // Update local state to show feedback is submitted
    setComplaints(prev => prev.map(c => 
      c.complaint_id === id ? { ...c, feedback_rating: rating, feedback_comments: comments } : c
    ));
    setSummary(prev => ({ ...prev, reputation: Math.min(100, prev.reputation + 2) }));
  };

  const FeedbackModal = ({ complaint, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (rating === 0) {
        toast.error('Please select a rating');
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit(complaint.complaint_id, rating, comments);
        toast.success('Thank you for your feedback!');
        onClose();
      } catch (error) {
        toast.error('Failed to submit feedback');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-slate-900 rounded-[3rem] p-12 max-w-lg w-full shadow-2xl relative overflow-hidden border border-white/5"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Citizen Feedback Protocol</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-4 uppercase">How was the resolution?</h2>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-tighter">Regarding: {complaint.category}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-transform active:scale-90"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      className={`w-12 h-12 ${
                        star <= (hover || rating) 
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110' 
                          : 'text-slate-700'
                      } transition-all duration-300`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : 'Select experience level'}
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Additional Intelligence</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us about the quality of the work done..."
                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500 rounded-[2rem] px-8 py-6 text-sm font-medium outline-none transition-all placeholder:text-slate-600 min-h-[140px] text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-premium py-6 flex items-center justify-center gap-4 text-sm font-black uppercase tracking-[0.2em] text-slate-900"
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Experiences'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="w-full">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Citizen Intelligence Matrix</span>
            </div>
            <h1 className="mb-6">
              Welcome Back, <span className="text-gradient">Citizen</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md uppercase text-xs tracking-tighter leading-relaxed">Monitoring and enhancing Bengaluru's infrastructure through collective intelligence.</p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-premium flex items-center gap-4 h-18 group"
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-700">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">New Operational Report</span>
          </motion.button>
        </motion.div>

        {/* Executive Summary Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20"
        >
          {[
            { label: 'Active Logs', value: summary.total, icon: BarChart3, color: 'indigo' },
            { label: 'Under Monitoring', value: summary.active, icon: Navigation, color: 'blue' },
            { label: 'Validated Success', value: summary.resolved, icon: Trophy, color: 'emerald' },
            { label: 'Engagement Score', value: `${summary.reputation}/100`, icon: Star, color: 'amber' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="stat-card"
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-5 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                {stat.color === 'amber' && <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
              </div>
              <p className="text-4xl font-black text-white tracking-tighter mb-2">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Intelligence Ledger</h2>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 glass-card rounded-[3rem] animate-pulse"></div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-8"
                >
                  {complaints.map((complaint) => (
                    <motion.div
                      key={complaint.complaint_id}
                      variants={itemVariants}
                      className="group glass-card rounded-[3rem] p-10 transition-all duration-700 hover:border-white/20 relative overflow-hidden"
                    >
                      <div className="flex flex-col gap-6 relative z-10 w-full">

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-4 py-1.5 rounded-full border border-white/5">ID: {complaint.complaint_id.slice(0, 8)}</span>
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              complaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              complaint.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {complaint.status.replace('_', ' ')}
                            </div>
                          </div>

                          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{complaint.category}</h3>
                          <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 uppercase tracking-tighter line-clamp-2">{complaint.description}</p>

                          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{new Date(complaint.created_at).toLocaleDateString()}</span>
                            </div>
                            {complaint.status === 'resolved' && (
                              <div className="flex justify-end">
                                {complaint.feedback_rating ? (
                                  <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span className="text-[10px] font-black text-amber-400 uppercase">{complaint.feedback_rating}/5</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedComplaint(complaint); setShowFeedbackModal(true); }}
                                    className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors px-2"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Provide Feedback
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div className="hidden lg:block lg:w-96 space-y-10">
            <div className="glass-card rounded-[3.5rem] p-12 text-center group border-white/5">
              <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Star className="w-14 h-14 text-indigo-500 fill-indigo-500 animate-pulse-soft" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Engagement Analytics</p>
              <h4 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">Elite Rank</h4>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mb-4 border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></motion.div>
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right">Top 5% Contributor</p>
            </div>
            
            <div className="bg-white rounded-[3.5rem] p-12 text-slate-900 relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">Critical Assignment</h4>
                  <p className="text-2xl font-black mb-10 leading-[1.1] uppercase italic tracking-tighter">Validate infrastructure breach at <span className="text-indigo-600">Whitefield Sector 5</span></p>
                  <button className="w-full bg-slate-900 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl">
                    Accept Protocol
                  </button>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                 <Navigation className="w-32 h-32" />
               </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {showFeedbackModal && selectedComplaint && (
          <FeedbackModal 
            complaint={selectedComplaint} 
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
