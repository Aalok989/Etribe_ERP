// Utility function to get API headers from environment variables
export const getApiHeaders = () => {
  return {
    'Client-Service': import.meta.env.VITE_CLIENT_SERVICE,
    'Auth-Key': import.meta.env.VITE_AUTH_KEY,
    'rurl': import.meta.env.VITE_RURL,
    'Content-Type': 'application/json',
  };
};

// Utility function to get API headers with user authentication
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const uid = localStorage.getItem('uid');
  const authToken = localStorage.getItem('authToken') || token; // Use authToken if available, fallback to token
  
  return {
    'Client-Service': import.meta.env.VITE_CLIENT_SERVICE,
    'Auth-Key': import.meta.env.VITE_AUTH_KEY,
    'uid': uid,
    'token': token,
    'rurl': import.meta.env.VITE_RURL,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
};

// Utility function to get API headers with user authentication for FormData (without Content-Type)
export const getAuthHeadersFormData = () => {
  const token = localStorage.getItem('token');
  const uid = localStorage.getItem('uid');
  const authToken = localStorage.getItem('authToken') || token; // Use authToken if available, fallback to token
  
  return {
    'Client-Service': import.meta.env.VITE_CLIENT_SERVICE,
    'Auth-Key': import.meta.env.VITE_AUTH_KEY,
    'uid': uid,
    'token': token,
    'rurl': import.meta.env.VITE_RURL,
    'Authorization': `Bearer ${authToken}`,
  };
};


