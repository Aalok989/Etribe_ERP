import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { FiSearch, FiRefreshCw, FiDownload, FiEye, FiEdit2, FiFilter, FiCopy, FiFile, FiChevronDown, FiChevronLeft, FiChevronRight, FiUsers, FiArrowUp, FiArrowDown, FiPhone, FiMail, FiHome, FiX, FiCalendar, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { usePermissions } from "../../context/PermissionContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PhonepeLogo from "../../assets/Phonepe.png";
import RazorpayLogo from "../../assets/Razorpay.png";
import StripeLogo from "../../assets/Stripe.png";

// Cache for additional fields to avoid repeated API calls
let additionalFieldsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch additional fields from backend
const fetchAdditionalFields = async () => {
  try {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');

    if (!token || !uid) {
      return [];
    }

    const response = await api.post('/groupSettings/get_user_additional_fields', {}, {
      headers: getAuthHeaders()
    });

    const backendData = response.data?.data || response.data || {};
    
    let mappedFields = [];
    
    if (Array.isArray(backendData)) {
      mappedFields = backendData
        .filter(field => field && (field.name || field.label || field.value || field))
        .map((field, index) => ({
          id: index + 1,
          name: field.name || field.label || field.value || field || `Field ${index + 1}`,
          key: `additionalField${index + 1}`,
          backendKey: `ad${index + 1}` || `field${index + 1}`
        }));
    } else {
      mappedFields = Object.keys(backendData)
        .filter(key => backendData[key] && backendData[key].trim() !== '')
        .map((key, index) => ({
          id: index + 1,
          name: backendData[key],
          key: key,
          backendKey: key
        }));
    }

    return mappedFields;
  } catch (err) {
    return [];
  }
};

// Get table headers for member pages
const getMemberTableHeaders = (additionalFields = []) => {
  return [
    { key: 'sr', name: 'SR No', sortable: true, width: '60px' },
    { key: 'name', name: 'Name', sortable: true, width: '120px' },
    { key: 'contact', name: 'Contact', sortable: true, width: '120px' },
    { key: 'email', name: 'Email', sortable: true, width: '180px' },
    { key: 'company', name: 'Company Name', sortable: true, width: '150px' },
    { key: 'actions', name: 'Actions', sortable: false, width: '120px' }
  ];
};

// Get mobile card fields for member pages
const getMemberCardFields = (additionalFields = []) => {
  return additionalFields.map(field => ({
    key: field.key,
    name: field.name,
    backendKey: field.backendKey
  }));
};

export default function PendingApproval() {
  const navigate = useNavigate();
  
  // Get permissions for Membership Management module (module_id: 9)
  const { hasPermission } = usePermissions();
  const MEMBERSHIP_MANAGEMENT_MODULE_ID = 9;
  const canView = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'view');
  const canAdd = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'add');
  const canEdit = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'edit');
  const canDelete = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'delete');
  
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [modifyMember, setModifyMember] = useState(null);
  const [form, setForm] = useState({ 
    plan: "", 
    startDate: "", // Date field (calendar) - not sent to backend
    paymentMode: "", 
    bankName: "", 
    price: "", 
    validUpto: "", // Valid upto field (calculated) - sent to backend as valid_upto
    chequeNo: "",
    chequeImg: null,
    chequeAmount: "",
    chequeDate: "" // Added chequeDate
  });
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  // Default sort by created_at or id, descending
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [additionalFields, setAdditionalFields] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [cardFields, setCardFields] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState("");

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  // Load additional fields for dynamic headers
  const loadAdditionalFields = async () => {
    setTableHeaders(getMemberTableHeaders());
  };

  // Fetch plans for dropdown with real-time functionality
  function useMembershipPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    
      const fetchPlans = async () => {
        try {
        setLoading(true);
          const token = localStorage.getItem('token');
          const uid = localStorage.getItem('uid');
        
        if (!token || !uid) {
          return;
        }
        
          const response = await api.get('/groupSettings/get_membership_plans', {
            headers: getAuthHeaders()
          });
        
          const plansData = Array.isArray(response.data?.data) ? response.data.data : [];
          setPlans(plansData);
      } catch (error) {
        toast.error('Failed to load membership plans');
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      fetchPlans();
    }, []);
    
    return { plans, loading, refetch: fetchPlans };
  }

  // Fetch payment modes for dropdown
  function usePaymentModes() {
    const [paymentModes, setPaymentModes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPaymentModes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        
        if (!token || !uid) {
          return;
        }
        
        const response = await api.get('/payment_detail/getmodes', {
          headers: getAuthHeaders()
        });
        
        // Handle different possible response structures
        let modesData = [];
        if (Array.isArray(response.data?.data)) {
          modesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          modesData = response.data;
        } else if (response.data?.data && typeof response.data.data === 'object') {
          // If data is an object, convert to array
          modesData = Object.entries(response.data.data).map(([key, value]) => ({
            id: key,
            mode_name: value
          }));
        }
        
        setPaymentModes(modesData);
      } catch (error) {
        toast.error('Failed to load payment modes');
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      fetchPaymentModes();
    }, []);
    
    return { paymentModes, loading, refetch: fetchPaymentModes };
  }

  // Fetch bank details for dropdown
  function useBankDetails() {
    const [bankDetails, setBankDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchBankDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        
        if (!token || !uid) {
          return;
        }
        
        const response = await api.get('/payment_detail/getbankdetails', {
          headers: getAuthHeaders()
        });
        
        // Handle different possible response structures
        let bankData = [];
        if (Array.isArray(response.data?.data)) {
          bankData = response.data.data;
        } else if (Array.isArray(response.data)) {
          bankData = response.data;
        } else if (response.data?.data && typeof response.data.data === 'object') {
          // If data is an object, convert to array
          bankData = Object.entries(response.data.data).map(([key, value]) => ({
            id: key,
            bank_name: value
          }));
        }
        
        setBankDetails(bankData);
      } catch (error) {
        toast.error('Failed to load bank details');
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      fetchBankDetails();
    }, []);
    
    return { bankDetails, loading, refetch: fetchBankDetails };
  }

  const { plans, loading: plansLoading, refetch: refetchPlans } = useMembershipPlans();
  const { paymentModes, loading: paymentModesLoading, refetch: refetchPaymentModes } = usePaymentModes();
  const { bankDetails, loading: bankDetailsLoading, refetch: refetchBankDetails } = useBankDetails();



  // Load additional fields on component mount
  useEffect(() => {
    loadAdditionalFields();
  }, []);

  useEffect(() => {
    const fetchPendingApprovalMembers = async (isFirst = false) => {
      if (isFirst) setLoading(true);
      // No need to clear error/success with toast
      try {
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        if (!token) {
          toast.error('Please log in to view pending approval members');
          window.location.href = '/';
          return;
        }
        const response = await api.post('/userDetail/not_members', { uid }, {
          headers: {
            'token': token,
            'uid': uid,
          }
        });
        const membersData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setMembers(membersData);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to fetch pending approval members');
      } finally {
        if (isFirst) setLoading(false);
        if (isFirst) setFirstLoad(false);
      }
    };
    fetchPendingApprovalMembers(true); // Initial load
    // Removed setInterval for auto-refresh
    // Only call fetchPendingApprovalMembers after CRUD operations
  }, []);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = [...members].sort((a, b) => {
    let aValue = a[sortField] || a["id"] || '';
    let bValue = b[sortField] || b["id"] || '';
    // If sorting by date or id, sort numerically/chronologically
    if (sortField === "created_at" || sortField === "date" || sortField === "datetime" || sortField === "updated_at" || sortField === "id") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
      if (isNaN(aValue)) aValue = 0;
      if (isNaN(bValue)) bValue = 0;
      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    } else {
      // Fallback to string comparison
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
  });

  // Filter by name
  const filtered = sortedData.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIdx, startIdx + entriesPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const handleEntriesChange = e => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const openModify = (member) => {
    if (!canEdit) {
      toast.error('You do not have permission to modify Members.');
      return;
    }
    setModifyMember(member);
    // Set today's date as default for startDate (calendar date field)
    const today = new Date().toISOString().split('T')[0];
    const initialForm = {
      plan: "",
      startDate: today,
      paymentMode: "",
      bankName: "",
      price: "",
      validUpto: "",
      chequeNo: "",
      chequeImg: null,
      chequeAmount: "" // Added chequeAmount
    };
    setForm(initialForm);
    setSelectedGateway("");
  };

  const closeModify = () => {
    setModifyMember(null);
    setForm({ 
      plan: "", 
      startDate: "", 
      paymentMode: "", 
      bankName: "", 
      price: "", 
      validUpto: "",
      chequeNo: "",
      chequeImg: null,
      chequeAmount: "" // Added chequeAmount
    });
    setUpdateError(null);
    setUpdateSuccess(null);
    setSelectedGateway("");
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    // Clear error when user makes changes
    if (updateError) {
      setUpdateError(null);
    }
    
    if (type === 'file') {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      if (name === 'paymentMode') {
        setSelectedGateway("");
        setForm(prev => ({ ...prev, [name]: value }));
      } else if (name === 'plan') {
        // When membership plan is selected, auto-fill price and valid till
        const selectedPlan = plans.find(plan => plan.id == value);
          
          if (selectedPlan) {
            // Try multiple possible field names for price and validity
            const planPrice = selectedPlan.price || selectedPlan.plan_price || selectedPlan.cost || selectedPlan.amount || '';
            const planValidity = selectedPlan.plan_validity || selectedPlan.valid_till || selectedPlan.validity || selectedPlan.duration || selectedPlan.valid_upto || selectedPlan.valid_until || selectedPlan.period || '';
            

          
          // Calculate valid upto date based on startDate (or today if not set) + plan validity
          let calculatedValidUpto = '';
          if (planValidity) {
            try {
              // Use startDate if available, otherwise use today
              const baseDate = form.startDate ? new Date(form.startDate) : new Date();
              const validityText = planValidity.toString().toLowerCase();
              
              // If it's just a number (like "1"), assume it's months
              if (validityText.includes('year') || validityText.includes('yr')) {
                const years = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setFullYear(baseDate.getFullYear() + years);
              } else if (validityText.includes('month') || validityText.includes('mon')) {
                const months = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setMonth(baseDate.getMonth() + months);
              } else if (validityText.includes('day')) {
                const days = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setDate(baseDate.getDate() + days);
              } else {
                // If just a number (like "1"), assume it's months
                const months = parseInt(validityText);
                if (!isNaN(months)) {
                  baseDate.setMonth(baseDate.getMonth() + months);
                }
              }
              
              calculatedValidUpto = baseDate.toISOString().split('T')[0];
            } catch (error) {
              calculatedValidUpto = planValidity; // Fallback to original value
            }
          }
          
                      setForm(prev => ({
              ...prev,
              [name]: value,
              price: planPrice,
              validUpto: calculatedValidUpto
            }));
        } else {
          setForm(prev => ({ ...prev, [name]: value }));
        }
      } else {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setForm(prev => ({ ...prev, startDate: selectedDate }));
    
    // Clear error when user makes changes
    if (updateError) {
      setUpdateError(null);
    }
    
    // If we have a selected plan, recalculate the valid upto based on the selected date
    if (form.plan) {
      const selectedPlan = plans.find(plan => plan.id == form.plan);
      if (selectedPlan) {
        const planValidity = selectedPlan.plan_validity || selectedPlan.valid_till || selectedPlan.validity || selectedPlan.duration || selectedPlan.valid_upto || selectedPlan.valid_until || selectedPlan.period || '';
        
        if (planValidity) {
          try {
            // Use the selected date as base instead of today
            const baseDate = new Date(selectedDate);
            const validityText = planValidity.toString().toLowerCase();
            
            // If it's just a number (like "1"), assume it's months
            if (validityText.includes('year') || validityText.includes('yr')) {
              const years = parseInt(validityText.match(/\d+/)?.[0] || 1);
              baseDate.setFullYear(baseDate.getFullYear() + years);
            } else if (validityText.includes('month') || validityText.includes('mon')) {
              const months = parseInt(validityText.match(/\d+/)?.[0] || 1);
              baseDate.setMonth(baseDate.getMonth() + months);
            } else if (validityText.includes('day')) {
              const days = parseInt(validityText.match(/\d+/)?.[0] || 1);
              baseDate.setDate(baseDate.getDate() + days);
            } else {
              // If just a number (like "1"), assume it's months
              const months = parseInt(validityText);
              if (!isNaN(months)) {
                baseDate.setMonth(baseDate.getMonth() + months);
              }
            }
            
            const calculatedValidUpto = baseDate.toISOString().split('T')[0];
            setForm(prev => ({ ...prev, validUpto: calculatedValidUpto }));
          } catch (error) {
          }
        }
      }
    }
  };

  const activateMembership = async ({ company_detail_id, membership_plan_id, valid_upto }) => {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');
    if (!token || !uid) {
      throw new Error('Authentication required');
    }
    const payload = {
      company_detail_id: String(company_detail_id),
      membership_plan_id: String(membership_plan_id),
      valid_upto: valid_upto,
    };
    const response = await api.post('/UserDetail/activate_membership', payload, {
      headers: getAuthHeaders(),
      timeout: 15000,
    });
    return response.data;
  };

  // Add a function to call the payment_detail/add API
  const addPaymentDetail = async (payload, isCheque) => {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');
    if (!token || !uid) {
      throw new Error('Authentication required');
    }
    
    let data;
    let headers = getAuthHeaders();
    
    // if (isCheque) {
      data = new FormData();
      data.append('company_detail_id', String(payload.company_detail_id));
      data.append('payment_mode', payload.payment_mode);
      data.append('bank_id', String(payload.bank_id));
      data.append('cheque_amount', String(payload.cheque_amount));
      data.append('cheque_no', String(payload.cheque_no));
      data.append('cheque_date', payload.cheque_date);
      if (payload.valid_upto) data.append('valid_upto', payload.valid_upto);
      if (payload.file) data.append('file', payload.file);
      if (payload.razorpay_order_id) data.append('razorpay_order_id', payload.razorpay_order_id);
      if (payload.razorpay_payment_id) data.append('razorpay_payment_id', payload.razorpay_payment_id);
      // Remove content-type for FormData
      delete headers['Content-Type'];
    // } else {
    //   // For non-cheque payment modes, send plan price as cheque_amount only
    //   data = {
    //     company_detail_id: String(payload.company_detail_id),
    //     payment_mode: payload.payment_mode,
    //     bank_id: String(payload.bank_id),
    //     cheque_amount: String(payload.cheque_amount), // This is the plan price
    //   };
    // }
    
    const response = await api.post('/payment_detail/add', data, {
      headers,
      timeout: 15000,
    });
    return response.data;
  };

  // Create Razorpay order via backend API
  const createRazorpayOrder = async (amount, currency = 'INR') => {
    try {
      const response = await api.post('/payment/razorpay/create-order', {
        amount: Math.round(amount * 100), // Convert to paise (Razorpay expects amount in smallest currency unit)
        currency: currency,
        company_detail_id: modifyMember?.company_detail_id || modifyMember?.id,
        plan_id: form.plan,
        valid_upto: form.validUpto
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data && (response.data.order_id || response.data.id)) {
        return {
          orderId: response.data.order_id || response.data.id,
          amount: response.data.amount,
          currency: response.data.currency || currency
        };
      }
      throw new Error('Failed to create Razorpay order');
    } catch (error) {
      throw new Error('Razorpay order creation failed. Please configure the backend API endpoint: /payment/razorpay/create-order');
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      const selectedPlan = plans.find(plan => plan.id == form.plan);
      const amount = selectedPlan ? parseFloat(selectedPlan.price || selectedPlan.plan_price || selectedPlan.cost || selectedPlan.amount || 0) : 0;
      
      if (amount <= 0) {
        setUpdateError('Invalid payment amount. Please select a valid membership plan.');
        setUpdateLoading(false);
        return;
      }

      const orderData = await createRazorpayOrder(amount);
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
      
      if (!window.Razorpay) {
        setUpdateError('Razorpay checkout script not loaded. Please refresh the page.');
        setUpdateLoading(false);
        return;
      }

      const userName = modifyMember?.name || localStorage.getItem('userName') || 'User';
      const userEmail = modifyMember?.email || localStorage.getItem('userEmail') || '';
      const userPhone = modifyMember?.phone_num || modifyMember?.phone || modifyMember?.contact || '';

      const options = {
        key: razorpayKey,
        amount: orderData.amount || Math.round(amount * 100),
        currency: orderData.currency || 'INR',
        name: 'ETribe Membership',
        description: `Membership Plan Payment - ${selectedPlan?.plan_name || selectedPlan?.name || 'Plan'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              company_detail_id: modifyMember?.company_detail_id || modifyMember?.id,
              plan_id: form.plan,
              amount: amount,
              valid_upto: form.validUpto
            }, {
              headers: getAuthHeaders()
            });

            if (verifyResponse.data && (verifyResponse.data.status === true || verifyResponse.data.success === true)) {
              const paymentModeString = `${selectedPaymentModeName} - Razorpay`;
              const paymentPayload = {
                company_detail_id: modifyMember?.company_detail_id || modifyMember?.id,
                payment_mode: paymentModeString,
                bank_id: '',
                cheque_amount: amount.toString(),
                cheque_no: response.razorpay_payment_id,
                cheque_date: '',
                file: undefined,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                valid_upto: form.validUpto, // Use the calculated Valid upto field
              };

              await addPaymentDetail(paymentPayload, false);
              
              toast.success('Payment completed successfully via Razorpay!');
              setMembers(prevMembers => prevMembers.filter(member => member.id !== modifyMember.id));
              navigate('/members-services/payment-details');
              closeModify();
              setUpdateError(null);
              setUpdateSuccess(null);
              setUpdateLoading(false);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (verifyError) {
            toast.error('Payment verification failed. Please contact support.');
            setUpdateError('Payment verification failed. Please contact support.');
            setUpdateLoading(false);
          }
        },
        prefill: { name: userName, email: userEmail, contact: userPhone },
        theme: { color: '#6366f1' },
        modal: { ondismiss: function() { setUpdateLoading(false); setUpdateError(null); toast.info('Payment cancelled'); } }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setUpdateError(error.message || 'Failed to initiate Razorpay payment. Please try again.');
      toast.error(error.message || 'Failed to initiate Razorpay payment.');
      setUpdateLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!modifyMember) return;
    if (!canEdit) {
      toast.error('You do not have permission to update Members.');
      return;
    }
    // Validation
    if (!form.paymentMode) {
      setUpdateError('Please select a payment mode.');
      return;
    }
    if (!form.plan) {
      setUpdateError('Please select a membership plan.');
      return;
    }
    if (!form.validUpto) {
      setUpdateError('Please select a membership plan to calculate valid upto date.');
      return;
    }
    // Check if valid upto date is in future
    const validUptoDate = new Date(form.validUpto);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validUptoDate <= today) {
      setUpdateError('Valid upto date must be in the future. Please select a membership plan.');
      return;
    }
    
    // Check if Payment Gateway is selected but no gateway is chosen
    const isPaymentGateway = selectedPaymentModeName && (
      selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
      selectedPaymentModeName.toLowerCase().includes('gateway') ||
      selectedPaymentModeName.toLowerCase() === 'paymentgateway'
    );
    
    if (isPaymentGateway && !selectedGateway) {
      setUpdateError('Please select a payment gateway (PhonePe, Razorpay, or Stripe).');
      return;
    }
    
    // Validate bank name for non-gateway payments (except Cash)
    const isCash = selectedPaymentModeName && selectedPaymentModeName.toLowerCase() === 'cash';
    if (!isPaymentGateway && !isCash && !form.bankName) {
      setUpdateError('Please select a bank name.');
      return;
    }
    
    // If Payment Gateway with Razorpay is selected, handle Razorpay payment flow
    if (isPaymentGateway && selectedGateway === 'Razorpay') {
      setUpdateLoading(true);
      setUpdateError(null);
      setUpdateSuccess(null);
      await handleRazorpayPayment();
      return;
    }
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      // 1. Activate membership
      await activateMembership({
        company_detail_id: modifyMember.company_detail_id || modifyMember.id,
        membership_plan_id: form.plan, // Use the selected plan's ID
        valid_upto: form.validUpto,
      });
      // 2. Add payment detail
      const isCheque = selectedPaymentModeName && selectedPaymentModeName.toLowerCase() === 'cheque';
      const selectedPlan = plans.find(plan => plan.id == form.plan);
      const paymentModeString = isPaymentGateway ? `${selectedPaymentModeName} - ${selectedGateway}` : selectedPaymentModeName;
      const paymentPayload = {
        company_detail_id: modifyMember.company_detail_id || modifyMember.id,
        payment_mode: paymentModeString,
        bank_id: form.bankName || '',
        cheque_amount: isCheque ? form.chequeAmount : (!isCheque && selectedPlan ? (selectedPlan.price || selectedPlan.plan_price || selectedPlan.cost || selectedPlan.amount || '') : undefined),
        cheque_no: isCheque ? form.chequeNo : undefined,
        cheque_date: isCheque ? form.chequeDate : undefined,
        file: isCheque ? form.chequeImg : undefined,
        valid_upto: form.validUpto, // Use the calculated Valid upto field
      };
      await addPaymentDetail(paymentPayload, isCheque);
      toast.success('Membership activated and payment recorded successfully!');
      setMembers(prevMembers => prevMembers.filter(member => member.id !== modifyMember.id));
      navigate('/members-services/payment-details'); // Redirect to Payment Details page
      closeModify();
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Failed to activate membership or record payment';
        setUpdateError(errorMessage);
        toast.error(errorMessage);
      } else if (err.request) {
        setUpdateError('Network error. Please check your connection.');
        toast.error('Network error. Please check your connection.');
      } else {
        setUpdateError('Failed to activate membership or record payment. Please try again.');
        toast.error('Failed to activate membership or record payment.');
      }
      closeModify();
    } finally {
      setUpdateLoading(false);
    }
  };

  // Export Handlers
  const handleExportCSV = () => {
    if (!members.length) return;
    const headers = ['SR No', 'Name', 'Contact', 'Email', 'Company Name'];
    const rows = members.map((m, index) => [
      index + 1,
      m.name,
      m.phone_num || m.contact,
      m.email,
      m.company_name || m.company
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
            link.setAttribute("download", "pending_approval_members.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Members exported to CSV!");
  };

  const handleExportExcel = () => {
    if (!members.length) return;
    const exportData = members.map((m, index) => ({
      'SR No': index + 1,
      'Name': m.name,
      'Contact': m.phone_num || m.contact,
      'Email': m.email,
      'Company Name': m.company_name || m.company
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Pending Approval Members");
      XLSX.writeFile(wb, "pending_approval_members.xlsx");
    toast.success("Members exported to Excel!");
  };

  const handleExportPDF = () => {
    if (!members.length) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const headers = [['SR No', 'Name', 'Contact', 'Email', 'Company Name']];
    const rows = members.map((m, index) => [
      index + 1,
      m.name,
      m.phone_num || m.contact,
      m.email,
      m.company_name || m.company
    ]);
    try {
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      doc.save("pending_approval_members.pdf");
      toast.success("Members exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  const handleCopyToClipboard = () => {
    if (!members.length) return;
    const data = members.map((m, index) => 
      `${index + 1}. ${m.name}, ${m.phone_num || m.contact}, ${m.email}, ${m.company_name || m.company}`
    ).join('\n');
    navigator.clipboard.writeText(data);
    toast.success("All members copied to clipboard!");
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchPendingApprovalMembers();
  };

  if (loading && firstLoad) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading pending approval members...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only show full-screen error if there's an error AND the modal is not open
  // Validation errors should only appear in the modal
  if (updateError && !modifyMember) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-2 text-red-500">
            <FiAlertCircle />
            <p className="dark:text-red-300">{updateError}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Helper to get selected payment mode display name
  const selectedPaymentModeName = paymentModes.find(
    mode => (mode.id || mode.mode_id || mode) == form.paymentMode
  )?.mode_name || paymentModes.find(
    mode => (mode.id || mode.mode_id || mode) == form.paymentMode
  )?.name || paymentModes.find(
    mode => (mode.id || mode.mode_id || mode) == form.paymentMode
  )?.mode || form.paymentMode;
  const normalizedSelectedPaymentMode = (selectedPaymentModeName || "")
    .toString()
    .toLowerCase();
  const isGatewayModeSelected =
    normalizedSelectedPaymentMode === "payment gateway" ||
    normalizedSelectedPaymentMode.includes("gateway") ||
    normalizedSelectedPaymentMode === "paymentgateway";
  const isCashModeSelected = normalizedSelectedPaymentMode === "cash";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Pending Approval</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="text-indigo-600" />
            <span>Total Pending Approval: {members.length}</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
            />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {startIdx + 1} to {Math.min(startIdx + entriesPerPage, totalEntries)} of {totalEntries} entries</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">
              <button 
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={handleRefresh}
                title="Refresh Data"
              >
                <FiRefreshCw /> 
                <span>Refresh</span>
              </button>
              
              {/* Desktop Export Buttons - Show on larger screens */}
              <div className="hidden xl:flex gap-2">
              <button 
                className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                onClick={handleCopyToClipboard}
                title="Copy to Clipboard"
              >
                  <FiCopy /> 
                  Copy
              </button>
                
              <button 
                className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                onClick={handleExportCSV}
                title="Export CSV"
              >
                  <FiDownload /> 
                  CSV
              </button>
                
              <button 
                className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                onClick={handleExportExcel}
                title="Export Excel"
              >
                  <FiFile /> 
                  Excel
              </button>
                
              <button 
                className="flex items-center gap-1 bg-rose-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
                onClick={handleExportPDF}
                title="Export PDF"
              >
                  <FiFile /> 
                  PDF
              </button>
            </div>
              
              {/* Mobile/Tablet Export Dropdown - Show on smaller screens */}
              <div className="relative xl:hidden">
                <button
                  className="flex items-center gap-1 bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                >
                  <FiDownload />
                  <span>Export</span>
                  <FiChevronDown className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-32 export-dropdown">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      onClick={() => {
                        handleCopyToClipboard();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiCopy className="text-gray-500" />
                      Copy
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        handleExportCSV();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiDownload className="text-green-500" />
                      CSV
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        handleExportExcel();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiFile className="text-emerald-500" />
                      Excel
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      onClick={() => {
                        handleExportPDF();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiFile className="text-rose-500" />
                      PDF
                    </button>
                    </div>
                      )}
                    </div>
                    </div>
                    </div>
          
          {/* Table - Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                  {tableHeaders.map((header, index) => (
                    <th 
                      key={header.key}
                      className={`p-3 font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap ${
                        header.sortable ? '' : 'cursor-default'
                      }`}
                      onClick={() => header.sortable && handleSort(header.key)}
                      style={{ minWidth: header.width, width: header.width }}
                  >
                    <div className="flex items-center gap-1">
                        {header.name}
                        {header.sortable && (
                          <div className="flex flex-col">
                            <span className={`text-xs ${sortField === header.key && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                            <span className={`text-xs ${sortField === header.key && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                    </div>
                      )}
                    </div>
                  </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m, idx) => (
                  <tr 
                    key={m.id} 
                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'
                    } hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}
                  >
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">
                      {startIdx + idx + 1}
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{m.phone_num || m.contact}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{m.email}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{m.company_name || m.company}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                          title="View Member"
                          onClick={() => navigate(`/admin/member-detail/${m.id || m.user_detail_id || m.company_detail_id}`)}
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                          title="Activate Membership"
                          onClick={() => openModify(m)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 sm:p-6 space-y-4">
            {paginated.map((m, idx) => (
              <div key={m.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Member #{startIdx + idx + 1}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{m.company_name || m.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors p-1"
                      onClick={() => navigate(`/admin/member-detail/${m.id || m.user_detail_id || m.company_detail_id}`)}
                      title="View Member"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors p-1"
                      onClick={() => openModify(m)}
                      title="Activate Membership"
                    >
                      <FiEdit2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400 flex-shrink-0" size={14} />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{m.phone_num || m.contact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400 flex-shrink-0" size={14} />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{m.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls - moved outside scrollable area */}
          <div className="flex flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                <select
                className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={entriesPerPage}
                  onChange={handleEntriesChange}
                >
                  {[5, 10, 25, 50, 100].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries per page</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Previous"
                >
                  <FiChevronLeft size={16} />
                </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Next"
                >
                  <FiChevronRight size={16} />
                </button>
            </div>
          </div>
        </div>
        
        {/* Activate Membership Modal */}
        {modifyMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[#202123] rounded-xl shadow-xl dark:shadow-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Activate Membership</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={closeModify}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    *Payment Mode
                  </label>
                  <select
                    name="paymentMode"
                    value={form.paymentMode || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Payment Mode"
                    required
                    disabled={paymentModesLoading}
                  >
                    <option value="">
                      {paymentModesLoading ? 'Loading payment modes...' : 'Payment Mode'}
                    </option>
                    {paymentModes.map(mode => {
                      // Handle different possible data structures
                      const modeId = mode.id || mode.mode_id || mode;
                      const modeName = mode.mode_name || mode.name || mode.mode || mode;
                      
                      // Ensure we have a string for display
                      const displayName = typeof modeName === 'string' ? modeName : JSON.stringify(modeName);
                      
                      return (
                        <option key={modeId} value={modeId}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  {paymentModesLoading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Loading payment modes...
                    </p>
                  )}
                  {!paymentModesLoading && paymentModes.length === 0 && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      No payment modes available
                    </p>
                  )}
                </div>
                {(selectedPaymentModeName && selectedPaymentModeName.toLowerCase() === 'cheque') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cheque Number
                      </label>
                      <input
                        type="text"
                        name="chequeNo"
                        value={form.chequeNo}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Enter Cheque Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cheque Amount
                      </label>
                      <input
                        type="number"
                        name="chequeAmount"
                        value={form.chequeAmount}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Enter Cheque Amount"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cheque Date
                      </label>
                      <input
                        type="date"
                        name="chequeDate"
                        value={form.chequeDate}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Cheque Image
                      </label>
                      <input
                        type="file"
                        name="chequeImg"
                        accept="image/*"
                        onChange={e => setForm(prev => ({ ...prev, chequeImg: e.target.files[0] }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </>
                )}

                {/* Bank Name - Hidden for Payment Gateway or Cash selections */}
                {selectedPaymentModeName && !isGatewayModeSelected && !isCashModeSelected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Bank Name
                    </label>
                    <select
                      name="bankName"
                      value={form.bankName || ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Select Bank"
                      required
                      disabled={bankDetailsLoading}
                    >
                      <option value="">
                        {bankDetailsLoading ? 'Loading bank details...' : 'Select Bank'}
                      </option>
                      {bankDetails.map(bank => {
                        // Handle different possible data structures
                        const bankId = bank.id || bank.bank_id || bank;
                        const bankName = bank.bank_name || bank.name || bank.bank || bank;
                        
                        // Ensure we have a string for display
                        const displayName = typeof bankName === 'string' ? bankName : JSON.stringify(bankName);
                        
                        return (
                          <option key={bankId} value={bankId}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                    {bankDetailsLoading && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Loading bank details...
                      </p>
                    )}
                    {!bankDetailsLoading && bankDetails.length === 0 && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                        No bank details available
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    *Membership Type
                  </label>
                  <select
                    name="plan"
                    value={form.plan}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Select Membership"
                    required
                    disabled={plansLoading}
                  >
                    <option value="">
                      {plansLoading ? 'Loading plans...' : 'Select Membership'}
                    </option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name || plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    *Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="dd-mm-yyyy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={form.price || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    placeholder="Auto-filled from membership plan"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Price will be automatically filled when you select a membership plan
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid upto
                  </label>
                  <input
                    type="text"
                    name="validUpto"
                    value={form.validUpto || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    placeholder="Auto-filled from membership plan"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Validity will be automatically filled when you select a membership plan
                  </p>
                </div>

                {selectedPaymentModeName && (
                  (selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
                   selectedPaymentModeName.toLowerCase().includes('gateway') ||
                   selectedPaymentModeName.toLowerCase() === 'paymentgateway')
                ) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Select Payment Gateway
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* PhonePe Option */}
                      <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                        updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        <input type="radio" name="paymentGateway" value="PhonePe" checked={selectedGateway === 'PhonePe'} onChange={(e) => { setSelectedGateway(e.target.value); if (updateError) setUpdateError(null); }} disabled={updateLoading} className="w-4 h-4 text-purple-600 focus:ring-purple-500"/>
                        <img src={PhonepeLogo} alt="PhonePe" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }}/>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">PhonePe</span>
                      </label>

                      {/* Separator */}
                      <span className="text-gray-400 dark:text-gray-500">|</span>

                      {/* Razorpay Option */}
                      <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                        updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        <input type="radio" name="paymentGateway" value="Razorpay" checked={selectedGateway === 'Razorpay'} onChange={(e) => { setSelectedGateway(e.target.value); if (updateError) setUpdateError(null); }} disabled={updateLoading} className="w-4 h-4 text-blue-600 focus:ring-blue-500"/>
                        <img src={RazorpayLogo} alt="Razorpay" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }}/>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">Razorpay</span>
                      </label>

                      {/* Separator */}
                      <span className="text-gray-400 dark:text-gray-500">|</span>

                      {/* Stripe Option */}
                      <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                        updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        <input type="radio" name="paymentGateway" value="Stripe" checked={selectedGateway === 'Stripe'} onChange={(e) => { setSelectedGateway(e.target.value); if (updateError) setUpdateError(null); }} disabled={updateLoading} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"/>
                        <img src={StripeLogo} alt="Stripe" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }}/>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">Stripe</span>
                      </label>
                    </div>
                  </div>
                )}

                {updateError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiAlertCircle />
                      <span>{updateError}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModify}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    onClick={handleUpdate}
                    disabled={updateLoading || !form.plan || !form.validUpto || !form.paymentMode || (selectedPaymentModeName && (
                      (selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
                       selectedPaymentModeName.toLowerCase().includes('gateway') ||
                       selectedPaymentModeName.toLowerCase() === 'paymentgateway')
                    ) && !selectedGateway)}
                  >
                    {updateLoading && <FiRefreshCw className="animate-spin" size={16} />}
                    {updateLoading ? 'Processing...' : 'Confirm Payment'}
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
