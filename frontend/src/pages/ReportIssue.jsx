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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Max 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
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
      if (selectedFile) formDataToSend.append('image', selectedFile);
      if (audioBlob) formDataToSend.append('audio', audioBlob, 'recording.webm');

      const result = await api.submitComplaint(formDataToSend);
      toast.success(`Filed successfully! ID: ${result.complaint_id}`);
      
      setFormData({ description: '', latitude: '', longitude: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setAudioBlob(null);
      setPosition(null);
    } catch (error) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Action Protocol</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
            Report <span className="text-gradient">Incident</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg leading-relaxed uppercase tracking-tighter">
            Contribute to the city's intelligence network by reporting infrastructure failures.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Form Area */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass-card rounded-[3rem] p-10 shadow-2xl shadow-indigo-100">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Text & Voice */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue intelligence</label>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-[10px] font-bold">
                      <Mic className="w-3 h-3" />
                      Voice Enabled
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the incident (e.g., Pothole near M.G. Road)..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[2rem] px-8 py-6 text-sm font-medium outline-none transition-all placeholder:text-slate-400 min-h-[160px]"
                    required={!audioBlob}
                  />
                  <div className="bg-white/50 rounded-3xl p-4 border border-slate-100">
                    <VoiceRecorder 
                        onRecordingComplete={setAudioBlob} 
                        onRemove={() => setAudioBlob(null)} 
                    />
                  </div>
                </div>

                {/* Map & Location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Geospatial data</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="text-indigo-600 text-[10px] font-black hover:underline flex items-center gap-1 uppercase tracking-widest"
                    >
                      <Navigation className={`w-3 h-3 ${gettingLocation ? 'animate-spin' : ''}`} />
                      {gettingLocation ? 'Acquiring Signal...' : 'Auto-Locate'}
                    </button>
                  </div>
                  
                  <div className="h-80 w-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-inner relative z-0">
                    <MapContainer
                      center={[12.9716, 77.5946]}
                      zoom={12}
                      className="h-full w-full"
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Latitude</p>
                      <p className="text-xs font-black text-slate-900">{formData.latitude || '0.000000'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Longitude</p>
                      <p className="text-xs font-black text-slate-900">{formData.longitude || '0.000000'}</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-premium py-6 flex items-center justify-center gap-4 text-sm font-black uppercase tracking-[0.2em]"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text="Submitting Protocol..." />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Incident Report
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Right Sidebar - Photo Upload */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-[3rem] p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-indigo-400 to-emerald-400 animate-shimmer"></div>
              
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Evidence</label>
              </div>

              <div className="relative">
                {!previewUrl ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 hover:border-indigo-400 hover:bg-white transition-all duration-500 cursor-pointer group relative overflow-hidden">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4 group-hover:text-indigo-400 transition-colors duration-500 animate-float" />
                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest leading-loose">
                      Drop Evidence<br/> or <span className="text-indigo-600">Browse</span>
                    </p>
                  </div>
                ) : (
                  <div className="relative group">
                    <motion.img 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={previewUrl} 
                      alt="Evidence" 
                      className="w-full aspect-square object-cover rounded-[2.5rem] shadow-2xl group-hover:scale-105 transition-transform duration-700"
                    />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute -top-3 -right-3 bg-rose-500 text-white p-3 rounded-2xl shadow-xl hover:bg-slate-900 transition-colors z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-x-0 -bottom-3 px-6 z-20">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white">
                        <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-900">AI Integrity Check Passed</p>
                        </div>
                    </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex gap-4 items-start text-left">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">Intelligent Priority</h5>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tighter">AI automatically classifies severity based on image & description.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Widget */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-3xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest">Protocol Tip</h4>
                </div>
                <p className="text-indigo-200 text-xs font-bold leading-relaxed">Ensure high-visibility photos for rapid departmental response.</p>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mb-16 -mr-16"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
