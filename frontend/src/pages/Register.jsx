import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Briefcase, 
  Newspaper, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.register(formData.name, formData.email, formData.password, formData.role);
      toast.success('Account created successfully!');
      navigate(`/login/${formData.role}`);
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
      <div className="mesh-gradient"></div>
      
      <div className="max-w-xl w-full relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20 flex items-center justify-center ring-8 ring-indigo-500/5">
              <UserPlus className="h-10 w-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
            </div>
          </div>
          <h1 className="mb-2">Join the Network</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Secure Node Registration
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent"></div>
          
          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block tracking-[0.15em]">Account Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { role: 'citizen', label: 'Citizen', icon: User },
                      { role: 'news', label: 'News Media', icon: Newspaper }
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setFormData(p => ({...p, role: item.role}))}
                        className={`
                          flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all font-bold
                          ${formData.role === item.role 
                            ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <item.icon className={`w-5 h-5 ${formData.role === item.role ? 'text-indigo-400' : ''}`} />
                        <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 md:col-span-2">
                {[
                  { name: 'name', label: 'Full Name', icon: User, placeholder: 'Jane Doe', type: 'text' },
                  { name: 'email', label: 'Email Address', icon: Mail, placeholder: 'jane@example.com', type: 'email' },
                  { name: 'password', label: 'Secure Password', icon: Lock, placeholder: '••••••••', type: 'password' }
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
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Processing...' : 'Initiate Registration'}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              Already encrypted?{' '}
              <Link 
                to={`/login/${formData.role}`} 
                className="text-indigo-400 hover:text-white transition-colors"
              >
                Login to Node
              </Link>
            </p>
          </form>
        </motion.div>
        
        <div className="mt-8 flex justify-center gap-6">
          <Link to="/login/government" className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-400 transition-colors">Official Command Login</Link>
          <span className="text-slate-800 text-[9px]">|</span>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
            Bengaluru Matrix • 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
