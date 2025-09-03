import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: '/api', // Use proxy path in development
  headers: {
    'Client-Service': import.meta.env.VITE_CLIENT_SERVICE,
    'Auth-Key': import.meta.env.VITE_AUTH_KEY,
    'rurl': import.meta.env.VITE_RURL,
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for sending cookies (ci_session)
  // No timeout - API calls can take as long as needed
});

// Add interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData (file uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to extract JSON from mixed content
const extractJsonFromString = (str) => {
  if (typeof str !== 'string') return str;
  
  try {
    // First try to parse the entire string as JSON
    return JSON.parse(str);
  } catch {
    // If that fails, look for JSON objects in the string
    const jsonMatches = str.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Try to parse the last (most complete) JSON object found
      for (let i = jsonMatches.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(jsonMatches[i]);
          // Check if it looks like a valid API response
          if (parsed && (parsed.status !== undefined || parsed.token !== undefined || parsed.message !== undefined)) {
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  return str;
};

// Add response interceptor to handle malformed responses
api.interceptors.response.use(
  (response) => {
    // Clean up response data if it's a string with mixed content
    if (typeof response.data === 'string') {
      const cleaned = extractJsonFromString(response.data);
      if (cleaned !== response.data) {
        response.data = cleaned;
      }
    }
    return response;
  },
  (error) => {
    // Handle response errors
    if (error.response && typeof error.response.data === 'string') {
      const cleaned = extractJsonFromString(error.response.data);
      if (cleaned !== error.response.data) {
        error.response.data = cleaned;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
