import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CityNews = ({ news }) => {
  if (!news || news.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="bg-white/5 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
          <Newspaper className="w-8 h-8 text-slate-700" />
        </div>
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest leading-relaxed">
          Scanning Broadcast Matrix for Civic Intelligence...
        </h3>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-4 animate-pulse">
          Syncing with City Infrastructure Feeds
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      {news.map((article, idx) => (
        <motion.a 
          key={idx} 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-panel border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all duration-500 flex flex-col group relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-indigo-500/20 p-2 rounded-lg backdrop-blur-md">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {article.image && (
            <div className="h-48 overflow-hidden relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>
          )}
          <div className="p-6 flex-1 flex flex-col relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                {article.source}
              </span>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-white tracking-tighter line-clamp-2 mb-3 leading-tight group-hover:text-indigo-400 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-[10px] text-slate-500 font-bold line-clamp-2 mb-6 flex-1 leading-relaxed uppercase tracking-wider">
              {article.description}
            </p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-white transition-colors">Digital Relay Protocol</span>
              <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
};

export default CityNews;
