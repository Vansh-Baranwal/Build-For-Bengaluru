import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    if (user?.role === 'government') {
      navigate('/government');
    } else if (user?.role === 'news') {
      navigate('/news');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative">
      <div className="mesh-gradient"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full text-center p-12 rounded-[3.5rem] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
        
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="bg-red-500/10 p-5 rounded-[2rem] border border-red-500/20">
              <ShieldAlert className="h-12 w-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
            </div>
          </div>
          
          <div>
            <h2 className="mb-4">
              Access <span className="text-red-500">Denied</span>
            </h2>
            <p className="text-slate-200 font-bold uppercase tracking-widest text-xs mb-4">
              Node Authorization Failure
            </p>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              You do not have the required security clearing to access this restricted intelligence matrix. 
              Please contact command if this is a system error.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleReturnToDashboard}
              className="btn-premium w-full group flex items-center justify-center gap-3"
            >
              Return to Base Core
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
