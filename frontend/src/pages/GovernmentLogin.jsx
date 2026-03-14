import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, ArrowRight, ShieldCheck, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const GovernmentLogin = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError('');

    try {
      await login(formData.username, formData.password, 'government');
    } catch (error) {
      setServerError(error.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
      <div className="mesh-gradient"></div>
      
      <div className="max-w-md w-full relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-6">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src="/src/assets/logo.png" 
              alt="NammaFix Logo" 
              className="h-24 w-auto drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            />
          </div>
          <h1 className="mb-2">Official Portal</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Secure Command Gateway
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>
          
          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {serverError}
              </div>
            )}

            <div className="space-y-6">
              {[
                { name: 'username', label: 'Command ID', placeholder: 'admin', icon: User, type: 'text' },
                { name: 'password', label: 'Security Pass', placeholder: '••••••••', icon: Lock, type: 'password' }
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block tracking-[0.15em]">{field.label}</label>
                  <div className="relative group">
                    <field.icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      name={field.name}
                      type={field.type}
                      required
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none placeholder:text-slate-600"
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Verifying...' : 'Authorize Access'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="bg-indigo-500/5 p-5 rounded-2xl mb-8 border border-white/5">
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-3 text-center">Protocol Master Entry</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-black tracking-widest bg-white/5 p-3 rounded-lg">
                  <span>ADMIN</span>
                  <ArrowRight className="w-3 h-3 opacity-30" />
                  <span>ADMIN123</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">Relay to Matrix Centers:</p>
                <div className="flex gap-4 justify-center">
                  <Link to="/login/citizen" className="text-[9px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">Citizen Hub</Link>
                  <span className="text-slate-800 text-[9px]">|</span>
                  <Link to="/login/news" className="text-[9px] font-black text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest">Media Node</Link>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
        
        <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-8">
          NammaFix Infrastructure Monitoring • Bengaluru
        </p>
      </div>
    </div>
  );
};

export default GovernmentLogin;
