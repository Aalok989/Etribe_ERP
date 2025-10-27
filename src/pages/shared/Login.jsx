import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // Import custom Axios instance
import { getApiHeaders, getAuthHeaders } from '../../utils/apiHeaders';
import logo from '../../assets/Etribe-logo.jpg';
import bgImage from '../../assets/images/bg-login.jpg';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);


  const [regForm, setRegForm] = useState({
    name: '',
    contact: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    country: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
  });
  const [regError, setRegError] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const navigate = useNavigate();

  // Remove automatic redirect - let App.jsx handle authentication flow
  // useEffect(() => {
  //   // If token exists, redirect to dashboard
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     navigate('/dashboard', { replace: true });
  //   }
  // }, [navigate]);

  // Fetch countries
  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/common/countries', {}, {
        headers: getApiHeaders()
      });
      
      console.log('Countries response:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        // Transform the response to match expected format with id and name
        const transformedCountries = response.data.data.map((country, index) => ({
          id: index + 1, // Use index as id since API doesn't provide id
          name: country.country
        }));
        setCountries(transformedCountries);
      } else {
        console.error('Invalid countries response format:', response.data);
        setCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      console.error('Error details:', error.response?.data);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Fetch states based on selected country
  const fetchStates = async (countryId) => {
    console.log('fetchStates called with countryId:', countryId);
    if (!countryId) {
      console.log('No countryId provided, clearing states');
      setStates([]);
      return;
    }

    try {
      setLoadingStates(true);
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      // For now, hardcode India to test the API
      const countryName = 'India';
      console.log('Available countries:', countries);
      console.log('Looking for country with id:', countryId, 'type:', typeof countryId);
      console.log('Using hardcoded country name:', countryName);
      
      const response = await api.post('/common/states', { country: countryName }, {
        headers: getApiHeaders()
      });
      
      console.log('States response:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log('Raw states data:', response.data.data);
        setStates(response.data.data);
      } else {
        console.error('Invalid states response format:', response.data);
        setStates([]);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      console.error('Error details:', error.response?.data);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  // Load countries when component mounts
  useEffect(() => {
    fetchCountries();
  }, []);



  // Password validation function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const username = (e.target.email.value || '').trim();
    const password = (e.target.password.value || '').trim();
    
    // Basic validation
    if (!username || !password) {
      toast.error('Please enter both email and password.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/common/login', { username, password });
      console.log('Login response:', response.data);
      
      // Handle malformed responses that might contain PHP errors mixed with JSON
      let data = response.data || {};
      
      // If response is a string, try to extract JSON from it
      if (typeof data === 'string') {
        try {
          // Look for JSON object in the response string
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          toast.error('Server returned invalid response format. Please try again.');
          return;
        }
      }

      // Success path: token present
      if (data?.token) {
        localStorage.setItem('token', data.token);
        
        // Robust UID extraction across possible shapes
        const userData = data.data || data.user || {};
        const uidCandidate = userData.id ?? userData.user_id ?? data.user_id ?? data.id;
        if (uidCandidate) {
          localStorage.setItem('uid', String(uidCandidate));
        }
        
        // Determine user role based on response data
        let userRole = 'user';
        const u = userData;
        if (
          u?.role === 'admin' ||
          u?.user_type === 'admin' ||
          u?.is_admin === true ||
          u?.admin === true ||
          u?.type === 'admin' ||
          u?.user_role === 'admin'
        ) {
          userRole = 'admin';
        } else if (String(uidCandidate) === '1') {
          userRole = 'admin';
        } else if (username.includes('admin') || username.includes('@admin') || username === 'admin') {
          userRole = 'admin';
        }
        
        localStorage.setItem('userRole', userRole);
        toast.success(`${userRole === 'admin' ? 'Admin' : 'User'} login successful!`);
        
        // Redirect based on role
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
        
        setTimeout(() => {
          window.dispatchEvent(new Event('login'));
        }, 50);
        return;
      }

      // No token returned: show backend message if available
      const backendMessage = data?.message || data?.error || data?.msg;
      if (backendMessage) {
        toast.error(backendMessage);
      } else {
        toast.error('Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const status = err.response?.status;
      const respData = err.response?.data;

      // Handle cases where response might contain PHP errors but still have valid data
      if (respData && typeof respData === 'object' && respData.token) {
        // If we somehow got a token despite an error, try to use it
        console.log('Found token in error response, attempting login...');
        localStorage.setItem('token', respData.token);
        
        const userData = respData.data || respData.user || {};
        const uidCandidate = userData.id ?? userData.user_id ?? respData.user_id ?? respData.id;
        if (uidCandidate) {
          localStorage.setItem('uid', String(uidCandidate));
        }
        
        let userRole = 'user';
        const u = userData;
        if (
          u?.role === 'admin' ||
          u?.user_type === 'admin' ||
          u?.is_admin === true ||
          u?.admin === true ||
          u?.type === 'admin' ||
          u?.user_role === 'admin'
        ) {
          userRole = 'admin';
        } else if (String(uidCandidate) === '1') {
          userRole = 'admin';
        }
        
        localStorage.setItem('userRole', userRole);
        toast.success(`${userRole === 'admin' ? 'Admin' : 'User'} login successful!`);
        
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
        
        setTimeout(() => {
          window.dispatchEvent(new Event('login'));
        }, 50);
        return;
      }

      // Extract meaningful backend messages
      const backendMessage =
        respData?.message ||
        respData?.error ||
        respData?.msg ||
        (Array.isArray(respData?.errors) ? respData.errors.join(', ') : undefined);

      if (backendMessage) {
        toast.error(backendMessage);
      } else if (status === 401 || status === 403) {
        toast.error('Unauthorized. Please check your credentials.');
      } else if (status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (err.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setLoading(true);
    
    // Validation
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    const passwordError = validatePassword(regForm.password);
    if (passwordError) {
      setRegError(passwordError);
      setLoading(false);
      return;
    }
    
    // Check if all required fields are filled
    const requiredFields = ['name', 'contact', 'email', 'password', 'address', 'country', 'state', 'district', 'city', 'pincode'];
    const missingFields = requiredFields.filter(field => !regForm[field]);
    
    if (missingFields.length > 0) {
      setRegError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      // Prepare registration data according to API format
      const registrationData = {
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        confirm_password: regForm.confirmPassword,
        phone_num: regForm.contact,
        area_id: regForm.state, // Use state ID as area_id
        address: regForm.address,
        district: regForm.district,
        city: regForm.city,
        pincode: regForm.pincode
      };
      
      console.log('Registration data:', registrationData);
      
      const response = await api.post('/common/register', registrationData, {
        headers: getAuthHeaders()
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data?.status === 'success' || response.data?.success) {
        toast.success('Registration successful! Please log in.');
        setIsLogin(true); // Switch back to login form
        setRegForm({
          name: '',
          contact: '',
          email: '',
          password: '',
          confirmPassword: '',
          address: '',
          country: '',
          state: '',
          district: '',
          city: '',
          pincode: '',
        });
      } else {
        setRegError(response.data?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    console.log('handleRegChange called:', { name, value });
    setRegForm({ ...regForm, [name]: value });
    
    // If country changes, fetch states for that country
    if (name === 'country') {
      console.log('Country changed, calling fetchStates with value:', value);
      fetchStates(value);
      // Reset state when country changes
      setRegForm(prev => ({ ...prev, state: '' }));
    }
    
    // Clear error when user starts typing
    if (regError) setRegError('');
  };

  // Clear any dark theme classes when login page loads
  useEffect(() => {
    // Remove dark theme classes from document
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    
    // Also remove from any parent containers
    const containers = document.querySelectorAll('.dark');
    containers.forEach(container => {
      container.classList.remove('dark');
    });
  }, []);

  // Use useEffect for navigation
  useEffect(() => {
    if (redirect) {
      navigate('/dashboard', { replace: true });
    }
  }, [redirect, navigate]);

  // if (redirect) {
  //   return null;
  // }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-poppins login-page"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="relative z-10 w-full max-w-md p-8 bg-white/95 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Company Logo" className="h-20 mb-4 drop-shadow-xl rounded-full bg-white/80 p-2" />
          <h2 className={`text-3xl font-extrabold tracking-tight mb-1 ${isLogin ? 'text-primary-dark' : 'text-green-700'}`}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-accent text-sm mb-2">{isLogin ? 'Sign in to your account' : 'Register to get started'}</p>
        </div>
        {isLogin ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-email" className="block text-primary-dark font-semibold mb-1">Email</label>
              <input 
                id="login-email"
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-primary-dark" 
                placeholder="Enter your email"
                aria-describedby="login-email-error"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#d1d5db',
                  color: '#1e40af'
                }}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-primary-dark font-semibold mb-1">Password</label>
              <input 
                id="login-password"
                name="password" 
                type="password" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-primary-dark" 
                placeholder="Enter your password"
                aria-describedby="login-password-error"
                style={{
                  backgroundColor: 'white',
                  borderColor: '#d1d5db',
                  color: '#1e40af'
                }}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition disabled:opacity-50" 
              disabled={loading}
              aria-describedby={loading ? "loading-status" : undefined}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {loading && <div id="loading-status" className="sr-only">Loading...</div>}
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label htmlFor="reg-name" className="block text-primary-dark font-semibold mb-1">Name</label>
              <input 
                id="reg-name"
                name="name" 
                value={regForm.name || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your name"
                aria-describedby="reg-name-error"
              />
            </div>
            <div>
              <label htmlFor="reg-contact" className="block text-primary-dark font-semibold mb-1">Contact No</label>
              <input 
                id="reg-contact"
                name="contact" 
                value={regForm.contact || ''} 
                onChange={handleRegChange} 
                type="tel"
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your contact number"
                aria-describedby="reg-contact-error"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-primary-dark font-semibold mb-1">Email</label>
              <input 
                id="reg-email"
                name="email" 
                value={regForm.email || ''} 
                onChange={handleRegChange} 
                type="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your email"
                aria-describedby="reg-email-error"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label htmlFor="reg-password" className="block text-primary-dark font-semibold mb-1">Password</label>
                <input 
                  id="reg-password"
                  name="password" 
                  value={regForm.password || ''} 
                  onChange={handleRegChange} 
                  type="password" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                  placeholder="Password"
                  aria-describedby="reg-password-error"
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="reg-confirm-password" className="block text-primary-dark font-semibold mb-1">Confirm Password</label>
                <input 
                  id="reg-confirm-password"
                  name="confirmPassword" 
                  value={regForm.confirmPassword || ''} 
                  onChange={handleRegChange} 
                  type="password" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                  placeholder="Confirm Password"
                  aria-describedby="reg-confirm-password-error"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-address" className="block text-primary-dark font-semibold mb-1">Address</label>
              <input 
                id="reg-address"
                name="address" 
                value={regForm.address || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your address"
                aria-describedby="reg-address-error"
              />
            </div>
            <div>
              <label htmlFor="reg-country" className="block text-primary-dark font-semibold mb-1">Country</label>
              <select 
                id="reg-country"
                name="country" 
                value={regForm.country || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark"
                aria-describedby="reg-country-error"
                disabled={loadingCountries}
              >
                <option value="">{loadingCountries ? 'Loading countries...' : 'Select Country'}</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reg-state" className="block text-primary-dark font-semibold mb-1">State</label>
              <select 
                id="reg-state"
                name="state" 
                value={regForm.state || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark"
                aria-describedby="reg-state-error"
                disabled={loadingStates || !regForm.country}
              >
                <option value="">
                  {!regForm.country ? 'Select Country First' : 
                   loadingStates ? 'Loading states...' : 'Select State'}
                </option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>{state.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reg-district" className="block text-primary-dark font-semibold mb-1">District</label>
              <input 
                id="reg-district"
                name="district" 
                value={regForm.district || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your district"
                aria-describedby="reg-district-error"
              />
            </div>
            <div>
              <label htmlFor="reg-city" className="block text-primary-dark font-semibold mb-1">City</label>
              <input 
                id="reg-city"
                name="city" 
                value={regForm.city || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your city"
                aria-describedby="reg-city-error"
              />
            </div>
            <div>
              <label htmlFor="reg-pincode" className="block text-primary-dark font-semibold mb-1">Pincode</label>
              <input 
                id="reg-pincode"
                name="pincode" 
                value={regForm.pincode || ''} 
                onChange={handleRegChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark" 
                placeholder="Enter your pincode"
                aria-describedby="reg-pincode-error"
              />
            </div>
            {regError && <div id="reg-error" className="text-red-500 text-sm text-center" role="alert">{regError}</div>}
            <button 
              type="submit" 
              className="w-full bg-green-600 text-white py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading}
              aria-describedby={loading ? "reg-loading-status" : undefined}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            {loading && <div id="reg-loading-status" className="sr-only">Loading...</div>}
          </form>
        )}
        {isLogin ? (
          <>
            <div className="mt-6 text-center">
              <a href="#" className="text-red-500 underline hover:underline text-sm">Forgot password?</a>
            </div>
            <div className="mt-2 text-center">
              <span className="text-gray-600 text-sm">Don't have an account? </span>
              <button type="button" className="text-green-700 underline hover:text-primary text-sm" onClick={() => setIsLogin(false)}>
                Register
              </button>
            </div>
          </>
        ) : (
          <div className="mt-2 text-center">
            <span className="text-gray-600 text-sm">Already have an account? </span>
            <button type="button" className="text-green-700 underline hover:text-primary text-sm" onClick={() => setIsLogin(true)}>
              Login
            </button>
          </div>
        )}
        <div className="mt-8 text-xs text-gray-500 text-center">
          {isLogin ? (
            <>By logging in, you agree to our <a href="#" className=" text-blue-500 underline hover:text-primary">Terms & Conditions</a>.</>
          ) : (
            <>By registering, you agree to our <a href="#" className=" text-blue-500 underline hover:text-primary">Terms & Conditions</a>.</>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} ETribe. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;