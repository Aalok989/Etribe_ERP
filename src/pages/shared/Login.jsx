import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // Import custom Axios instance
import { getApiHeaders, getAuthHeaders } from '../../utils/apiHeaders';
import logo from '../../assets/Etribe-logo.jpg';
import bgImage from '../../assets/images/bg-login.jpg';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetForm, setResetForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    login: false,
    register: false,
    registerConfirm: false,
    reset: false,
    resetConfirm: false,
  });


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
      
      if (response.data && Array.isArray(response.data.data)) {
        // Transform the response to match expected format with id and name
        const transformedCountries = response.data.data.map((country, index) => ({
          id: index + 1, // Use index as id since API doesn't provide id
          name: country.country
        }));
      setCountries(transformedCountries);
    } else {
        setCountries([]);
      }
    } catch (error) {
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Fetch states based on selected country
  const fetchStates = async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }

    try {
      setLoadingStates(true);
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      // For now, hardcode India to test the API
      const countryName = 'India';
      
      const response = await api.post('/common/states', { country: countryName }, {
        headers: getApiHeaders()
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setStates(response.data.data);
      } else {
        setStates([]);
      }
    } catch (error) {
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
          toast.error('Server returned invalid response format. Please try again.');
          return;
        }
      }

      // Handle cases where backend wants user to change password first
      if (data?.status === 'change_password') {
        const pendingUser =
          data?.user_id ??
          data?.data?.id ??
          data?.data?.user_id ??
          data?.user?.id ??
          data?.user?.user_id;

        if (!pendingUser) {
          toast.error('Unable to start password reset. Missing user id.');
        } else {
          setResetUserId(String(pendingUser));
          setResetForm({ password: '', confirmPassword: '' });
          setResetError('');
          setShowResetModal(true);
          toast.warning(data?.message || 'Please set a new password to continue.');
        }
        setLoading(false);
        return;
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
        
        // Extract user_role_id from response
        const userRoleId = userData.user_role_id ?? data.user_role_id ?? userData.role_id ?? data.role_id;
        if (userRoleId) {
          localStorage.setItem('user_role_id', String(userRoleId));
        }
        
        // Determine user role based on user_role_id: if user_role_id !== 2, they can access admin pages
        let userRole = 'user';
        const roleId = userRoleId ? String(userRoleId) : null;
        
        // If user_role_id is not 2, they have admin access
        if (roleId && roleId !== '2') {
          userRole = 'admin';
        } else if (
          userData?.role === 'admin' ||
          userData?.user_type === 'admin' ||
          userData?.is_admin === true ||
          userData?.admin === true ||
          userData?.type === 'admin' ||
          userData?.user_role === 'admin'
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
        },50);
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
      const status = err.response?.status;
      const respData = err.response?.data;

      // Handle cases where response might contain PHP errors but still have valid data
      if (respData && typeof respData === 'object' && respData.token) {
        // If we somehow got a token despite an error, try to use it
        localStorage.setItem('token', respData.token);
        
        const userData = respData.data || respData.user || {};
        const uidCandidate = userData.id ?? userData.user_id ?? respData.user_id ?? respData.id;
        if (uidCandidate) {
          localStorage.setItem('uid', String(uidCandidate));
        }
        
        // Extract user_role_id from response
        const userRoleId = userData.user_role_id ?? respData.user_role_id ?? userData.role_id ?? respData.role_id;
        if (userRoleId) {
          localStorage.setItem('user_role_id', String(userRoleId));
        }
        
        // Determine user role based on user_role_id: if user_role_id !== 2, they can access admin pages
        let userRole = 'user';
        const roleId = userRoleId ? String(userRoleId) : null;
        
        // If user_role_id is not 2, they have admin access
        if (roleId && roleId !== '2') {
          userRole = 'admin';
        } else if (
          userData?.role === 'admin' ||
          userData?.user_type === 'admin' ||
          userData?.is_admin === true ||
          userData?.admin === true ||
          userData?.type === 'admin' ||
          userData?.user_role === 'admin'
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

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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
      
      const response = await api.post('/common/register', registrationData, {
        headers: getAuthHeaders()
      });
      
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
      setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetForm((prev) => ({ ...prev, [name]: value }));
    if (resetError) setResetError('');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (!resetUserId) {
      toast.error('Missing user id for password reset.');
      return;
    }

    if (!resetForm.password || !resetForm.confirmPassword) {
      setResetError('Please enter and confirm your new password.');
      return;
    }

    const passwordValidationError = validatePassword(resetForm.password);
    if (passwordValidationError) {
      setResetError(passwordValidationError);
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post(
        '/common/change_password',
        {
          id: resetUserId,
          password: resetForm.password,
          confirm_password: resetForm.confirmPassword,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response?.data?.status === 200 || response?.data?.status === 'success') {
        toast.success(response?.data?.message || 'Password updated. Please login.');
        setShowResetModal(false);
        setIsLogin(true);
        setResetForm({ password: '', confirmPassword: '' });
      } else {
        const backendMessage =
          response?.data?.message ||
          (Array.isArray(response?.data?.errors) ? response.data.errors.join(', ') : 'Failed to update password.');
        setResetError(backendMessage);
      }
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.join(', ')
          : 'Unable to update password. Please try again.');
      setResetError(backendMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegForm({ ...regForm, [name]: value });
    
    // If country changes, fetch states for that country
    if (name === 'country') {
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
              <div className="relative">
                <input 
                  id="login-password"
                  name="password" 
                  type={passwordVisibility.login ? 'text' : 'password'} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-primary-dark pr-12" 
                  placeholder="Enter your password"
                  aria-describedby="login-password-error"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#d1d5db',
                    color: '#1e40af'
                  }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('login')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                  aria-label={passwordVisibility.login ? 'Hide password' : 'Show password'}
                >
                  {passwordVisibility.login ? (
                    <AiOutlineEyeInvisible className="h-5 w-5" />
                  ) : (
                    <AiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
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
                <div className="relative">
                  <input 
                    id="reg-password"
                    name="password" 
                    value={regForm.password || ''} 
                    onChange={handleRegChange} 
                    type={passwordVisibility.register ? 'text' : 'password'} 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark pr-12" 
                    placeholder="Password"
                    aria-describedby="reg-password-error"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('register')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
                    aria-label={passwordVisibility.register ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.register ? (
                      <AiOutlineEyeInvisible className="h-5 w-5" />
                    ) : (
                      <AiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="w-1/2">
                <label htmlFor="reg-confirm-password" className="block text-primary-dark font-semibold mb-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    id="reg-confirm-password"
                    name="confirmPassword" 
                    value={regForm.confirmPassword || ''} 
                    onChange={handleRegChange} 
                    type={passwordVisibility.registerConfirm ? 'text' : 'password'} 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-primary-dark pr-12" 
                    placeholder="Confirm Password"
                    aria-describedby="reg-confirm-password-error"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('registerConfirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
                    aria-label={passwordVisibility.registerConfirm ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility.registerConfirm ? (
                      <AiOutlineEyeInvisible className="h-5 w-5" />
                    ) : (
                      <AiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
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
            {regError && <div id="reg-error" className="text-green-500 text-sm text-center" role="alert">{regError}</div>}
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
            {/* <div className="mt-6 text-center">
              <a href="#" className="text-red-500 underline hover:underline text-sm">Forgot password?</a>
            </div> */}
            {/* <div className="mt-2 text-center">
              <span className="text-gray-600 text-sm">Don't have an account? </span>
              <button type="button" className="text-green-700 underline hover:text-primary text-sm" onClick={() => setIsLogin(false)}>
                Register
              </button>
            </div> */}
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
      {showResetModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <form
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative"
            onSubmit={handleResetSubmit}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
              aria-label="Close reset password modal"
              onClick={() => {
                setShowResetModal(false);
                setResetForm({ password: '', confirmPassword: '' });
                setResetError('');
              }}
            >
              ✕
            </button>
            <h3 className="mb-1 text-center text-2xl font-bold text-primary-dark">Update Password</h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              Enter the temporary password sent to your email and create a new one.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-password" className="mb-1 block text-sm font-semibold text-primary-dark">
                  New Password
                </label>
                <input
                  id="reset-password"
                  name="password"
                  type="password"
                  value={resetForm.password}
                  onChange={handleResetChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="mb-1 block text-sm font-semibold text-primary-dark"
                >
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={handleResetChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              {resetError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {resetError}
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-60"
                disabled={resetLoading}
              >
                {resetLoading ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;