import React, { useState } from 'react';
import { CheckCircle, XCircle, MapPin, AlertCircle, Info, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function ValidationWidget({ complaint, onActionComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  const handleVote = async (isGenuine) => {
    setIsSubmitting(true);
    try {
      await api.verifyComplaint(complaint.complaint_id, isGenuine);
      toast.success(isGenuine ? 'Vouched for Authenticity' : 'Reported as Inaccurate', {
        style: {
          background: isGenuine ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${isGenuine ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
          color: isGenuine ? '#10b981' : '#f43f5e',
        }
      });
      setIsResolved(true);
      setTimeout(() => onActionComplete(), 2000);
    } catch (error) {
      toast.error('Sync failure: Could not transmit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!complaint) return null;

  return (
    <AnimatePresence>
      {!isResolved && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group border-white/5"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Community Safety Check</h3>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Verification Protocol Active</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-400/50 animate-pulse" />
          </div>
          
          <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/5 relative group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                Recently Logged: {(complaint.distance_meters / 1000).toFixed(1)}km from Position
              </span>
            </div>
            
            <p className="text-white text-sm font-medium leading-relaxed mb-4 line-clamp-2 italic opacity-80 group-hover:opacity-100 transition-opacity">
              "{complaint.description}"
            </p>
            
            <div className="flex items-center gap-3">
              <span className="bg-slate-900 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                {complaint.category}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${
                complaint.priority === 'high' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {complaint.priority} Priority Signal
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-slate-400 mb-2">
              Confirm incident authenticity?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(true)}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all glass-button"
              >
                <CheckCircle className="w-4 h-4" />
                Genuine
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(false)}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all glass-button"
              >
                <XCircle className="w-4 h-4" />
                False Report
              </motion.button>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">
            <Info className="w-3 h-3 opacity-30" />
            Vouches accelerate city response. False logs yield reputation penalties.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
