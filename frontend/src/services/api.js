import { getToken } from '../utils/tokenManager';

// Use deployed backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://build-for-bengaluru.onrender.com/api';

// Callback for handling 401 responses (will be set by AuthContext)
let onUnauthorized = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorized = callback;
};

// Helper function to add Authorization header when token exists
const getAuthHeaders = (contentType = 'application/json') => {
  const token = getToken();
  const headers = {};
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to handle responses and 401 errors
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Trigger logout callback if set
    if (onUnauthorized) {
      onUnauthorized();
    }
    const error = await response.json().catch(() => ({ details: 'Session expired' }));
    throw new Error(error.details || 'Session expired. Please log in again');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: 'Request failed' }));
    throw new Error(error.details || 'Request failed');
  }
  
  return response.json();
};

export const api = {
  // ============ Authentication Endpoints ============
  
  // Register a new user
  async register(name, email, password, role) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });
    
    return handleResponse(response);
  },

  // Login user
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    return handleResponse(response);
  },

  // Get current user profile (requires authentication)
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // ============ Complaint Endpoints ============
  
  // Submit a new complaint
  async submitComplaint(formData) {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(null),
      body: formData,
    });
    
    return handleResponse(response);
  },

  // Get complaint by ID (public endpoint)
  async getComplaintById(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  },

  // Get all complaints (requires authentication - government only)
  async getAllComplaints() {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get current user's personal complaints (requires authentication - citizen)
  async getMyComplaints() {
    const response = await fetch(`${API_BASE_URL}/complaints/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Update complaint status (requires authentication - government only)
  async updateComplaintStatus(id, status, deadline = null) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, deadline }),
    });
    
    return handleResponse(response);
  },

  // ============ Public Endpoints ============
  
  // Get trending issues (public endpoint)
  async getTrendingIssues() {
    const response = await fetch(`${API_BASE_URL}/trending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  },

  // Get heatmap data (public endpoint)
  async getHeatmapData() {
    const response = await fetch(`${API_BASE_URL}/heatmap`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  },

  // Get city news (public endpoint)
  async getCityNews() {
    const response = await fetch(`${API_BASE_URL}/news`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  },

  // ============ Community Validation Endpoints ============

  // Update user location
  async updateLocation(latitude, longitude) {
    const response = await fetch(`${API_BASE_URL}/users/location`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude }),
    });
    
    return handleResponse(response);
  },

  // Get nearby complaints for validation
  async getNearbyComplaints() {
    const response = await fetch(`${API_BASE_URL}/complaints-nearby`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Submit verification for a complaint
  async verifyComplaint(complaintId, isGenuine) {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_genuine: isGenuine }),
    });
    
    return handleResponse(response);
  },

  // Submit feedback for a resolved complaint
  async submitFeedback(id, rating, comments) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, comments }),
    });
    
    return handleResponse(response);
  },
};
