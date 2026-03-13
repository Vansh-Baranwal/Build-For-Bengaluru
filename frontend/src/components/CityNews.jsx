import { Newspaper, ExternalLink } from 'lucide-react';

const CityNews = ({ news }) => {
  if (!news || news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
        <p className="text-gray-500">No recent news articles found for Bengaluru civic issues.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {news.map((article, idx) => (
        <a 
          key={idx} 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all border border-gray-100 flex flex-col group"
        >
          {article.image && (
            <div className="h-40 overflow-hidden relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
            </div>
          )}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest px-2 py-0.5 bg-purple-50 rounded">
                {article.source}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h3 className="text-md font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
              {article.description}
            </p>
            <div className="text-blue-600 text-[11px] font-bold flex items-center mt-auto">
              READ ARTICLE <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default CityNews;
