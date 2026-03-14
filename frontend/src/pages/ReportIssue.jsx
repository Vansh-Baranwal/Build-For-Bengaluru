import { useState, useEffect } from 'react';
import { MapPin, Send, Image, X, Upload, Sparkles, Navigation, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import VoiceRecorder from '../components/VoiceRecorder';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { animate: true, duration: 1 });
    }
  }, [position, map]);
  return null;
}

function LocationMarker({ position, setPosition, setFormData }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      }));
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function ReportIssue() {
  const [formData, setFormData] = useState({
    description: '',
    latitude: '',
    longitude: '',
  });
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'latitude' || name === 'longitude') {
      const newLat = name === 'latitude' ? parseFloat(value) : parseFloat(formData.latitude);
      const newLng = name === 'longitude' ? parseFloat(value) : parseFloat(formData.longitude);
      if (!isNaN(newLat) && !isNaN(newLng)) {
        setPosition({ lat: newLat, lng: newLng });
      }
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData({ ...formData, latitude: lat, longitude: lng });
        setPosition({ lat, lng });
        toast.success('Location pinpointed');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Location error: ' + error.message);
        setGettingLocation(false);
      }
    );
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error('Pinpoint the location');
      return;
    }
    if (!formData.description && !audioBlob) {
      toast.error('Provide description or voice');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      if (formData.description) formDataToSend.append('description', formData.description);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      if (audioBlob) formDataToSend.append('audio', audioBlob, 'recording.webm');

      const result = await api.submitComplaint(formDataToSend);
      toast.success(`Filed successfully! ID: ${result.complaint_id}`);
      
      setFormData({ description: '', latitude: '', longitude: '' });
      setAudioBlob(null);
      setPosition(null);
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Action Protocol</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-6 uppercase">
            Report <span className="text-gradient">Incident</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-lg uppercase text-xs tracking-tighter leading-relaxed">
            Contribute to the city's intelligence network by reporting infrastructure failures.
          </p>
        </motion.div>

        <div className="flex flex-col items-center">
          {/* Main Form Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl space-y-10"
          >
            <div className="glass-card rounded-[3.5rem] p-12 border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Text & Voice */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Issue intelligence</label>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-slate-400 text-[9px] font-black uppercase tracking-widest border border-white/5">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      Voice Enabled
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the incident (e.g., Pothole near M.G. Road)..."
                    className="w-full bg-white/5 border border-white/5 focus:border-indigo-500 rounded-[2.5rem] px-8 py-6 text-sm font-medium outline-none transition-all placeholder:text-slate-600 min-h-[180px] text-white"
                    required={!audioBlob}
                  />
                  <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5">
                    <VoiceRecorder 
                        onRecordingComplete={setAudioBlob} 
                        onRemove={() => setAudioBlob(null)} 
                    />
                  </div>
                </div>

                {/* Map & Location */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geospatial data</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="text-indigo-400 text-[10px] font-black hover:text-white flex items-center gap-1 uppercase tracking-[0.2em] transition-colors"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                      {gettingLocation ? 'Acquiring Signal...' : 'Auto-Locate'}
                    </button>
                  </div>
                  
                  <div className="h-96 w-full rounded-[3rem] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative z-0 group">
                    <MapContainer
                      center={[12.9716, 77.5946]}
                      zoom={12}
                      className="h-full w-full grayscale contrast-125 brightness-75"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker 
                        position={position} 
                        setPosition={setPosition} 
                        setFormData={setFormData}
                      />
                      <MapUpdater position={position} />
                    </MapContainer>
                    <div className="absolute top-6 left-6 z-[100] px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                      Live Coordinate Matrix
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Latitude Vector</p>
                      <p className="text-sm font-black text-white tracking-tight">{formData.latitude || '0.000000'}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Longitude Vector</p>
                      <p className="text-sm font-black text-white tracking-tight">{formData.longitude || '0.000000'}</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-premium py-8 flex items-center justify-center gap-6 text-sm font-black uppercase tracking-[0.3em] text-slate-900"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text="Initializing Protocol..." />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Finalize & Broadcast
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
