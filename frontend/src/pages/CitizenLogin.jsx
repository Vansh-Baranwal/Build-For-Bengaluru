import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

const CitizenLogin = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value) {
          return 'Password is required';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password, 'citizen');
    } catch (error) {
      setServerError(error.message || 'Login failed. Please try again.');
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
              src="/logo.png" 
              alt="NammaFix Logo" 
              className="h-24 w-auto drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            />
          </div>
          <h1 className="mb-2">Citizen Login</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
            Field Reporting & Monitoring Sync
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent"></div>
          
          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {serverError}
              </div>
            )}

            <div className="space-y-6">
              {[
                { id: 'email', label: 'Email Address', placeholder: 'john@example.com', type: 'email' },
                { id: 'password', label: 'Password', placeholder: '••••••••', type: 'password' }
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block tracking-[0.15em]">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    required
                    value={formData[field.id]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-6 py-4 bg-white/5 border ${
                      errors[field.id] ? 'border-red-500/50' : 'border-white/5'
                    } rounded-2xl text-white font-bold focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none placeholder:text-slate-600`}
                    placeholder={field.placeholder}
                  />
                  {errors[field.id] && (
                    <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Syncing...' : 'Initiate Session'}
              </button>
            </div>

            <div className="text-center space-y-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                New to the hub?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-white transition-colors">
                  Generate Profile
                </Link>
              </p>
              
              <div className="pt-6 border-t border-white/5 space-y-4">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Alternate Matrix Nodes:</p>
                <div className="flex gap-4 justify-center">
                  <Link to="/login/government" className="text-[9px] font-black text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">Official Proxy</Link>
                  <span className="text-slate-800 text-[9px]">|</span>
                  <Link to="/login/news" className="text-[9px] font-black text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest">Media Relay</Link>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CitizenLogin;
