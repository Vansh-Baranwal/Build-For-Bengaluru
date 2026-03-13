import { useState, useEffect } from 'react';
import { MapPin, Send, Image, X, Upload } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Add this to ensure leaflet styles are loaded if they weren't already

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter the map when the position state changes externally
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

// Component to handle clicks on the map to place a pin
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
    image_url: '',
  });
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

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
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });
        setPosition({ lat, lng });
        toast.success('Location captured successfully');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Failed to get location: ' + error.message);
        setGettingLocation(false);
      }
    );
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const result = await api.submitComplaint(formDataToSend);
      toast.success(`Complaint submitted successfully! ID: ${result.complaint_id}`);
      
      // Reset form
      setFormData({
        description: '',
        latitude: '',
        longitude: '',
        image_url: '',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setPosition(null);
    } catch (error) {
      toast.error(error.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
        <p className="text-gray-600 mt-1">Help us improve the city by reporting infrastructure problems</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail (10-500 characters)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Interactive Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pinpoint Location on Map *
            </label>
            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
            <p className="text-xs text-gray-500 mt-2">
              Click anywhere on the map to set the exact coordinates of the issue.
            </p>
          </div>

          {/* Location Inputs (Auto-filled by map) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="12.9716"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="77.5946"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            <span>{gettingLocation ? 'Getting location...' : 'Use My Location'}</span>
          </button>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Evidence Image (Optional)
            </label>
            
            {!previewUrl ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-gray-50 group cursor-pointer relative">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative inline-block mt-1">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="h-40 w-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-blue-600 mt-2 flex items-center">
              <Image className="w-3 h-3 mr-1" />
              AI will analyze the image to judge severity and priority automatically.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
