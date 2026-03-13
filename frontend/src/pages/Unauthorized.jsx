import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    if (user?.role === 'government') {
      navigate('/government');
    } else if (user?.role === 'news') {
      navigate('/news');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <ShieldAlert className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            You do not have permission to access this page
          </p>
          <p className="mt-2 text-sm text-gray-500">
            This page is restricted to specific user roles. Please contact your administrator if you believe you should have access.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleReturnToDashboard}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
