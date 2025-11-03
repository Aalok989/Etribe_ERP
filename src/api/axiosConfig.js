import axios from 'axios';

// Determine base URL: Use environment variable in production, or '/api' for development proxy
// In development, Vite proxy handles '/api' -> actual API URL
// In production, we need the full API URL since there's no proxy
// SECURITY: Never hardcode API URLs in source code - always use environment variables
const getBaseURL = () => {
  // Check if we're in production mode
  if (import.meta.env.PROD) {
    // Production: Use the full API base URL from environment variable
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    if (!apiBaseUrl || apiBaseUrl.trim() === '') {
      // Fail safely - don't use a hardcoded fallback URL for security
      const errorMsg = 'VITE_API_BASE_URL environment variable is required for production builds. ' +
                       'Please set it in your CI/CD pipeline (Jenkins) before running the build.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Ensure the URL ends with a slash
    return apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
  } else {
    // Development: Use proxy path which will be handled by Vite dev server
    return '/api';
  }
};

// Create Axios instance
const api = axios.create({
  baseURL: getBaseURL(),
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
