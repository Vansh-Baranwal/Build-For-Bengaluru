import { useState } from 'react';
import { Search, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!complaintId.trim()) {
      toast.error('Please enter a complaint ID');
      return;
    }

    try {
      setLoading(true);
      const data = await api.getComplaintById(complaintId.trim());
      setComplaint(data);
      toast.success('Complaint found');
    } catch (error) {
      toast.error(error.message || 'Complaint not found');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'in_progress', 'resolved'];
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Protocol Tracking</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6 uppercase">
            Check <span className="text-gradient">Status</span>
          </h1>
          <p className="text-slate-500 font-bold max-w-lg mx-auto text-xs uppercase tracking-widest leading-relaxed opacity-70">
            Interface with the city network to monitor the resolution vector of your reported incident.
          </p>
        </motion.div>

        {/* Search Form */}
        <div className="glass-card rounded-[3.5rem] p-10 mb-12 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder="INPUT PROTOCOL ID (UUID)..."
                className="w-full bg-slate-900/5 border-2 border-transparent focus:border-indigo-100 rounded-3xl px-8 py-5 text-xs font-black uppercase tracking-[0.2em] outline-none transition-all placeholder:text-slate-400"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-premium px-12 py-5 text-xs font-black uppercase tracking-[0.3em] min-w-[200px]"
            >
              {loading ? 'Initializing...' : 'Query Matrix'}
            </motion.button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <LoadingSpinner size="lg" text="Syncing with Departmental Database..." />
          </div>
        )}

        {/* Complaint Details */}
        <AnimatePresence>
          {complaint && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[4rem] p-12 md:p-16 space-y-16 border-white/40 shadow-3xl bg-white/40 backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">Incident Identity</span>
                     <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Protocol Details</h2>
                  <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">SYSTEM ID: {complaint.complaint_id}</p>
                </div>
                <div className="scale-125 origin-top-right">
                  <StatusBadge status={complaint.status} />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-2 p-6 bg-slate-900/5 rounded-3xl border border-slate-900/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Categorization</p>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {complaint.category}
                  </p>
                </div>
                <div className="space-y-2 p-6 bg-slate-900/5 rounded-3xl border border-slate-900/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Priority</p>
                  <div className="mt-1">
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <div className="space-y-2 p-6 bg-slate-900/5 rounded-3xl border border-slate-900/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    Coordinate Vector
                  </p>
                  <p className="text-xs font-black text-slate-900 tracking-widest">
                    {complaint.latitude?.toFixed(6)} : {complaint.longitude?.toFixed(6)}
                  </p>
                </div>
                <div className="space-y-2 p-6 bg-slate-900/5 rounded-3xl border border-slate-900/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Entry Timestamp
                  </p>
                  <p className="text-xs font-black text-slate-900">
                    {new Date(complaint.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="pt-16 border-t border-slate-100/50">
                <div className="flex items-center gap-4 mb-12">
                   <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Resolution Lifecycle</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4 px-4">
                  {['pending', 'in_progress', 'resolved'].map((step, index) => {
                    const currentStep = getStatusStep(complaint.status);
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step} className="flex-1 flex flex-col md:flex-row items-center w-full">
                        <div className="flex flex-col items-center flex-1 relative z-10 w-full">
                          <motion.div
                            initial={false}
                            animate={{
                              backgroundColor: isCompleted ? '#4f46e5' : '#ffffff',
                              scale: isCurrent ? 1.2 : 1,
                              boxShadow: isCurrent ? '0 0 25px rgba(79, 70, 229, 0.4)' : 'none'
                            }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all ${
                              isCompleted
                                ? 'border-indigo-600'
                                : 'border-slate-100'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-7 h-7 text-white" />
                            ) : (
                              <span className="text-slate-300 font-black text-sm">{index + 1}</span>
                            )}
                          </motion.div>
                          <p
                            className={`text-[9px] mt-4 font-black uppercase tracking-[0.2em] transition-colors ${
                              isCompleted ? 'text-indigo-600' : 'text-slate-400'
                            }`}
                          >
                            {step.replace('_', ' ')}
                          </p>
                        </div>
                        {index < 2 && (
                          <div className="md:flex-1 w-0.5 md:w-full h-12 md:h-1 bg-slate-100 relative -mx-0.5 mt-[-1rem] md:mt-[-1.5rem]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: index < currentStep ? '100%' : '0%' }}
                              className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                              transition={{ duration: 1, ease: "easeInOut" }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Tip */}
              <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Departmental Protocol</h4>
                    <p className="text-xs font-bold leading-relaxed text-indigo-100 uppercase tracking-tighter max-w-sm">Average resolution for this category is targeted within 4-6 business cycles.</p>
                  </div>
                  <div className="px-8 py-4 bg-white/10 rounded-2xl ring-1 ring-white/20 backdrop-blur-md">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">Efficiency Rating: A+</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[100px] -mr-24 -mt-24"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
