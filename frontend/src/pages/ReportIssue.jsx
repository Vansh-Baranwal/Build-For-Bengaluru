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
    <div className="min-h-screen pt-12 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Action Protocol</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6 uppercase">
            Report <span className="text-gradient">Incident</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg uppercase text-xs tracking-tighter leading-relaxed">
            Contribute to the city's intelligence network by reporting infrastructure failures.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Form Area */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-10"
          >
            <div className="glass-card rounded-[3.5rem] p-12 shadow-2xl shadow-indigo-100/20">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Text & Voice */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue intelligence</label>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/5 rounded-full text-slate-500 text-[9px] font-black uppercase tracking-widest">
                      <Mic className="w-3 h-3 text-indigo-600" />
                      Voice Enabled
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the incident (e.g., Pothole near M.G. Road)..."
                    className="w-full bg-slate-50/50 border-2 border-transparent focus:border-indigo-100 rounded-[2.5rem] px-8 py-6 text-sm font-medium outline-none transition-all placeholder:text-slate-400 min-h-[180px]"
                    required={!audioBlob}
                  />
                  <div className="bg-white/40 rounded-[2.5rem] p-6 border border-white/50">
                    <VoiceRecorder 
                        onRecordingComplete={setAudioBlob} 
                        onRemove={() => setAudioBlob(null)} 
                    />
                  </div>
                </div>

                {/* Map & Location */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Geospatial data</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="text-indigo-600 text-[10px] font-black hover:underline flex items-center gap-1 uppercase tracking-[0.2em]"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                      {gettingLocation ? 'Acquiring Signal...' : 'Auto-Locate'}
                    </button>
                  </div>
                  
                  <div className="h-96 w-full rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl relative z-0 group">
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
                    <div className="absolute top-6 left-6 z-[100] px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                      Live Coordinate Matrix
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 border border-white shadow-sm">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Latitude Vector</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{formData.latitude || '0.000000'}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 border border-white shadow-sm">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Longitude Vector</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{formData.longitude || '0.000000'}</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-premium py-8 flex items-center justify-center gap-6 text-sm font-black uppercase tracking-[0.3em]"
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

          {/* Right Sidebar - Photo Upload */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div className="glass-card rounded-[3.5rem] p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-400 to-emerald-400 animate-shimmer"></div>
              
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Evidence</label>
              </div>

              <div className="relative">
                {!previewUrl ? (
                  <div className="bg-slate-50/50 border-4 border-dashed border-slate-200 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-white transition-all duration-700 cursor-pointer group relative overflow-hidden">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    <Upload className="w-16 h-16 text-slate-300 mx-auto mb-6 group-hover:text-indigo-400 transition-colors duration-700 animate-float" />
                    <p className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em] leading-relaxed">
                      Transmit Lens<br/> or <span className="text-indigo-600">Scan</span>
                    </p>
                  </div>
                ) : (
                  <div className="relative group p-2 bg-white rounded-[3.5rem] shadow-2xl">
                    <motion.img 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      src={previewUrl} 
                      alt="Evidence" 
                      className="w-full aspect-[4/5] object-cover rounded-[3rem] shadow-inner group-hover:scale-105 transition-transform duration-1000"
                    />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute -top-3 -right-3 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl hover:bg-rose-500 transition-all z-20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-x-0 -bottom-6 px-8 z-20">
                      <div className="bg-slate-900/90 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-2xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/80">AI Optical Analysis: Online</p>
                          </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 bg-indigo-50/30 rounded-[2rem] p-8 border border-indigo-100/50">
                <div className="flex gap-4 items-start text-left">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">Neural Classification</h5>
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">Automatic priority assignment through deep learning analysis of visual data.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Tip Widget */}
            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-3xl">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-white/10 rounded-2xl ring-1 ring-white/10">
                    <Navigation className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Field Protocol</h4>
                </div>
                <p className="text-indigo-200 text-xs font-bold leading-relaxed mb-6 uppercase tracking-tighter">Ensure clear sightlines to landmarks for high-precision department response.</p>
                <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
              </div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[100px] -mb-24 -mr-24"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
