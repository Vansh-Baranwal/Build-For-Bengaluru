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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Track Complaint</h1>
        <p className="text-gray-600 mt-1">Check the status of your reported issue</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder="Enter Complaint ID (UUID)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner text="Searching for complaint..." />}

      {/* Complaint Details */}
      {complaint && !loading && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complaint Details</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {complaint.complaint_id}</p>
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                {complaint.category}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority</p>
              <div className="mt-1">
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {complaint.latitude?.toFixed(6)}, {complaint.longitude?.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Reported On
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(complaint.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h3>
            <div className="flex items-center justify-between">
              {['pending', 'in_progress', 'resolved'].map((step, index) => {
                const currentStep = getStatusStep(complaint.status);
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-primary-600 border-primary-600'
                            : 'bg-white border-gray-300'
                        } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-gray-400 font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 font-medium capitalize ${
                          isCompleted ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {step.replace('_', ' ')}
                      </p>
                    </div>
                    {index < 2 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          index < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
