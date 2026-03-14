import { Menu, Activity, LogOut, User, Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuClick }) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="nav-floating border-white/5">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <Link to="/" className="flex items-center group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center relative overflow-hidden ring-4 ring-white/5"
          >
            <Activity className="w-6 h-6 text-slate-900 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.div>
          <div className="ml-3">
            <h1 className="text-xl font-black text-white tracking-tighter leading-none flex items-center gap-1">
              NammaFix <Sparkles className="w-3 h-3 text-indigo-400" />
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligence Hub</p>
          </div>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {isAuthenticated && (
          <div className="flex items-center gap-6">
            <Link to="/map" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">City Map</Link>
            <Link to="/trending" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Trending</Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <button className="relative p-2 text-slate-500 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none mb-1">{user?.name}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user?.role}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login/citizen"
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn-premium px-6 py-2.5 rounded-xl text-[10px]"
            >
              Start Contributing
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
