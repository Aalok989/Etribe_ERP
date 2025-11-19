import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { FiEdit2, FiTrash2, FiRefreshCw, FiSave, FiCreditCard, FiAlertCircle, FiCheckCircle, FiSettings, FiKey, FiPlus, FiX, FiStar } from "react-icons/fi";
import api from "../../api/axiosConfig";
import { toast } from 'react-toastify';
import { getAuthHeaders } from "../../utils/apiHeaders";

// Payment gateway logos mapping
const paymentLogos = {
  razorpay: "/src/assets/Razorpay.png",
  stripe: "/src/assets/Stripe.png",
  phonepe: "/src/assets/Phonepe.png",
};

// Default payment method structure
const defaultPaymentMethod = {
  id: null,
  name: "",
  logo: "",
  apiKey: "",
  merchantId: "",
  secretKey: "",
  isDefault: false,
};

export default function PaymentSettings() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [form, setForm] = useState(defaultPaymentMethod);
  const [logoPreview, setLogoPreview] = useState("");

  // Hardcoded default payment methods
  const getDefaultPaymentMethods = () => [
    {
      id: 1,
      name: "Razorpay",
      logo: "/src/assets/Razorpay.png",
      apiKey: "rzp_live_1234567890abcdef",
      merchantId: "MERCHANT123456",
      secretKey: "secret_key_abcdef1234567890",
      isDefault: true,
    },
    {
      id: 2,
      name: "Stripe",
      logo: "/src/assets/Stripe.png",
      apiKey: "sk_live_1234567890abcdefghij",
      merchantId: "acct_1234567890",
      secretKey: "sk_live_secret_abcdef123456",
      isDefault: false,
    },
    {
      id: 3,
      name: "PhonePe",
      logo: "/src/assets/Phonepe.png",
      apiKey: "phonepe_api_key_1234567890",
      merchantId: "MERCHANT_PHONEPE_123",
      secretKey: "phonepe_secret_key_abcdef",
      isDefault: false,
    },
  ];

  // Fetch payment methods from localStorage or use hardcoded defaults
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem('paymentMethods');
      if (stored) {
        try {
          const methods = JSON.parse(stored);
          setPaymentMethods(methods);
        } catch (e) {
          toast.warn('Stored payment methods were invalid. Loading defaults instead.');
          // If parsing fails, use default data
          const defaultMethods = getDefaultPaymentMethods();
          setPaymentMethods(defaultMethods);
          localStorage.setItem('paymentMethods', JSON.stringify(defaultMethods));
        }
      } else {
        // No stored data, use hardcoded defaults
        const defaultMethods = getDefaultPaymentMethods();
        setPaymentMethods(defaultMethods);
        localStorage.setItem('paymentMethods', JSON.stringify(defaultMethods));
      }
    } catch (err) {
      // Fallback to hardcoded defaults
      const defaultMethods = getDefaultPaymentMethods();
      setPaymentMethods(defaultMethods);
    } finally {
      setLoading(false);
    }
  };

  // Validate payment method
  const validatePaymentMethod = (method) => {
    const errors = [];

    if (!method.name || method.name.trim() === '') {
      errors.push('Payment Gateway Name is required');
    }

    if (!method.apiKey || method.apiKey.trim() === '') {
      errors.push('API Key is required');
    }

    if (!method.merchantId || method.merchantId.trim() === '') {
      errors.push('Merchant ID is required');
    }

    if (!method.secretKey || method.secretKey.trim() === '') {
      errors.push('Secret Key is required');
    }

    // Key validation
    const keyRegex = /^[a-zA-Z0-9_-]+$/;
    if (method.apiKey && !keyRegex.test(method.apiKey)) {
      errors.push('API Key should only contain letters, numbers, hyphens, and underscores');
    }

    if (method.merchantId && !keyRegex.test(method.merchantId)) {
      errors.push('Merchant ID should only contain letters, numbers, hyphens, and underscores');
    }

    // Length validation
    if (method.apiKey && method.apiKey.length < 10) {
      errors.push('API Key must be at least 10 characters long');
    }

    if (method.secretKey && method.secretKey.length < 10) {
      errors.push('Secret Key must be at least 10 characters long');
    }

    return errors;
  };

  // Save payment methods to localStorage
  const savePaymentMethodsToStorage = (methods) => {
    try {
      localStorage.setItem('paymentMethods', JSON.stringify(methods));
    } catch (err) {
      toast.error('Failed to save payment methods');
    }
  };

  // Save payment method (add or update)
  const savePaymentMethod = async (methodData) => {
    setSubmitting(true);
    try {
      // Validate method
      const validationErrors = validatePaymentMethod(methodData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      let updatedMethods = [...paymentMethods];

      if (methodData.id) {
        // Update existing method
        const index = updatedMethods.findIndex(m => m.id === methodData.id);
        if (index !== -1) {
          updatedMethods[index] = {
            ...methodData,
            logo: methodData.logo || paymentLogos[methodData.name?.toLowerCase()] || "",
          };
        }
      } else {
        // Add new method
        const newId = Math.max(...updatedMethods.map(m => m.id || 0), 0) + 1;
        updatedMethods.push({
          ...methodData,
          id: newId,
          logo: methodData.logo || paymentLogos[methodData.name?.toLowerCase()] || "",
        });
      }

      // If setting as default, unset other defaults
      if (methodData.isDefault) {
        updatedMethods = updatedMethods.map(m => ({
          ...m,
          isDefault: m.id === methodData.id || (methodData.id === null && m.id === updatedMethods[updatedMethods.length - 1]?.id) ? true : false
        }));
      }

      // Save to localStorage
      savePaymentMethodsToStorage(updatedMethods);
      setPaymentMethods(updatedMethods);

      toast.success(methodData.id ? 'Payment method updated successfully!' : 'Payment method added successfully!');
      setShowAddModal(false);
      setShowEditModal(false);
      setForm(defaultPaymentMethod);
      setLogoPreview("");
      return { success: true };
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
      
      // If deleted method was default and there are other methods, set first one as default
      if (updatedMethods.length > 0 && paymentMethods.find(m => m.id === methodId)?.isDefault) {
        updatedMethods[0].isDefault = true;
      }

      // Save to localStorage
      savePaymentMethodsToStorage(updatedMethods);
      setPaymentMethods(updatedMethods);

      toast.success('Payment method deleted successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Set default payment method
  const setDefaultMethod = async (methodId) => {
    try {
      const updatedMethods = paymentMethods.map(m => ({
        ...m,
        isDefault: m.id === methodId
      }));

      // Save to localStorage
      savePaymentMethodsToStorage(updatedMethods);
      setPaymentMethods(updatedMethods);

      toast.success('Default payment method updated!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Load payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAdd = () => {
    setForm(defaultPaymentMethod);
    setLogoPreview("");
    setShowAddModal(true);
  };

  const handleEdit = (method) => {
    setForm({
      id: method.id,
      name: method.name,
      logo: method.logo,
      apiKey: method.apiKey,
      merchantId: method.merchantId,
      secretKey: method.secretKey,
      isDefault: method.isDefault,
    });
    setLogoPreview(method.logo || "");
    setEditingMethod(method);
    setShowEditModal(true);
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setForm(defaultPaymentMethod);
    setLogoPreview("");
    setEditingMethod(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Auto-set logo based on name
    if (name === 'name' && value) {
      const logo = paymentLogos[value.toLowerCase()];
      if (logo) {
        setLogoPreview(logo);
        setForm(prev => ({ ...prev, logo: logo }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await savePaymentMethod(form);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      // Create a local URL for the image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoUrl = reader.result;
        setLogoPreview(logoUrl);
        setForm(prev => ({ ...prev, logo: logoUrl }));
        toast.success('Logo uploaded successfully!');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to upload logo');
    }
  };

  // Mask sensitive data
  const maskKey = (key) => {
    if (!key) return "Not configured";
    if (key.length <= 10) return key;
    return `${key.substring(0, 6)}${'*'.repeat(key.length - 10)}${key.substring(key.length - 4)}`;
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700">Loading payment methods...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const defaultMethod = paymentMethods.find(m => m.isDefault);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Payment Settings</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <FiPlus /> Add Payment Method
            </button>
            <button
              onClick={fetchPaymentMethods}
              className="flex items-center gap-2 bg-blue-500 text-white px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 transition"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Default Payment Method Card */}
        {defaultMethod && (
          <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="text-indigo-600 text-xl" />
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Default Payment Method</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FiStar className="text-yellow-500" />
                  <span>Active Default</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-green-50 dark:bg-green-900/40 p-4 rounded-lg border border-green-200 dark:border-green-700 mb-4">
                <h3 className="font-semibold text-green-700 dark:text-green-200 mb-2 flex items-center gap-2">
                  <FiSettings className="text-green-600 dark:text-green-200" />
                  Configuration Status
                </h3>
                <p className="text-sm text-green-600 dark:text-green-200">
                  Default payment method is configured and ready for use.
                </p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <FiCreditCard className="text-indigo-600" />
                    Gateway Configuration
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-3">
                      {defaultMethod.logo && (
                        <img
                          src={defaultMethod.logo}
                          alt={defaultMethod.name}
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{defaultMethod.name}</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Merchant ID</span>
                      <span className="text-gray-800 dark:text-gray-100 font-mono text-sm">{defaultMethod.merchantId || "Not configured"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <FiKey className="text-indigo-600" />
                    API Credentials
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600 dark:text-gray-300">API Key</span>
                      <span className="text-gray-800 dark:text-gray-100 font-mono text-sm">{maskKey(defaultMethod.apiKey)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Secret Key</span>
                      <span className="text-gray-800 dark:text-gray-100 font-mono text-sm">{maskKey(defaultMethod.secretKey)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Grid */}
        {!defaultMethod && paymentMethods.length > 0 && (
          <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="text-indigo-600 text-xl" />
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Payment Methods</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id || method.name}
                    className="rounded-lg shadow bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {method.logo && (
                    <img
                      src={method.logo}
                      alt={method.name}
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{method.name}</h3>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 px-2 py-1 rounded mt-1">
                        <FiStar className="text-yellow-500" />
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Merchant ID: </span>
                  <span className="font-mono text-gray-800 dark:text-gray-100">{method.merchantId || "Not configured"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">API Key: </span>
                  <span className="font-mono text-gray-800 dark:text-gray-100">{maskKey(method.apiKey)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Secret Key: </span>
                  <span className="font-mono text-gray-800 dark:text-gray-100">{maskKey(method.secretKey)}</span>
                </div>
              </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(method)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      {!method.isDefault && (
                        <>
                          <button
                            onClick={() => setDefaultMethod(method.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
                          >
                            <FiStar /> Set Default
                          </button>
                          <button
                            onClick={() => deletePaymentMethod(method.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition ml-auto"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Payment Methods (non-default) */}
        {defaultMethod && paymentMethods.filter(m => !m.isDefault).length > 0 && (
          <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <FiCreditCard className="text-indigo-600 text-xl" />
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Other Payment Methods</span>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.filter(m => !m.isDefault).map((method) => (
                  <div
                    key={method.id || method.name}
                    className="rounded-lg shadow bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {method.logo && (
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="h-12 w-auto object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{method.name}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Merchant ID: </span>
                        <span className="font-mono text-gray-800 dark:text-gray-100">{method.merchantId || "Not configured"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">API Key: </span>
                        <span className="font-mono text-gray-800 dark:text-gray-100">{maskKey(method.apiKey)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Secret Key: </span>
                        <span className="font-mono text-gray-800 dark:text-gray-100">{maskKey(method.secretKey)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(method)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        onClick={() => setDefaultMethod(method.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
                      >
                        <FiStar /> Set Default
                      </button>
                      <button
                        onClick={() => deletePaymentMethod(method.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition ml-auto"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {paymentMethods.length === 0 && !loading && (
          <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FiCreditCard className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Payment Methods Configured</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first payment method to get started</p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <FiPlus /> Add Payment Method
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {showAddModal ? 'Add Payment Method' : 'Edit Payment Method'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Form Header */}
                <div className="bg-yellow-50 dark:bg-yellow-900/40 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-200 mb-2 flex items-center gap-2">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-200" />
                    Payment Gateway Configuration
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-200 text-sm">Configure your payment gateway settings. Ensure all fields are properly configured for payment processing.</p>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <FiCreditCard className="text-indigo-600" />
                        Gateway Configuration
                      </h3>
                      <div className="space-y-4">
                        {/* Logo Preview */}
                        {logoPreview && (
                          <div className="flex items-center gap-4 mb-4">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-16 w-auto object-contain border border-gray-200 dark:border-gray-700 rounded p-2"
                            />
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Upload Logo
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/40 dark:file:text-indigo-300"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">Payment Gateway Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                            placeholder="Razorpay, Stripe, PhonePe, etc."
                            required
                            disabled={submitting}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The payment gateway service provider</p>
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">Merchant ID <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="merchantId"
                            value={form.merchantId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                            placeholder="merchant_id_123"
                            required
                            disabled={submitting}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your merchant ID from the payment gateway</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <FiKey className="text-indigo-600" />
                        API Credentials
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">API Key <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="apiKey"
                            value={form.apiKey}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                            placeholder="api_key_1234567890"
                            required
                            disabled={submitting}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your API key from the payment gateway</p>
                        </div>
                        <div>
                          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">Secret Key <span className="text-red-500">*</span></label>
                          <input
                            type="password"
                            name="secretKey"
                            value={form.secretKey}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                            placeholder="secret_key_1234567890"
                            required
                            disabled={submitting}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your secret key from the payment gateway (keep secure)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Set as Default */}
                {!showAddModal && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={form.isDefault}
                      onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400"
                      disabled={submitting}
                    />
                    <label htmlFor="isDefault" className="text-gray-700 dark:text-gray-200 font-medium">
                      Set as Default Payment Method
                    </label>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 sm:px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <FiSave /> {showAddModal ? 'Add Method' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
