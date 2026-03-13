import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, ArrowRight, ShieldCheck, User, Lock } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-100 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Official Access
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Secure Government Gateway
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
                {serverError}
              </div>
            )}

            <div className="space-y-5">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Security Pass</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl shadow-xl shadow-indigo-100 text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Authorize Session'}
              {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="pt-8 border-t border-slate-50">
              <div className="bg-indigo-50/50 p-5 rounded-2xl mb-8 border border-indigo-50/50">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2">Master Credentials</p>
                <div className="flex justify-between items-center text-xs text-indigo-900 font-bold">
                  <span>admin</span>
                  <span className="w-1.5 h-1.5 bg-indigo-200 rounded-full" />
                  <span>admin123</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Switch Mode</span>
                <div className="flex gap-2 justify-center">
                  <Link
                    to="/login/citizen"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Citizen
                  </Link>
                  <Link
                    to="/login/news"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    News Hub
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
          NammaFix Infrastructure Monitoring • Bengaluru
        </p>
      </div>
    </div>
  );
};

export default GovernmentLogin;
