import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Map, 
  TrendingUp,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  let navItems = [];
  if (!user || user.role === 'citizen') {
    navItems = [
      { path: '/', icon: LayoutDashboard, label: 'Overview' },
      { path: '/report', icon: Zap, label: 'Report Issue' },
      { path: '/track', icon: Search, label: 'Intelligence' },
      { path: '/trending', icon: TrendingUp, label: 'Analytics' },
    ];
  } else if (user.role === 'government') {
    navItems = [
      { path: '/government', icon: LayoutDashboard, label: 'Command Center' },
      { path: '/government/complaints', icon: FileText, label: 'Operations' },
      { path: '/trending', icon: TrendingUp, label: 'City Trends' },
    ];
  }

  const isActive = (path) => location.pathname === path;

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 1024) && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`
            fixed lg:sticky top-32 left-0 z-50
            w-72 h-[calc(100vh-10rem)] glass-panel rounded-[2.5rem] p-6 lg:block
            ${isOpen ? 'block' : 'hidden'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="lg:hidden flex justify-end mb-4">
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Navigation Matrix</span>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="relative group block"
                  >
                    <div className={`
                      flex items-center px-6 py-4 rounded-2xl transition-all duration-300
                      ${active
                        ? 'bg-white/10 text-white border border-white/5'
                        : 'text-slate-500 hover:bg-white/5 hover:text-white'
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`} />
                      <span className="ml-4 text-xs font-black uppercase tracking-widest">{item.label}</span>
                      
                      {active && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute right-4 w-1 h-4 bg-indigo-500 rounded-full"
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-white/5">
              <div className="glass-card rounded-2xl p-4 bg-white/5 border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">System Health</p>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[94%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
