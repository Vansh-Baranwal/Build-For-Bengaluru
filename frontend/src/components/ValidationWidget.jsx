import React, { useState } from 'react';
import { CheckCircle, XCircle, MapPin, AlertCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function ValidationWidget({ complaint, onActionComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (isGenuine) => {
    setIsSubmitting(true);
    try {
      await api.verifyComplaint(complaint.complaint_id, isGenuine);
      toast.success(isGenuine ? 'Voted as Genuine!' : 'Voted as False Report');
      onActionComplete();
    } catch (error) {
      toast.error('Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!complaint) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-blue-50 p-6 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded-full">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Community Safety Check</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
        <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-semibold">Reported Nearby</p>
        <p className="text-gray-800 font-medium mb-3">"{complaint.description}"</p>
        
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
            <MapPin className="w-3.h-3" />
            {(complaint.distance_meters / 1000).toFixed(1)} km away
          </span>
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
            {complaint.category}
          </span>
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-700 mb-4">
        Is this problem real or are you also facing this issue?
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          Yes, Genuine
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <XCircle className="w-5 h-5" />
          No, False
        </button>
      </div>
      
      <p className="mt-4 text-[10px] text-center text-gray-400 uppercase tracking-tighter">
        Verified reports are prioritized. False reports are automatically closed.
      </p>
    </div>
  );
}
