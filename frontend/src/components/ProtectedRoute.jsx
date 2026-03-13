import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while authentication is being initialized
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to role-specific login if not authenticated
  if (!isAuthenticated) {
    if (requiredRole === 'government') {
      return <Navigate to="/login/government" replace />;
    } else if (requiredRole === 'news') {
      return <Navigate to="/login/news" replace />;
    } else {
      return <Navigate to="/login/citizen" replace />;
    }
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children if authenticated and authorized
  return children;
};

export default ProtectedRoute;
