import { useEffect, useState } from 'react';
import { TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CityNews from '../components/CityNews';

export default function TrendingIssues() {
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const [trendingData, newsData] = await Promise.all([
        api.getTrendingIssues(),
        api.getCityNews()
      ]);
      setTrending(trendingData);
      setNews(newsData || []);
    } catch (error) {
      console.error('Error fetching trending issues:', error);
      toast.error('Failed to load trending issues');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading trending issues..." />;
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-10">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Real-time Analytics</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6 uppercase">
            Trending <span className="text-gradient">Clusters</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-xs uppercase tracking-widest leading-relaxed opacity-70">
            Heatmap mapping and cluster identification of high-frequency civic infrastructure failures across the city network.
          </p>
        </motion.div>

        {trending.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[3.5rem] p-32 text-center border-2 border-dashed border-slate-200/50"
          >
            <AlertCircle className="w-20 h-20 text-slate-200 mx-auto mb-8" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">No Active Clusters</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning city matrix for recurring incident patterns...</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="glass-panel rounded-[3.5rem] overflow-hidden border-white/40 shadow-3xl bg-white/20">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/5 border-b border-white/20">
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Issue Intelligence</th>
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Geospatial Vector</th>
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intensity</th>
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matrix ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {trending.map((cluster, index) => (
                      <motion.tr 
                        key={cluster.cluster_id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-white/40 transition-all duration-500 group"
                      >
                        <td className="px-10 py-8">
                          <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl
                            ${index === 0 ? 'bg-slate-900 text-indigo-400 scale-110' : 
                              index === 1 ? 'bg-white text-slate-900 ring-1 ring-slate-100' : 
                              index === 2 ? 'bg-white text-slate-900 ring-1 ring-slate-100' : 
                              'bg-slate-100/50 text-slate-400'}
                          `}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="font-black text-slate-900 uppercase text-xs tracking-tighter">
                              {cluster.issue_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {cluster.latitude?.toFixed(5)} : {cluster.longitude?.toFixed(5)}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full w-24 overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min(100, cluster.complaint_count * 10)}%` }}
                                 className="h-full bg-indigo-600"
                               />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                {cluster.complaint_count} Reps
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                             #{cluster.cluster_id.slice(0, 8)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Network Clusters', value: trending.length, color: 'indigo' },
                { label: 'Total Transmission', value: trending.reduce((sum, c) => sum + c.complaint_count, 0), color: 'emerald' },
                { label: 'Primary Vector', value: trending[0]?.issue_type, color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-[2.5rem] p-10 border-white/40 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{item.label}</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live City News Section */}
        <div className="mt-24">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Broadcast <span className="text-gradient">Matrix</span>
            </h2>
            <div className="ml-auto px-4 py-2 bg-slate-900 rounded-2xl">
                <span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div> Live Bengaluru
                </span>
            </div>
          </motion.div>
          
          <div className="glass-card rounded-[3.5rem] p-2 overflow-hidden border-white/40 shadow-3xl">
             <CityNews news={news} />
          </div>
        </div>
      </div>
    </div>
  );
}
