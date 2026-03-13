import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedCallback } from '../services/api';
import { getToken, setToken as storeToken, removeToken } from '../utils/tokenManager';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      
      if (token) {
        try {
          // Validate token by fetching user profile
          const userData = await api.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          console.error('Token validation failed:', error);
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up 401 handler
  useEffect(() => {
    setUnauthorizedCallback(() => {
      handleLogout();
      toast.error('Session expired. Please log in again');
    });
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      // Store token
      storeToken(response.token);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Redirect based on role
      if (response.user.role === 'government') {
        navigate('/government');
      } else if (response.user.role === 'news') {
        navigate('/news');
      } else {
        navigate('/');
      }
      
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      await api.register(name, email, password, role);
      toast.success('Registration successful! Please log in.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    handleLogout();
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
