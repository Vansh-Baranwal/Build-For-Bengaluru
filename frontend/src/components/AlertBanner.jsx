import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function AlertBanner({ message, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !message) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-amber-800">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
