// Use deployed backend API
const API_BASE_URL = 'https://build-for-bengaluru.onrender.com/api';

export const api = {
  // Submit a new complaint
  async submitComplaint(data) {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to submit complaint');
    }
    
    return response.json();
  },

  // Get complaint by ID
  async getComplaintById(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to fetch complaint');
    }
    
    return response.json();
  },

  // Get trending issues
  async getTrendingIssues() {
    const response = await fetch(`${API_BASE_URL}/trending`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending issues');
    }
    
    return response.json();
  },

  // Get heatmap data
  async getHeatmapData() {
    const response = await fetch(`${API_BASE_URL}/heatmap`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch heatmap data');
    }
    
    return response.json();
  },
};
