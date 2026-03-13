import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-100 flex items-center justify-center ring-8 ring-indigo-50">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Join the Movement
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Secure City Registration
          </p>
        </div>

        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
          
          <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Account Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({...p, role: 'citizen'}))}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold
                        ${formData.role === 'citizen' 
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-lg shadow-blue-50' 
                          : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                        }
                      `}
                    >
                      <User className="w-6 h-6" />
                      <span className="text-sm">Citizen</span>
                      {formData.role === 'citizen' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(p => ({...p, role: 'news'}))}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold
                        ${formData.role === 'news' 
                          ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-lg shadow-purple-50' 
                          : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                        }
                      `}
                    >
                      <Newspaper className="w-6 h-6" />
                      <span className="text-sm">News Media</span>
                      {formData.role === 'news' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full flex items-center justify-center gap-3 py-5 px-6 bg-indigo-600 hover:bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-indigo-200 text-sm font-black uppercase tracking-widest transition-all duration-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <p className="text-center text-sm font-bold text-slate-500">
              Already have an account?{' '}
              <Link 
                to={`/login/${formData.role}`} 
                className={`transition-colors ${formData.role === 'citizen' ? 'text-blue-600 hover:text-blue-800' : 'text-purple-600 hover:text-purple-800'}`}
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
        
        <div className="mt-8 flex justify-center gap-6">
          <Link to="/login/government" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Government Portal</Link>
          <span className="text-slate-200 text-xs">|</span>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            City of Bengaluru • 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
