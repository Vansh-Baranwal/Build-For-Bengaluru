import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
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
    <div className="h-[calc(100vh-4rem)]">
      <div className="h-full relative">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Complaint Markers */}
          {complaints.map((complaint, index) => (
            <Marker
              key={index}
              position={[complaint.latitude, complaint.longitude]}
              icon={getMarkerIcon(complaint.category)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 capitalize mb-2">
                    {complaint.category}
                  </h3>
                  <div className="space-y-1">
                    <div>
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <p className="text-xs text-gray-600">
                      Location: {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Heatmap circles for density visualization */}
          {complaints.map((complaint, index) => (
            <Circle
              key={`circle-${index}`}
              center={[complaint.latitude, complaint.longitude]}
              radius={200}
              pathOptions={{
                fillColor: complaint.priority === 'high' ? '#ef4444' : complaint.priority === 'medium' ? '#f97316' : '#22c55e',
                fillOpacity: 0.1,
                color: complaint.priority === 'high' ? '#ef4444' : complaint.priority === 'medium' ? '#f97316' : '#22c55e',
                weight: 1,
                opacity: 0.3,
              }}
            />
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Issue Categories</h3>
          <div className="space-y-2">
            {[
              { name: 'Pothole', color: '#ef4444' },
              { name: 'Garbage', color: '#f97316' },
              { name: 'Flooding', color: '#3b82f6' },
              { name: 'Drainage', color: '#a855f7' },
              { name: 'Streetlight', color: '#eab308' },
            ].map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Total Complaints: <span className="font-semibold">{complaints.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
