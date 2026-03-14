import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PriorityBadge from '../components/PriorityBadge';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons by category
const getMarkerIcon = (category) => {
  const colors = {
    pothole: '#ef4444',
    garbage: '#f97316',
    flooding: '#3b82f6',
    drainage: '#a855f7',
    'streetlight failure': '#eab308',
    'water leak': '#06b6d4',
    'traffic signal issue': '#ec4899',
  };

  const color = colors[category] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function CityMap() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await api.getHeatmapData();
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading city map..." />;
  }

  const center = [12.9716, 77.5946]; // Bengaluru

  return (
    <div className="h-[calc(100vh-5rem)] p-4 md:p-10 bg-transparent relative overflow-hidden">
      <div className="mesh-gradient"></div>
      
      <div className="h-full relative glass-panel rounded-[3.5rem] overflow-hidden border-white/5 shadow-3xl bg-white/5 backdrop-blur-md">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full grayscale contrast-[1.2] brightness-[0.6] invert-[1] hue-rotate-[180deg]"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Complaint Markers with Clustering */}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            showCoverageOnHover={false}
          >
            {complaints.map((complaint, index) => (
              <Marker
                key={index}
                position={[complaint.latitude, complaint.longitude]}
                icon={getMarkerIcon(complaint.category)}
              >
                <Popup className="premium-popup">
                  <div className="p-4 glass-panel border-white/20 bg-black/80 backdrop-blur-xl min-w-[180px]">
                    <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em] mb-4 border-b border-white/10 pb-2">
                       {complaint.category}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Digital Coordinates</p>
                        <p className="text-[9px] font-black text-indigo-400 tracking-tighter">
                          {complaint.latitude.toFixed(5)} / {complaint.longitude.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* Heatmap circles for density visualization */}
          {complaints.map((complaint, index) => (
            <Circle
              key={`circle-${index}`}
              center={[complaint.latitude, complaint.longitude]}
              radius={200}
              pathOptions={{
                fillColor: complaint.priority === 'high' ? '#ef4444' : complaint.priority === 'medium' ? '#f97316' : '#22c55e',
                fillOpacity: 0.2,
                color: complaint.priority === 'high' ? '#ef4444' : complaint.priority === 'medium' ? '#f97316' : '#22c55e',
                weight: 1,
                opacity: 0.5,
              }}
            />
          ))}
        </MapContainer>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-10 right-10 glass-panel rounded-[2.5rem] p-8 z-[1000] min-w-[240px] bg-black/60 backdrop-blur-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
             <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em]">Matrix Legend</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Pothole', color: '#ef4444' },
              { name: 'Garbage', color: '#f97316' },
              { name: 'Flooding', color: '#3b82f6' },
              { name: 'Drainage', color: '#a855f7' },
              { name: 'Streetlight', color: '#eab308' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                <div
                  className="w-5 h-5 rounded-lg border-2 border-white/20 shadow-xl rotate-12"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Total Signals: <span className="text-indigo-400 ml-2">{complaints.length}</span>
            </p>
          </div>
        </motion.div>

        {/* Header Overlay */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 left-10 z-[1000]"
        >
           <div className="glass-panel rounded-2xl px-6 py-3 border border-white/10 shadow-2xl flex items-center gap-4 bg-black/40 backdrop-blur-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-indigo-500 decoration-2 underline-offset-4">Bengaluru Live Feed</span>
           </div>
        </motion.div>
      </div>
    </div>
  );
}
