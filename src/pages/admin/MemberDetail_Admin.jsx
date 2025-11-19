import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiArrowUp, FiUser, FiMail, FiPhone, FiMapPin, FiHome, FiCalendar, FiShield, FiFileText, FiGlobe, FiAlertCircle, FiChevronLeft, FiRefreshCw, FiBriefcase, FiX, FiSearch, FiUsers, FiCopy, FiDownload, FiFile, FiChevronDown, FiEye, FiEdit, FiTrash2, FiChevronRight, FiChevronUp, FiImage, FiFolder, FiPlus, FiUpload } from "react-icons/fi";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import api from "../../api/axiosConfig";
import { toast } from 'react-toastify';
import { getAuthHeaders } from "../../utils/apiHeaders";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RichTextEditor from '../../components/shared/RichTextEditor';
import { usePermissions } from "../../context/PermissionContext";
import PhonepeLogo from "../../assets/Phonepe.png";
import RazorpayLogo from "../../assets/Razorpay.png";
import StripeLogo from "../../assets/Stripe.png";

export default function MemberDetail_Admin() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { memberId: urlMemberId } = useParams();
  const navigate = useNavigate();
  
  // Get permissions for Membership Management module (module_id: 9)
  const { hasPermission } = usePermissions();
  const MEMBERSHIP_MANAGEMENT_MODULE_ID = 9;
  const canView = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'view');
  const canAdd = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'add');
  const canEdit = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'edit');
  const canDelete = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'delete');
  
  // For user panel, always use the current user's ID from localStorage
  const currentUserId = localStorage.getItem("uid");
  const memberId = urlMemberId || currentUserId;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('user-profile');
  const [editMode, setEditMode] = useState(false);
  const [editUserMode, setEditUserMode] = useState(false);
  const [editBusinessMode, setEditBusinessMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [userAdditionalFields, setUserAdditionalFields] = useState({});
  const [companyAdditionalFields, setCompanyAdditionalFields] = useState({});
  const [userRoles, setUserRoles] = useState([]);
  const [stateCountryLoading, setStateCountryLoading] = useState(false);
  
  // Cache for countries and states to avoid repeated API calls
  const [countriesCache, setCountriesCache] = useState(null);
  const [statesCache, setStatesCache] = useState({});
  const isAdditionalFieldsFetched = useRef(false);
  const isUserRolesFetched = useRef(false);
  const isUserRolesLoading = useRef(false);

  // --- Payment Details State and Logic (copied and adapted from PaymentDetails.jsx) ---
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    chequeNo: '',
    chequeAmount: '',
    depositBank: '',
    chequeStatus: '',
    statusUpdateDate: ''
  });
  const [bankDetails, setBankDetails] = useState([]);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // --- Document Modal State ---
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentSection, setDocumentSection] = useState('company'); // 'company' or 'personal'
  const [companyDocuments, setCompanyDocuments] = useState([]);
  const [personalDocuments, setPersonalDocuments] = useState([]);

  const [documentTypes, setDocumentTypes] = useState([{ value: '', label: 'Select' }]);
  const [documentTypesLoading, setDocumentTypesLoading] = useState(false);

  // --- Document Fetching State ---
  const [userDocuments, setUserDocuments] = useState([]);
  const [userDocumentsLoading, setUserDocumentsLoading] = useState(false);

  // --- Document View Modal State ---
  const [showDocumentViewModal, setShowDocumentViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // --- Product Modal State ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    hsnCode: '',
    productName: '',
    productImage: null,
    productDescription: ''
  });
  const [productSaving, setProductSaving] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- Image Upload State ---
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [companyLogoImage, setCompanyLogoImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  // --- Payment Modal State ---
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  // Payment modes are now fetched from API via usePaymentModes hook
  const [bankNames, setBankNames] = useState([
    'Au Small Finance Bank Limited',
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Bank of India'
  ]);
  const [editPaymentForm, setEditPaymentForm] = useState({
    id: '',
    paymentMode: '',
    bankName: '',
    date: '',
    amount: ''
  });
  const [paymentFormErrors, setPaymentFormErrors] = useState({});
  const [savePaymentLoading, setSavePaymentLoading] = useState(false);

  // --- Add Payment Modal State ---
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({
    plan: "",
    startDate: "", // Date field (calendar) - not sent to backend
    paymentMode: "",
    bankName: "",
    price: "",
    validUpto: "", // Valid upto field (calculated) - sent to backend as valid_upto
    chequeNo: "",
    chequeImg: null,
    chequeAmount: "",
    chequeDate: ""
  });
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [addPaymentError, setAddPaymentError] = useState(null);
  const [addPaymentSuccess, setAddPaymentSuccess] = useState(null);
  const [selectedPaymentModeName, setSelectedPaymentModeName] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("");

  const normalizedSelectedPaymentMode = (selectedPaymentModeName || "")
    .toString()
    .toLowerCase();
  const isGatewayModeSelected =
    normalizedSelectedPaymentMode === "payment gateway" ||
    normalizedSelectedPaymentMode.includes("gateway") ||
    normalizedSelectedPaymentMode === "paymentgateway";
  const isCashModeSelected = normalizedSelectedPaymentMode === "cash";
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDocumentTypes = async (section) => {
    setDocumentTypesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid') || '1';
      const response = await api.get(
        '/UserDetail/getDocType',
        {
          headers: getAuthHeaders()
        }
      );
      let filteredTypes = [];
      console.log('Document types API response:', response.data);
      console.log('Filtering for section:', section);
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log('Available document types:', response.data.data);
        
        if (section === 'company') {
          // Filter document types by document_for field from the document types API
          filteredTypes = response.data.data.filter(dt => dt.document_for === 'company');
          console.log('🔍 DEBUG: Company document types found:', {
            total: response.data.data.length,
            company: filteredTypes.length,
            companyTypes: filteredTypes.map(dt => ({
              id: dt.id,
              document_type: dt.document_type,
              document_for: dt.document_for
            })),
            allTypes: response.data.data.map(dt => ({
              id: dt.id,
              document_type: dt.document_type,
              document_for: dt.document_for
            }))
          });
        } else if (section === 'personal') {
          // Filter document types by document_for field from the document types API
          filteredTypes = response.data.data.filter(dt => dt.document_for === 'user');
          console.log('🔍 DEBUG: Personal document types found:', {
            total: response.data.data.length,
            personal: filteredTypes.length,
            personalTypes: filteredTypes.map(dt => ({
              id: dt.id,
              document_type: dt.document_type,
              document_for: dt.document_for
            })),
            allTypes: response.data.data.map(dt => ({
              id: dt.id,
              document_type: dt.document_type,
              document_for: dt.document_for
            }))
          });
        }
        
        const mappedTypes = [
          { value: '', label: 'Select' },
          ...filteredTypes.map(dt => ({ 
            value: dt.id, 
            label: dt.document_type,
            document_for: dt.document_for || dt.belongs_to || 'user', // Handle both field names
            belongs_to: dt.belongs_to || dt.document_for || 'user'   // Include both for consistency
          }))
        ];
        
        console.log('🔍 DEBUG: Setting document types for section', section, ':', {
          section: section,
          mappedTypes: mappedTypes,
          filteredTypes: filteredTypes,
          documentSection: documentSection // This will show the current state
        });
        setDocumentTypes(mappedTypes);
      } else {
        console.log('No document types data found, setting default');
        setDocumentTypes([{ value: '', label: 'Select', document_for: 'user' }]);
      }
    } catch (err) {
      setDocumentTypes([{ value: '', label: 'Select', document_for: 'user' }]);
    } finally {
      setDocumentTypesLoading(false);
    }
  };

  const openDocumentModal = (section) => {
    console.log('🔍 DEBUG: openDocumentModal called with section:', section);
    setDocumentSection(section);
    setShowDocumentModal(true);
    setDocumentType('');
    setDocumentDescription('');
    setDocumentFile(null);
    fetchDocumentTypes(section);
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
  };

  const handleDocumentSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (!token || !documentFile) {
        toast.error('Please select a file to upload');
        return;
      }

      // Get the actual document type ID from the fetched document types
      console.log('🔍 DEBUG: Document type selection:', {
        availableDocumentTypes: documentTypes,
        selectedDocumentTypeValue: documentType,
        documentSection: documentSection,
        currentTab: activeTab
      });
      
      const selectedDocType = documentTypes.find(dt => dt.value === documentType);
      console.log('🔍 DEBUG: Found selected document type:', {
        selectedDocType: selectedDocType,
        document_for: selectedDocType?.document_for,
        belongs_to: selectedDocType?.belongs_to,
        value: selectedDocType?.value,
        label: selectedDocType?.label
      });
      
      if (!selectedDocType || !selectedDocType.value) {
        toast.error('Please select a valid document type');
        return;
      }
      
      // Validate that the selected document type has a valid document_for value
      if (!selectedDocType.document_for || (selectedDocType.document_for !== 'company' && selectedDocType.document_for !== 'user')) {
        console.error('🔍 DEBUG: Invalid document type detected:', {
          selectedDocType: selectedDocType,
          document_for: selectedDocType.document_for,
          documentSection: documentSection
        });
        toast.error(`Selected document type "${selectedDocType.label}" has an invalid category. Please select a different document type.`);
        return;
      }

      // Use the actual document_for field from the selected document type, not the tab section
      const documentForValue = selectedDocType.document_for;
      
      // Determine the correct endpoint based on document section
      // Company documents go to /GroupSettings/document_upload
      // Personal documents go to /GroupSettings/document_user_upload
      const endpoint = documentSection === 'company' 
        ? '/GroupSettings/document_upload'      // Company documents endpoint
        : '/GroupSettings/document_user_upload'; // Personal documents endpoint
      
      console.log('🔍 DEBUG: Document Upload Analysis:', {
        documentSection: documentSection,
        documentForValue: documentForValue,
        selectedDocType: selectedDocType,
        selectedDocTypeDocumentFor: selectedDocType?.document_for,
        selectedDocTypeBelongsTo: selectedDocType?.belongs_to,
        isCompanyTab: documentSection === 'company',
        isPersonalTab: documentSection === 'personal',
        actualValueBeingSent: documentForValue,
        endpoint: endpoint
      });
      
      console.log('Uploading document with data:', {
        user_id: memberId || '1',
        document_type: selectedDocType.value,
        description: documentDescription,
        fileName: documentFile.name,
        fileSize: documentFile.size,
        documentSection: documentSection,
        selectedDocType: selectedDocType,
        endpoint: endpoint
      });

      const formData = new FormData();
      formData.append('user_id', memberId || '1');
      formData.append('document_type', selectedDocType.value);
      formData.append('description', documentDescription);
      formData.append('document_file', documentFile);
      // Note: belongs_to field is NOT needed - the backend determines this from the endpoint

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      console.log('🔍 DEBUG: Final upload data being sent:', {
        user_id: memberId || '1',
        document_type: selectedDocType.value,
        description: documentDescription,
        documentSection: documentSection,
        selectedDocTypeDocumentFor: selectedDocType.document_for,
        endpoint: endpoint
      });

      const response = await api.post(endpoint, formData, {
        headers: getAuthHeaders()
      });

      console.log('Upload response:', response.data);
      console.log('Response status:', response.status);

      if (response.data?.status === 'success' || response.data?.message || response.status === 200) {
        toast.success('Document uploaded successfully!');
        
        // Refresh the documents list after successful upload
        await fetchUserDocuments();
        
        setShowDocumentModal(false);
      } else {
        console.error('Upload failed - response:', response.data);
        toast.error(response.data?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      toast.error(`Failed to upload document: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchUserDocuments = async () => {
    try {
      setUserDocumentsLoading(true);
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      console.log('Fetching documents for memberId:', memberId);
      console.log('Token:', token);
      console.log('UID:', uid);
      
      if (!token) {
        toast.error('Please log in to view documents');
        return;
      }

      const url = `/UserDetail/getuserdocs/${memberId || '1'}`;
      console.log('API URL:', url);

      const response = await api.get(url, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('User documents response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.data && Array.isArray(response.data)) {
        console.log('Setting documents from response.data:', response.data.length, 'documents');
        // Add default status to documents if not present
        const documentsWithStatus = response.data.map(doc => ({
          ...doc,
          status: doc.status || 'pending'
        }));
        
        // Debug: Log the first document to see its structure
        if (documentsWithStatus.length > 0) {
          console.log('First document structure:', documentsWithStatus[0]);
          console.log('All document belongs_to values:', documentsWithStatus.map(doc => doc.belongs_to));
          console.log('All document fields:', documentsWithStatus.map(doc => Object.keys(doc)));
        }
        
        setUserDocuments(documentsWithStatus);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Setting documents from response.data.data:', response.data.data.length, 'documents');
        // Add default status to documents if not present
        const documentsWithStatus = response.data.data.map(doc => ({
          ...doc,
          status: doc.status || 'pending'
        }));
        
        // Debug: Log the first document to see its structure
        if (documentsWithStatus.length > 0) {
          console.log('First document structure:', documentsWithStatus[0]);
          console.log('All document belongs_to values:', documentsWithStatus.map(doc => doc.belongs_to));
          console.log('All document fields:', documentsWithStatus.map(doc => Object.keys(doc)));
        }
        
        setUserDocuments(documentsWithStatus);
      } else {
        console.log('No documents found or invalid response format');
        console.log('Response structure:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasDataData: !!(response.data && response.data.data),
          dataDataType: response.data && response.data.data ? typeof response.data.data : 'N/A',
          dataDataIsArray: response.data && response.data.data ? Array.isArray(response.data.data) : 'N/A'
        });
        // Set empty array when no documents exist
        setUserDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching user documents:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      setUserDocuments([]);
      toast.error('Failed to fetch documents');
    } finally {
      setUserDocumentsLoading(false);
    }
  };

  // Filter documents based on belongs_to field from API response
  const getCompanyDocuments = () => {
    // Filter by belongs_to field from the user documents API
    const companyDocs = userDocuments.filter(doc => doc.belongs_to === 'company');
    
    console.log('Company documents filtered by belongs_to:', {
      total: userDocuments.length,
      company: companyDocs.length,
      belongs_to_values: [...new Set(userDocuments.map(doc => doc.belongs_to))],
      all_documents: userDocuments.map(doc => ({
        id: doc.id,
        doc_type: doc.doc_type,
        document_type: doc.document_type,
        belongs_to: doc.belongs_to,
        description: doc.description
      }))
    });
    
    return companyDocs;
  };

  const getPersonalDocuments = () => {
    // Filter by belongs_to field from the user documents API
    const personalDocs = userDocuments.filter(doc => doc.belongs_to === 'user');
    
    console.log('Personal documents filtered by belongs_to:', {
      total: userDocuments.length,
      personal: personalDocs.length,
      belongs_to_values: [...new Set(userDocuments.map(doc => doc.belongs_to))],
      all_documents: userDocuments.map(doc => ({
        id: doc.id,
        doc_type: doc.doc_type,
        document_type: doc.document_type,
        belongs_to: doc.belongs_to,
        description: doc.description
      }))
    });
    
    return personalDocs;
  };

  // Update useEffect to fetch documents when tab changes
  useEffect(() => {
    console.log('🔍 DEBUG: Document tab useEffect triggered:', {
      activeTab,
      memberId: member?.id,
      member: member,
      documentSection: documentSection,
      documentTypes: documentTypes
    });
    
    if ((activeTab === 'company-documents' || activeTab === 'personal-documents') && member && member.id) {
      console.log('🔍 DEBUG: Fetching documents for tab:', activeTab);
      fetchUserDocuments();
      // Also fetch document types for this section
      const section = activeTab === 'company-documents' ? 'company' : 'personal';
      console.log('🔍 DEBUG: Fetching document types for section:', section);
      fetchDocumentTypes(section);
    } else {
      console.log('🔍 DEBUG: Not fetching documents - conditions not met:', {
        isDocumentTab: activeTab === 'company-documents' || activeTab === 'personal-documents',
        hasMember: !!member,
        memberId: member?.id
      });
    }
    // eslint-disable-next-line
  }, [activeTab, member?.id]);

  useEffect(() => {
    if (activeTab === 'payment-details' && member && member.id) {
      fetchPayments();
      fetchBankDetails();
    }
    // eslint-disable-next-line
  }, [activeTab, member?.id]);

  // Fetch document types when component mounts
  useEffect(() => {
    if (member && member.id) {
      // Fetch both company and personal document types
      fetchDocumentTypes('company');
      fetchDocumentTypes('personal');
    }
  }, [member?.id]);

  // Update filtered payments when payments change
  useEffect(() => {
    
    if (payments.length > 0) {
      filterPayments();
    }
  }, [payments, searchTerm]);

  useEffect(() => {
    filterPayments();
    // eslint-disable-next-line
  }, [payments, searchTerm]);

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (!token || !uid) {
        toast.error('Authentication required');
        return;
      }

      // Fetch all payment details and filter by member
      const response = await api.post("/payment_detail", {}, {
        headers: getAuthHeaders()
      });

      console.log('Payment details API response:', response.data);
      
      let allPayments = [];
      
      // Handle different response structures
      if (response.data?.data?.payment_detail && Array.isArray(response.data.data.payment_detail)) {
        allPayments = response.data.data.payment_detail;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        allPayments = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        allPayments = response.data;
      }

      console.log('🔍 Filtering payments for member:', {
        memberId,
        memberName: member?.name,
        memberEmail: member?.email,
        memberCompany: member?.company_name || member?.company,
        totalPayments: allPayments.length
      });
      
      // Debug: Log the first few payments to see available fields
      if (allPayments.length > 0) {
        console.log('📋 Sample payment data structure:', allPayments[0]);
        console.log('🔑 Member ID fields available:', {
          memberId,
          memberCompanyDetailId: member?.company_detail_id,
          memberUserId: member?.user_detail_id
        });
        
        // Debug: Check what email-related fields exist in payments
        const firstPayment = allPayments[0];
        console.log('📧 Payment email fields check:', {
          email: firstPayment.email,
          pemail: firstPayment.pemail,
          user_email: firstPayment.user_email,
          member_email: firstPayment.member_email,
          contact_email: firstPayment.contact_email
        });
        
        // Debug: Check member email
        console.log('👤 Member email:', member?.email);
      }
      
      // Filter payments for the specific member using COMPANY DETAIL ID MATCHING
      const memberPayments = allPayments.filter(payment => {
        // Match payments by company_detail_id
        const paymentCompanyId = String(payment.company_id || '');
        const memberCompanyDetailId = String(member?.company_detail_id || '');
        
        if (paymentCompanyId && memberCompanyDetailId && paymentCompanyId === memberCompanyDetailId) {
          console.log('✅ Payment matched by company ID:', payment.id, 'Company ID:', paymentCompanyId);
          return true;
        }
        
        return false;
      });
      
      console.log('✅ Filtered payments result:', {
        totalPayments: allPayments.length,
        filteredPayments: memberPayments.length,
        memberId,
        memberName: member?.name
      });

      // Map the filtered payments to the expected format
      const mappedPayments = memberPayments.map((payment, index) => ({
        id: payment.id || index + 1,
        company: payment.company_name || payment.company || '',
        name: payment.pname || payment.name || '',
        paymentMode: payment.received_through || payment.payment_mode || '',
        bank: payment.name || payment.bank_name || '',
        amount: parseFloat(payment.cheque_amount) || 0,
        date: payment.bank_status_date || payment.updated_date || payment.date || '',
        status: payment.cheque_status || payment.status || 'Unknown',
        chequeNo: payment.cheque_no || '',
        chequeDate: payment.cheque_date || '',
        chequeImg: payment.cheque_img || '',
        depositingBank: payment.depositing_bank || '',
        updatedDate: payment.updated_date || '',
        updatedBy: payment.updated_by || '',
        validUpto: payment.valid_upto || ''
      }));

      setPayments(mappedPayments);
      setFilteredPayments(mappedPayments);
      
      // Reset pagination to first page when new data is loaded
      setCurrentPage(1);
      
      // Fetch bank details from dedicated API endpoint
      fetchBankDetails();
      
      // Extract unique bank names from all payments
      const uniqueBankNames = [...new Set(allPayments
        .map(payment => payment.bank_name || payment.name || '')
        .filter(bank => bank && bank.trim() !== ''))];
      
      // Set bank names with default options and real-time data
      setBankNames([
        'Au Small Finance Bank Limited',
        'State Bank of India',
        'HDFC Bank',
        'ICICI Bank',
        'Axis Bank',
        'Punjab National Bank',
        'Bank of Baroda',
        'Canara Bank',
        'Union Bank of India',
        'Bank of India',
        ...uniqueBankNames.filter(bank => ![
          'Au Small Finance Bank Limited',
          'State Bank of India',
          'HDFC Bank',
          'ICICI Bank',
          'Axis Bank',
          'Punjab National Bank',
          'Bank of Baroda',
          'Canara Bank',
          'Union Bank of India',
          'Bank of India'
        ].includes(bank))
      ]);
      
      console.log('Member payments:', mappedPayments);
      console.log('Bank names:', uniqueBankNames);
      console.log('Filtering details:', {
        memberName: member?.name,
        memberCompany: member?.company_name || member?.company,
        memberId: memberId,
        totalPayments: allPayments.length,
        filteredPayments: mappedPayments.length
      });
      
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('Failed to fetch payments');
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      setBankDetailsLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      if (!token) return;
      const response = await api.post("/payment_detail/getbankdetails", {}, {
        headers: getAuthHeaders()
      });
      let bankData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        bankData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        bankData = response.data;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        bankData = Object.values(response.data.data).filter(value => value);
      }
      setBankDetails(bankData);
    } catch (error) {
      setBankDetails([]);
    } finally {
      setBankDetailsLoading(false);
    }
  };

  const filterPayments = () => {
    const filtered = payments.filter(
      (payment) =>
        (payment.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.paymentMode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.bank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.chequeNo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPayments(filtered);
    setCurrentPage(1);
  };

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');

      if (!token || !uid) {
        toast.error('Please log in to view member details');
        navigate('/login');
        return;
      }

      let foundMember = null;

      // First try to fetch user profile using get_profile endpoint
      try {
        console.log('🔍 Fetching user profile for member ID:', memberId);
        
        const profileResponse = await api.get(`/userDetail/get_user_profile/${memberId}`, {
          headers: getAuthHeaders(),
          timeout: 10000 // 10 second timeout
        });

        console.log('🔍 Profile response:', profileResponse.data);

        if (profileResponse.data.status === true && profileResponse.data.data) {
          const profileData = profileResponse.data.data;
          console.log('🔍 Profile data received:', profileData);
          
          // Map the profile data to match the expected member structure
          foundMember = {
            id: profileData.id,
            user_detail_id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            phone_num: profileData.phone_num,
            address: profileData.address,
            city: profileData.city,
            district: profileData.district,
            pincode: profileData.pincode,
            country: profileData.country,
            state: profileData.state,
            area_id: profileData.area_id,
            user_role_id: profileData.user_role_id,
            role_name: profileData.role_name,
            is_active: profileData.is_active,
            profile_image: profileData.profile_image,
            // Additional fields
            ad1: profileData.ad1 || '',
            ad2: profileData.ad2 || '',
            ad3: profileData.ad3 || '',
            ad4: profileData.ad4 || '',
            ad5: profileData.ad5 || '',
            ad6: profileData.ad6 || '',
            ad7: profileData.ad7 || '',
            ad8: profileData.ad8 || '',
            ad9: profileData.ad9 || '',
            ad10: profileData.ad10 || '',
            lct: profileData.lct
          };
          
          console.log('🔍 Mapped member data:', foundMember);
        }
      } catch (err) {
        console.error('🔍 Error fetching profile:', err);
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
          // Network connection issue
        }
      }

      // Fetch company profile data using get_company_profile endpoint
      try {
        console.log('🔍 Fetching company profile for member ID:', memberId);
        
        const companyProfileResponse = await api.get(`/userDetail/get_user_company_profile/${memberId}`, {
          headers: getAuthHeaders(),
          timeout: 10000 // 10 second timeout
        });

        console.log('🔍 Company profile response:', companyProfileResponse.data);

        if (companyProfileResponse.data.status === true && companyProfileResponse.data.data) {
          const companyData = companyProfileResponse.data.data;
          console.log('🔍 Company data received:', companyData);
          
          // If we already have user profile data, merge company data
          if (foundMember) {
            foundMember = {
              ...foundMember,
              // Company profile fields - map directly from API response
              company_detail_id: companyData.id,
              company_name: companyData.company_name,
              company_email: companyData.company_email,
              company_contact: companyData.company_contact,
              company_address: companyData.company_address,
              company_pan: companyData.company_pan,
              company_gstn: companyData.company_gstn,
              company_iec: companyData.company_iec,
              company_logo: companyData.logo,
              website: companyData.website,
              phone_code: companyData.phone_code,
              // Company location fields (these are separate from user location)
              company_city: companyData.city || '',
              company_district: companyData.district || '',
              company_pincode: companyData.pincode || '',
              company_country: companyData.country || '',
              company_state: companyData.state || '',
              company_area_id: companyData.area_id || '',
              // Company additional fields (cad1-cad10) - map from ad1-ad10
              cad1: companyData.ad1 || '',
              cad2: companyData.ad2 || '',
              cad3: companyData.ad3 || '',
              cad4: companyData.ad4 || '',
              cad5: companyData.ad5 || '',
              cad6: companyData.ad6 || '',
              cad7: companyData.ad7 || '',
              cad8: companyData.ad8 || '',
              cad9: companyData.ad9 || '',
              cad10: companyData.ad10 || ''
            };
          } else {
            // If no user profile data, create member from company data only
            foundMember = {
              id: companyData.id,
              company_detail_id: companyData.id,
              user_detail_id: companyData.user_detail_id,
              company_name: companyData.company_name,
              company_email: companyData.company_email,
              company_contact: companyData.company_contact,
              company_address: companyData.company_address,
              company_pan: companyData.company_pan,
              company_gstn: companyData.company_gstn,
              company_iec: companyData.company_iec,
              company_logo: companyData.logo,
              website: companyData.website,
              phone_code: companyData.phone_code,
              // Company location fields
              company_city: companyData.city || '',
              company_district: companyData.district || '',
              company_pincode: companyData.pincode || '',
              company_country: companyData.country || '',
              company_state: companyData.state || '',
              company_area_id: companyData.area_id || '',
              // Company additional fields
              cad1: companyData.ad1 || '',
              cad2: companyData.ad2 || '',
              cad3: companyData.ad3 || '',
              cad4: companyData.ad4 || '',
              cad5: companyData.ad5 || '',
              cad6: companyData.ad6 || '',
              cad7: companyData.ad7 || '',
              cad8: companyData.ad8 || '',
              cad9: companyData.ad9 || '',
              cad10: companyData.ad10 || ''
            };
          }
          
          console.log('🔍 Updated member data with company profile:', foundMember);
        }
      } catch (err) {
        console.error('🔍 Error fetching company profile:', err);
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
          // Network connection issue
        }
      }

      // If profile fetch failed, fallback to original method
      if (!foundMember) {
        console.log('🔍 Profile fetch failed, trying fallback methods...');
        
        // First try to fetch from active_members endpoint
        try {
          const activeResponse = await api.post('/userDetail/active_members', {}, {
            headers: getAuthHeaders(),
            timeout: 10000 // 10 second timeout
          });

          if (activeResponse.data.success || activeResponse.data) {
            const activeMembers = Array.isArray(activeResponse.data) ? activeResponse.data : activeResponse.data.data || [];
            foundMember = activeMembers.find(m => m.id === memberId || m.company_detail_id === memberId || m.user_detail_id === memberId);
          }
        } catch (err) {
          if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            // Network connection issue
          }
        }

        // If not found in active members, try not_members endpoint
        if (!foundMember) {
          try {
            const pendingResponse = await api.post('/userDetail/not_members', { uid }, {
              headers: getAuthHeaders(),
              timeout: 10000 // 10 second timeout
            });
            
            const pendingMembers = Array.isArray(pendingResponse.data) ? pendingResponse.data : pendingResponse.data.data || [];
            foundMember = pendingMembers.find(m => m.id === memberId || m.company_detail_id === memberId || m.user_detail_id === memberId);
          } catch (err) {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
              // Network connection issue
            }
          }
        }
      }
      
      if (foundMember) {
        console.log('🔍 Final member data being set:', foundMember);
        console.log('🔍 Member name:', foundMember.name);
        console.log('🔍 Member email:', foundMember.email);
        console.log('🔍 Company name:', foundMember.company_name);
        console.log('🔍 Company email:', foundMember.company_email);
        setMember(foundMember);
      } else {
        console.log('🔍 Member not found in any endpoint');
        setError('Member not found');
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
      setError('Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  // --- Country and State Data Management ---
  const fetchCountries = async () => {
    try {
      // Return cached data if available
      if (countriesCache) {
        setCountries(countriesCache);
        return countriesCache;
      }

      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/common/countries', {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        const countriesData = response.data.data;
        setCountries(countriesData);
        setCountriesCache(countriesData); // Cache the data
        return countriesData;
      } else {
        setCountries([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Failed to fetch countries:', err);
      console.error('❌ Error details:', err.response?.data);
      setCountries([]);
      return [];
    }
  };

  const fetchStates = async (country) => {
    try {
      // Return cached data if available
      if (statesCache[country]) {
        setStates(statesCache[country]);
        return statesCache[country];
      }

      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/common/states', { country }, {
        headers: getAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        const statesData = response.data.data;
        setStates(statesData);
        // Cache the data by country
        setStatesCache(prev => ({
          ...prev,
          [country]: statesData
        }));
        return statesData;
      } else {
        setStates([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Failed to fetch states:', err);
      console.error('❌ Error details:', err.response?.data);
      setStates([]);
      return [];
    }
  };

  const fetchAllStates = async () => {
    try {
      setStateCountryLoading(true);
      
      // Check cache first for India states
      if (statesCache['India']) {
        const allStates = statesCache['India'];
        setStates(allStates);
        console.log('🔍 All states loaded from cache:', allStates.length, 'states');
        
        // Find the state that matches the area_id and update member
        if (member && member.area_id) {
          const memberState = allStates.find(state => state.id === member.area_id);
          
          if (memberState && (!member.country || !member.state)) {
            // Only update if country/state are missing to avoid overwriting existing data
            const updatedMember = {
              ...member,
              country: member.country || memberState.country,
              state: member.state || memberState.state,
              district: member.district || '' // Preserve existing district
            };
            console.log('🔍 Updated member with state/country:', updatedMember.state, updatedMember.country, 'district:', updatedMember.district);
            setMember(updatedMember);
          }
        }
        setStateCountryLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/common/states', { country: 'India' }, {
        headers: getAuthHeaders()
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        const allStates = response.data.data;
        setStates(allStates); // Store all states for later use
        
        // Cache the India states
        setStatesCache(prev => ({
          ...prev,
          'India': allStates
        }));
        
        console.log('🔍 All states loaded from API:', allStates.length, 'states');
        
        // Find the state that matches the area_id and update member
        if (member && member.area_id) {
          const memberState = allStates.find(state => state.id === member.area_id);
          
          if (memberState && (!member.country || !member.state)) {
            // Only update if country/state are missing to avoid overwriting existing data
            const updatedMember = {
              ...member,
              country: member.country || memberState.country,
              state: member.state || memberState.state,
              district: member.district || '' // Preserve existing district
            };
            console.log('🔍 Updated member with state/country:', updatedMember.state, updatedMember.country, 'district:', updatedMember.district);
            setMember(updatedMember);
          }
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch all states:', err);
      console.error('❌ Error details:', err.response?.data);
    } finally {
      setStateCountryLoading(false);
    }
  };

  // Optimized function to fetch countries and states in parallel
  const fetchLocationDataOptimized = async () => {
    try {
      setStateCountryLoading(true);
      console.log('🚀 Starting optimized location data fetch...');
      
      // Prepare promises for parallel execution
      const promises = [];
      
      // Only fetch countries if not cached
      if (!countriesCache) {
        promises.push(fetchCountries());
      } else {
        setCountries(countriesCache);
      }
      
      // Only fetch states if not cached
      if (!statesCache['India']) {
        promises.push(fetchStates('India'));
      } else {
        setStates(statesCache['India']);
      }
      
      // Execute all API calls in parallel
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log('🚀 Parallel fetch completed');
      } else {
        console.log('🚀 All data loaded from cache');
      }
      
      // Map member state/country after data is loaded
      if (member && member.area_id && states.length > 0) {
        const memberState = states.find(state => state.id === member.area_id);
        if (memberState && (!member.country || !member.state)) {
          const updatedMember = {
            ...member,
            country: member.country || memberState.country,
            state: member.state || memberState.state,
            district: member.district || ''
          };
          console.log('🔍 Updated member with state/country from optimized fetch:', updatedMember.state, updatedMember.country);
          setMember(updatedMember);
        }
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch location data:', err);
    } finally {
      setStateCountryLoading(false);
    }
  };

  // Use the payment modes hook
  const { paymentModes: apiPaymentModes, loading: paymentModesLoading, refetch: refetchPaymentModes } = usePaymentModes();
  
  // Use the membership plans hook
  const { plans, loading: plansLoading, refetch: refetchPlans } = useMembershipPlans();
  
  // Use the bank details hook
  const { bankDetails: apiBankDetails, loading: apiBankDetailsLoading, refetch: refetchBankDetails } = useBankDetails();

  useEffect(() => {
    if (memberId) {
      fetchMemberDetails();
    }
  }, [memberId, navigate]);



  const fetchUserRoles = async () => {
    // Prevent multiple simultaneous calls
    if (isUserRolesLoading.current) {
      console.log('🔍 User roles already being fetched, skipping...');
      return;
    }

    try {
      isUserRolesLoading.current = true;
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      console.log('🔍 Fetching user roles...');
      
      const response = await api.post('/userRole', {}, {
        headers: getAuthHeaders()
      });
      
      console.log('🔍 User roles response:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        setUserRoles(response.data.data);
        console.log('🔍 User roles set:', response.data.data);
      } else {
        setUserRoles([]);
        console.log('🔍 No user roles found, setting empty array');
      }
    } catch (err) {
      console.error('❌ Failed to fetch user roles:', err);
      console.error('❌ Error details:', err.response?.data);
      setUserRoles([]);
    } finally {
      isUserRolesLoading.current = false;
    }
  };

  // Fetch user additional fields from API
  const fetchUserAdditionalFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/groupSettings/get_user_additional_fields', {}, {
        headers: getAuthHeaders()
      });

      const backendData = response.data?.data || response.data || {};
      
      // Map backend data to frontend format
      let mappedData = {};
      if (Array.isArray(backendData)) {
        backendData.forEach((field, index) => {
          if (index < 10) {
            mappedData[`ad${index + 1}`] = field.name || field.label || field.value || field || '';
          }
        });
      } else if (backendData && Object.keys(backendData).length > 0) {
        mappedData = {
          ad1: backendData.ad1 || '',
          ad2: backendData.ad2 || '',
          ad3: backendData.ad3 || '',
          ad4: backendData.ad4 || '',
          ad5: backendData.ad5 || '',
          ad6: backendData.ad6 || '',
          ad7: backendData.ad7 || '',
          ad8: backendData.ad8 || '',
          ad9: backendData.ad9 || '',
          ad10: backendData.ad10 || '',
        };
      }
      
      setUserAdditionalFields(mappedData);
    } catch (err) {
      console.error('Failed to fetch user additional fields:', err);
    }
  };

  // Fetch company additional fields from API
  const fetchCompanyAdditionalFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const response = await api.post('/groupSettings/get_company_additional_fields', {}, {
        headers: getAuthHeaders()
      });

      const backendData = response.data?.data || response.data || {};
      
      // Map backend data to frontend format
      let mappedData = {};
      if (Array.isArray(backendData)) {
        backendData.forEach((field, index) => {
          if (index < 10) {
            mappedData[`cad${index + 1}`] = field.name || field.label || field.value || field || '';
          }
        });
      } else if (backendData && Object.keys(backendData).length > 0) {
        mappedData = {
          cad1: backendData.ad1 || '',
          cad2: backendData.ad2 || '',
          cad3: backendData.ad3 || '',
          cad4: backendData.ad4 || '',
          cad5: backendData.ad5 || '',
          cad6: backendData.ad6 || '',
          cad7: backendData.ad7 || '',
          cad8: backendData.ad8 || '',
          cad9: backendData.ad9 || '',
          cad10: backendData.ad10 || '',
        };
      }
      
      setCompanyAdditionalFields(mappedData);
    } catch (err) {
      console.error('Failed to fetch company additional fields:', err);
    }
  };

  useEffect(() => {
    if (member && !isUserRolesFetched.current) {
      console.log('🔍 Member loaded, fetching user roles...');
      fetchUserRoles();
      isUserRolesFetched.current = true;
    }

    // Cleanup function to reset ref when member changes
    return () => {
      if (member?.id) {
        isUserRolesFetched.current = false;
      }
    };
  }, [member?.id]); // Only depend on member ID, not the entire member object

  useEffect(() => {
    if (member && !isAdditionalFieldsFetched.current) {
      console.log('🔍 Member loaded, fetching additional fields...');
      fetchUserAdditionalFields();
      fetchCompanyAdditionalFields();
      isAdditionalFieldsFetched.current = true;
    }

    // Cleanup function to reset ref when member changes
    return () => {
      if (member?.id) {
        isAdditionalFieldsFetched.current = false;
      }
    };
  }, [member?.id]); // Only depend on member ID

  useEffect(() => {
    if (member) {
      console.log('🔍 Member loaded, fetching countries and states with optimization...');
      fetchLocationDataOptimized();
    }
  }, [member]); // Depend on entire member object to trigger after data refresh

  // Fetch states when country changes (similar to AdminAccounts pattern)
  useEffect(() => {
    if (editData.country && editData.country !== member?.country) {
      fetchStates(editData.country);
    }
  }, [editData.country]);

  // Update member data when states and user roles are loaded
  useEffect(() => {
    if (member && states.length > 0 && userRoles.length > 0) {
      // Skip if country and state are already mapped to avoid infinite loops
      if (member.country && member.state) {
        return;
      }
      
      // Map area_id to state
      let updatedMember = { ...member };
      let hasChanges = false;
      
      if (member.area_id) {
        const memberState = states.find(state => state.id === member.area_id);
        if (memberState) {
          updatedMember.state = memberState.state;
          updatedMember.country = memberState.country;
          hasChanges = true;
          console.log('🔍 Mapped state:', memberState.state, 'country:', memberState.country);
        }
      }
      
      // Ensure user_role_id is set
      if (member.user_role_id) {
        const userRole = userRoles.find(role => role.id === member.user_role_id);
        if (userRole) {
          updatedMember.user_role_id = userRole.id;
          hasChanges = true;
        }
      }
      
      // Only update if there are actual changes
      if (hasChanges) {
        console.log('🔍 Updating member with mapped data:', updatedMember);
        setMember(updatedMember);
      }
    }
  }, [member?.id, member?.area_id, states.length, userRoles.length]); // Depend on member ID, area_id, and array lengths

  // Preload countries and states data immediately when component mounts
  useEffect(() => {
    console.log('🚀 Preloading location data on component mount...');
    // Start fetching countries and India states immediately for faster UX
    if (!countriesCache) {
      fetchCountries();
    }
    if (!statesCache['India']) {
      fetchStates('India');
    }
  }, []); // Run only once on mount

  const handleEditData = () => {
    // Check permission before allowing edit mode
    if (!canEdit) {
      toast.error('You do not have permission to edit Member details.');
      return;
    }
    
    console.log('🔍 handleEditData called');
    console.log('🔍 Active tab:', activeTab);
    console.log('🔍 Member data:', member);
    console.log('🔍 States:', states);
    console.log('🔍 User roles:', userRoles);

    if (!member) {
      console.error('❌ No member data available');
      return;
    }

    // Map area_id to state and user_role_id to role
    let mappedStateId = '';
    if (member.area_id && states.length > 0) {
      const memberState = states.find(state => state.id === member.area_id);
      if (memberState) {
        mappedStateId = memberState.id; // Use state ID, not state name
      }
    }

    let mappedUserRoleId = member.user_role_id || '2';
    if (member.user_role_id && userRoles.length > 0) {
      const userRole = userRoles.find(role => role.id === member.user_role_id);
      if (userRole) {
        mappedUserRoleId = userRole.id;
      }
    }

    const editDataToSet = {
      // User profile fields
      name: member.name || '',
      phone_num: member.phone_num || '',
      address: member.address || '',
      district: member.district || '',
      city: member.city || '',
      pincode: member.pincode || '',
      country: member.country || '',
      state: mappedStateId,
      user_role_id: mappedUserRoleId,
      // Company profile fields
      company_name: member.company_name || '',
      company_email: member.company_email || '',
      company_contact: member.company_contact || '',
      company_address: member.company_address || '',
      company_pan: member.company_pan || '',
      company_gstn: member.company_gstn || '',
      company_iec: member.company_iec || '',
      website: member.website || '',
      // Additional fields
      ad1: member.ad1 || '',
      ad2: member.ad2 || '',
      ad3: member.ad3 || '',
      ad4: member.ad4 || '',
      ad5: member.ad5 || '',
      ad6: member.ad6 || '',
      ad7: member.ad7 || '',
      ad8: member.ad8 || '',
      ad9: member.ad9 || '',
      ad10: member.ad10 || '',
      // Company additional fields (cad1-cad10)
      cad1: member.cad1 || '',
      cad2: member.cad2 || '',
      cad3: member.cad3 || '',
      cad4: member.cad4 || '',
      cad5: member.cad5 || '',
      cad6: member.cad6 || '',
      cad7: member.cad7 || '',
      cad8: member.cad8 || '',
      cad9: member.cad9 || '',
      cad10: member.cad10 || '',
    };

    console.log('🔍 Setting edit data:', editDataToSet);
    setEditData(editDataToSet);

    // Set appropriate edit mode based on active tab
    if (activeTab === 'user-profile') {
      setEditUserMode(true);
      setEditBusinessMode(false);
    } else if (activeTab === 'business-profile') {
      setEditBusinessMode(true);
      setEditUserMode(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({});
    setEditMode(false);
    setEditUserMode(false);
    setEditBusinessMode(false);
  };

  const handleFormChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Check permission before saving
    if (!canEdit) {
      toast.error('You do not have permission to edit Member details.');
      return;
    }
    
    try {
      setSaving(true);
      
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');

      if (!token || !uid) {
        toast.error('Please log in to save changes');
        return;
      }

      // Ensure required fields are present
      const finalEditData = {
        ...editData,
        state: editData.state || member.state || '',
        user_role_id: editData.user_role_id || member.user_role_id || '2' // Always ensure user_role_id is set
      };

      console.log('🔍 Saving with editData:', editData);
      console.log('🔍 Final editData with required fields:', finalEditData);
      console.log('🔍 User role ID check:', finalEditData.user_role_id);

      // Prepare user update payload (user fields only)
      const userPayload = {
        id: member.id,
        role_id: String(finalEditData.user_role_id || member.user_role_id || '2'), // Use role_id instead of user_role_id
        name: finalEditData.name,
        email: member.email, // Keep original email (read-only)
        password: member.password, // Keep original password (read-only)
        temp_password: member.temp_password || "",
        phone_num: finalEditData.phone_num,
        address: finalEditData.address,
        area_id: finalEditData.state || member.area_id || '',
        district: finalEditData.district,
        city: finalEditData.city,
        pincode: finalEditData.pincode,
        is_active: member.is_active || "1",
        profile_image: member.profile_image || "",
        ad1: finalEditData.ad1 || "",
        ad2: finalEditData.ad2 || "",
        ad3: finalEditData.ad3 || "",
        ad4: finalEditData.ad4 || "",
        ad5: finalEditData.ad5 || "",
        ad6: finalEditData.ad6 || "",
        ad7: finalEditData.ad7 || "",
        ad8: finalEditData.ad8 || "",
        ad9: finalEditData.ad9 || "",
        ad10: finalEditData.ad10 || "",
        lct: member.lct || "",
        company_detail_id: member.company_detail_id,
        user_detail_id: member.user_detail_id,
      };

      console.log('🔍 User payload (exact curl format):', userPayload);
      console.log('🔍 Role ID in payload:', userPayload.role_id);
      console.log('🔍 Final editData user_role_id:', finalEditData.user_role_id);
      console.log('🔍 Member user_role_id:', member.user_role_id);
      console.log('🔍 Role ID type:', typeof userPayload.role_id);
      console.log('🔍 Role ID value:', userPayload.role_id);

      // Prepare company update payload (exact curl format for company only)
      const companyPayload = {
        company_name: finalEditData.company_name || "",
        user_detail_id: member.user_detail_id,
        company_contact: finalEditData.company_contact || "",
        company_email: finalEditData.company_email || "",
        company_address: finalEditData.company_address || "",
        city: finalEditData.company_city || "",
        district: finalEditData.company_district || "",
        pincode: finalEditData.company_pincode || "",
        country: finalEditData.company_country || "",
        area_id: finalEditData.company_state || member.company_area_id || "",
        // Use ad1-ad10 for update API (not cad1-cad10)
        ad1: finalEditData.cad1 || "", // Map cad1 to ad1 for update
        ad2: finalEditData.cad2 || "", // Map cad2 to ad2 for update
        ad3: finalEditData.cad3 || "", // Map cad3 to ad3 for update
        ad4: finalEditData.cad4 || "", // Map cad4 to ad4 for update
        ad5: finalEditData.cad5 || "", // Map cad5 to ad5 for update
        ad6: finalEditData.cad6 || "", // Map cad6 to ad6 for update
        ad7: finalEditData.cad7 || "", // Map cad7 to ad7 for update
        ad8: finalEditData.cad8 || "", // Map cad8 to ad8 for update
        ad9: finalEditData.cad9 || "", // Map cad9 to ad9 for update
        ad10: finalEditData.cad10 || "", // Map cad10 to ad10 for update
      };

      console.log('🔍 Company payload (exact curl format):', companyPayload);
      console.log('🔍 Company payload keys:', Object.keys(companyPayload));
      console.log('🔍 Company payload values:', Object.values(companyPayload));
      console.log('🔍 Company payload JSON:', JSON.stringify(companyPayload, null, 2));
      
      // Update user details using the update endpoint
      const userResponse = await api.post('/userDetail/update_user', userPayload, {
        headers: getAuthHeaders()
      });

      console.log('🔍 User update response:', userResponse.data);
      console.log('🔍 User update status:', userResponse.status);
      console.log('🔍 User update success field:', userResponse.data.success);
      console.log('🔍 User update message:', userResponse.data.message);

      // Check if the API actually succeeded
      const userSuccess = userResponse.data.success === true || 
                         userResponse.data.status === 'success' || 
                         userResponse.data.status === true ||
                         userResponse.data.status === 200 ||
                         userResponse.data.message?.toLowerCase().includes('success') ||
                         userResponse.data.message?.toLowerCase().includes('updated');

      // Update company details independently (not conditional on user success)
      let companySuccess = false;
      try {
        const companyResponse = await api.post('/userDetail/add_company', companyPayload, {
          headers: getAuthHeaders()
        });

        console.log('🔍 Company update response:', companyResponse.data);
        console.log('🔍 Company update status:', companyResponse.status);
        console.log('🔍 Company update success field:', companyResponse.data.success);
        console.log('🔍 Company update message:', companyResponse.data.message);
        console.log('🔍 Company update full response:', companyResponse);
        console.log('🔍 Company payload sent:', companyPayload);

        companySuccess = companyResponse.data.success === true || 
                        companyResponse.data.status === 'success' || 
                        companyResponse.data.status === true ||
                        companyResponse.data.status === 200 ||
                        companyResponse.data.message?.toLowerCase().includes('success') ||
                        companyResponse.data.message?.toLowerCase().includes('updated') ||
                        companyResponse.data.message?.toLowerCase().includes('added');

        if (companySuccess) {
          console.log('✅ Company update succeeded');
        } else {
          console.error('🔍 Company update failed:', companyResponse.data);
        }
      } catch (companyError) {
        console.error('🔍 Company API call failed:', companyError);
        console.error('🔍 Company error response:', companyError.response?.data);
        console.error('🔍 Company error status:', companyError.response?.status);
      }

      // Show appropriate success/error messages
      if (userSuccess && companySuccess) {
        toast.success('Member details updated successfully!');
      } else if (userSuccess && !companySuccess) {
        toast.success('User details updated successfully!');
        toast.error('Failed to update company details');
      } else if (!userSuccess && companySuccess) {
        toast.success('Company details updated successfully!');
        toast.error('Failed to update user details');
      } else {
        toast.error('Failed to update member details');
      }

      // Reset edit modes and refresh data if any update succeeded
      if (userSuccess || companySuccess) {
        setEditMode(false);
        setEditUserMode(false);
        setEditBusinessMode(false);
        setEditData({});
        // Refresh member data
        fetchMemberDetails();
      }
    } catch (err) {
      console.error('🔍 Save error:', err);
      console.error('🔍 Error response:', err.response?.data);
      console.error('🔍 Error status:', err.response?.status);
      toast.error(err.response?.data?.message || err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };





  const getUserRoleName = (roleId) => {
    const roles = {
      '1': 'Admin',
      '2': 'Member', 
      '3': 'Guest'
    };
    return roles[roleId] || 'Member';
  };

  const tabs = [
    { id: 'user-profile', label: 'User Profile' },
    { id: 'business-profile', label: 'Business Profile' },
    { id: 'company-documents', label: 'Company Documents' },
    { id: 'personal-documents', label: 'Personal Documents' },
    { id: 'payment-details', label: 'Payment Details' },
    { id: 'products', label: 'Products' }
  ];

  const chromeTabStyles = `
    .chrome-tabs-wrapper {
      position: relative;
      width: 100%;
      margin-bottom: 1.25rem;
    }
    .chrome-tabs-container {
      display: flex;
      align-items: flex-end;
      gap: 0.25rem;
      padding: 0.75rem 1rem 0.25rem;
      border-radius: 0.85rem 0.85rem 0 0;
      background: linear-gradient(180deg, rgba(243, 244, 246, 0.95) 0%, rgba(229, 231, 235, 0.95) 100%);
      border: 1px solid rgba(209, 213, 219, 0.9);
      border-bottom: none;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .chrome-tabs-container::-webkit-scrollbar {
      display: none;
    }
    .dark .chrome-tabs-container {
      background: linear-gradient(180deg, rgba(31, 41, 55, 0.85) 0%, rgba(17, 24, 39, 0.95) 100%);
      border-color: rgba(75, 85, 99, 0.9);
    }
    .chrome-tabs-underline {
      height: 2px;
      width: 100%;
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.6) 50%, rgba(99, 102, 241, 0.2) 100%);
      border-radius: 9999px;
    }
    .dark .chrome-tabs-underline {
      background: linear-gradient(90deg, rgba(129, 140, 248, 0.16) 0%, rgba(129, 140, 248, 0.45) 50%, rgba(129, 140, 248, 0.16) 100%);
    }
    .chrome-tab-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.65rem 1.85rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      background: linear-gradient(180deg, rgba(229, 231, 235, 0.95) 0%, rgba(209, 213, 219, 0.95) 100%);
      border: none;
      border-radius: 0.65rem 0.65rem 0 0;
      cursor: pointer;
      transition: transform 0.2s ease, color 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
      box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.45);
    }
    .chrome-tab-button::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 0.65rem 0.65rem 0 0;
      border: 1px solid rgba(148, 163, 184, 0.6);
      border-bottom: none;
      opacity: 0.45;
      pointer-events: none;
    }
    .chrome-tab-button span {
      position: relative;
      z-index: 1;
      white-space: nowrap;
    }
    .chrome-tab-button:hover {
      color: #374151;
      filter: brightness(1.02);
    }
    .chrome-tab-button.active {
      color: #1f2937;
      background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }
    .chrome-tab-button.active::after {
      border-color: rgba(99, 102, 241, 0.45);
      opacity: 0.75;
    }
    .chrome-tab-button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
    }
    .dark .chrome-tab-button {
      color: #d1d5db;
      background: linear-gradient(180deg, rgba(55, 65, 81, 0.92) 0%, rgba(31, 41, 55, 0.98) 100%);
      box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.18);
    }
    .dark .chrome-tab-button::after {
      border-color: rgba(75, 85, 99, 0.75);
      opacity: 0.55;
    }
    .dark .chrome-tab-button:hover {
      color: #f9fafb;
      filter: brightness(1.06);
    }
    .dark .chrome-tab-button.active {
      color: #f9fafb;
      background: linear-gradient(180deg, rgba(30, 64, 175, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.6), inset 0 -1px 0 rgba(59, 130, 246, 0.55);
    }
    .dark .chrome-tab-button.active::after {
      border-color: rgba(129, 140, 248, 0.5);
      opacity: 0.9;
    }
  `;

  // Payment export and clipboard helpers (from PaymentDetails.jsx)
  const exportToExcel = () => {
    const exportData = filteredPayments.map((payment, index) => ({
      "S.No": index + 1,
      Company: payment.company || 'N/A',
      Name: payment.name || 'N/A',
      "Payment Mode": payment.paymentMode || 'N/A',
      Bank: payment.bank || 'N/A',
      Amount: payment.amount || 0,
      Date: payment.date || 'N/A',
      Status: payment.status || 'N/A',
      "Cheque No": payment.chequeNo || 'N/A',
      "Cheque Date": payment.chequeDate || 'N/A',
      "Updated Date": payment.updatedDate || 'N/A',
      "Valid Upto": payment.validUpto || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment Details");
    XLSX.writeFile(wb, "payment_details.xlsx");
    toast.success("Payment details exported to Excel!");
  };
  const exportToCSV = () => {
    const csvContent = [
      ["S.No", "Company", "Name", "Payment Mode", "Bank", "Amount", "Date", "Status", "Cheque No", "Cheque Date", "Updated Date", "Valid Upto"],
      ...filteredPayments.map((payment, index) => [
        index + 1,
        payment.company || 'N/A',
        payment.name || 'N/A',
        payment.paymentMode || 'N/A',
        payment.bank || 'N/A',
        payment.amount || 0,
        payment.date || 'N/A',
        payment.status || 'N/A',
        payment.chequeNo || 'N/A',
        payment.chequeDate || 'N/A',
        payment.updatedDate || 'N/A',
        payment.validUpto || 'N/A',
      ])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "payment_details.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment details exported to CSV!");
  };
  const copyToClipboard = () => {
    const text = filteredPayments.map((payment, index) => 
      `${index + 1}. ${payment.company || 'N/A'} - ${payment.name || 'N/A'} - ${payment.paymentMode || 'N/A'} - ${payment.bank || 'N/A'} - ₹${payment.amount || 0} - ${payment.date || 'N/A'} - ${payment.status || 'N/A'}`
    ).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Payment details copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };
  const exportToPDF = () => {
    if (!filteredPayments.length) {
      toast.error("No data to export!");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details Report", 40, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);
      const headers = ["S.No", "Company", "Name", "Payment Mode", "Bank", "Amount", "Date", "Status", "Cheque No"];
      const rows = filteredPayments.map((payment, index) => [
        index + 1,
        payment.company || 'N/A',
        payment.name || 'N/A',
        payment.paymentMode || 'N/A',
        payment.bank || 'N/A',
        `₹${(payment.amount || 0).toLocaleString()}`,
        payment.date || 'N/A',
        payment.status || 'N/A',
        payment.chequeNo || 'N/A'
      ]);
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 80,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40 },
          4: { cellWidth: 60 },
          5: { cellWidth: 40 },
          6: { cellWidth: 40 },
          7: { cellWidth: 30 }
        },
        margin: { top: 80, right: 40, bottom: 40, left: 40 }
      });
      const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const clearedCount = filteredPayments.filter(p => p.status === 'Cleared').length;
      const processingCount = filteredPayments.filter(p => p.status === 'Processing').length;
      const bouncedCount = filteredPayments.filter(p => p.status === 'Bounced').length;
      const summaryY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Summary:", 40, summaryY);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Payments: ${filteredPayments.length}`, 40, summaryY + 15);
      doc.text(`Total Amount: ₹${totalAmount.toLocaleString()}`, 40, summaryY + 30);
      doc.text(`Cleared: ${clearedCount} | Processing: ${processingCount} | Bounced: ${bouncedCount}`, 40, summaryY + 45);
      doc.save("payment_details.pdf");
      toast.success("Payment details exported to PDF!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("PDF export failed: " + err.message);
    }
  };

  // --- Products State and Logic ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productEntriesPerPage, setProductEntriesPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSortField, setProductSortField] = useState("product");
  const [productSortDirection, setProductSortDirection] = useState("asc");

  useEffect(() => {
    if (activeTab === 'products' && member && member.id) {
      fetchProducts();
    }
    // eslint-disable-next-line
  }, [activeTab, member?.id]);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line
  }, [products, productSearchTerm]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token || !memberId) {
        toast.error("Please log in to view products");
        return;
      }

      console.log('Fetching products for member ID:', memberId);
      
      const response = await api.get(`/product/get_product_details_by_id/${memberId}`, {
        headers: {
          ...getAuthHeaders(),
          "Authorization": `Bearer ${token}`,
        },
      });
      
      console.log('Products API response:', response.data);
      
      let apiProducts = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        apiProducts = response.data.data;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        // If single product object, wrap in array
        apiProducts = [response.data.data];
      } else if (response.data && Array.isArray(response.data)) {
        apiProducts = response.data;
      }
      
      const mappedProducts = apiProducts.map((product, index) => ({
        id: product.id || product.product_id || index + 1,
        company: product.company_name || product.company || '',
        product: product.product_name || product.product || '',
        hsnCode: product.hsn_code || '',
        description: product.product_description || product.description || '',
        image: product.product_image || product.image || '',
        userDetailId: product.user_detail_id || '',
        status: product.status || '',
        dtime: product.dtime || '',
        name: product.name || '',
        email: product.email || '',
        companyAddress: product.company_address || ''
      }));
      
      console.log('Mapped products:', mappedProducts);
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      console.error('Error response:', err.response?.data);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter(
      (product) =>
        (product.product || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.company || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.hsnCode || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(productSearchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setProductCurrentPage(1);
  };

  const handleProductSort = (field) => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setProductSortField(field);
      setProductSortDirection('asc');
    }
  };

  const getSortedProducts = () => {
    const sorted = [...filteredProducts].sort((a, b) => {
      let aValue = a[productSortField] || '';
      let bValue = b[productSortField] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return productSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return productSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const renderSortIcon = (field) => {
    if (productSortField !== field) {
      return <FiChevronDown className="inline ml-1" />;
    }
    return productSortDirection === 'asc' ? 
      <FiChevronUp className="inline ml-1" /> : 
      <FiChevronDown className="inline ml-1" />;
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentViewModal(true);
  };

  const closeDocumentViewModal = () => {
    setShowDocumentViewModal(false);
    setSelectedDocument(null);
  };

  // --- Document Status Functions ---
  const handleDocumentStatusChange = async (documentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (!token || !uid) {
        toast.error('Authentication required');
        return;
      }

      console.log('Updating document status:', { documentId, newStatus });
      
      // Call the appropriate API endpoint based on action
      let response;
      if (newStatus === 'approved') {
        // Use approve endpoint
        response = await api.post('/UserDetail/update_docs_status', {
          id: documentId.toString()
        }, {
          headers: {
            ...getAuthHeaders(),
            'Authorization': `Bearer ${token}`,
          },
        });
      } else if (newStatus === 'rejected') {
        // Use reject endpoint
        response = await api.post('/userDetail/reject_document', {
          id: documentId.toString()
        }, {
          headers: {
            ...getAuthHeaders(),
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      console.log('Document status update response:', response.data);

      if (response.data?.status === 'success' || response.status === 200) {
        if (newStatus === 'rejected') {
          // Remove rejected documents from display
          setUserDocuments(prevDocs => 
            prevDocs.filter(doc => doc.id !== documentId)
          );
          toast.success('Document rejected and removed');
        } else if (newStatus === 'approved') {
          // Update document status to approved
          setUserDocuments(prevDocs => 
            prevDocs.map(doc => 
              doc.id === documentId 
                ? { ...doc, status: newStatus }
                : doc
            )
          );
          toast.success('Document approved successfully');
        }
        
        // Refresh documents from API to get updated status
        await fetchUserDocuments();
      } else {
        toast.error(response.data?.message || 'Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to update document status: ${error.response?.data?.message || error.message}`);
    }
  };

  // --- Product Modal Functions ---
  const openProductModal = () => {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setShowProductModal(true);
    setProductForm({
      hsnCode: '',
      productName: '',
      productImage: null,
      productDescription: ''
    });
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductForm({
      hsnCode: '',
      productName: '',
      productImage: null,
      productDescription: ''
    });
  };

  const handleProductView = (product) => {
    setSelectedProduct(product);
    setShowProductViewModal(true);
  };

  const handleProductEdit = (product) => {
    setIsEditingProduct(true);
    setEditingProductId(product.id);
    setShowProductModal(true);
    setProductForm({
      hsnCode: product.hsnCode || '',
      productName: product.product || '',
      productImage: null,
      productDescription: product.description || ''
    });
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductSave = async () => {
    if (!productForm.hsnCode || !productForm.productName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProductSaving(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (isEditingProduct && editingProductId) {
        // Edit existing product
        const editForm = new FormData();
        editForm.append('id', String(editingProductId));
        editForm.append('hsn_code', productForm.hsnCode);
        editForm.append('product_name', productForm.productName);
        editForm.append('product_description', productForm.productDescription);
        if (productForm.productImage) {
          editForm.append('file', productForm.productImage);
        }

        const editResponse = await api.post(`/product/edit/${editingProductId}`, editForm, {
          headers: {
            ...getAuthHeaders(),
            'Authorization': `Bearer ${token}`,
          },
          withCredentials: true,
        });

        console.log('Product edit response:', editResponse.data);

        if (editResponse.data?.status === 'success' || editResponse.data?.message || editResponse.status === 200) {
          toast.success('Product updated successfully!');
          await fetchProducts();
          closeProductModal();
        } else {
          toast.error(editResponse.data?.message || 'Failed to update product');
        }
      } else {
        // Add new product
      const formData = new FormData();
      formData.append('hsn_code', productForm.hsnCode);
      formData.append('product_name', productForm.productName);
      formData.append('product_description', productForm.productDescription);
      
      if (productForm.productImage) {
        formData.append('product_image', productForm.productImage);
      }

      const response = await api.post(`/product/add_product_by_admin/${memberId || '1'}`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      });

      console.log('Product add response:', response.data);

      if (response.data?.status === 'success' || response.data?.message || response.status === 200) {
        toast.success('Product added successfully!');
        await fetchProducts();
        closeProductModal();
      } else {
        toast.error(response.data?.message || 'Failed to add product');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to save product: ${error.response?.data?.message || error.message}`);
    } finally {
      setProductSaving(false);
    }
  };

  // --- Image Upload Functions ---
  const handleUserProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setUserProfileImage(file);
    }
  };

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setCompanyLogoImage(file);
    }
  };

  const uploadUserProfileImage = async () => {
    if (!userProfileImage) return;

    setImageUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const formData = new FormData();
      formData.append('id', memberId || '1');
      formData.append('file', userProfileImage);

      const response = await api.post('/userDetail/upload_profile_image', formData, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data?.status === 'success' || response.data?.message || response.status === 200) {
        toast.success('Profile image updated successfully!');
        await fetchMemberDetails();
        setUserProfileImage(null);
      } else {
        toast.error(response.data?.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error(`Failed to update profile image: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const uploadCompanyLogo = async () => {
    if (!companyLogoImage) return;

    setImageUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      const formData = new FormData();
      formData.append('id', member?.company_detail_id || '1');
      formData.append('file', companyLogoImage);

      const response = await api.post('/userDetail/upload_company_logo', formData, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data?.status === 'success' || response.data?.message || response.status === 200) {
        toast.success('Company logo updated successfully!');
        await fetchMemberDetails();
        setCompanyLogoImage(null);
      } else {
        toast.error(response.data?.message || 'Failed to update company logo');
      }
    } catch (error) {
      console.error('Error uploading company logo:', error);
      toast.error(`Failed to update company logo: ${error.response?.data?.message || error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  // --- Payment Modes Hook (like PendingApproval) ---
  function usePaymentModes() {
    const [paymentModes, setPaymentModes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPaymentModes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        
        if (!token || !uid) {
          console.error('Authentication required for fetching payment modes');
          return;
        }
        
        const response = await api.get('/payment_detail/getmodes', {
          headers: {
            ...getAuthHeaders(),
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log('Payment Modes API Response:', response.data);
        console.log('Payment Modes Response Structure:', JSON.stringify(response.data, null, 2));
        
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
        console.log('Payment modes loaded:', modesData);
        console.log('First mode structure:', modesData[0]);
      } catch (error) {
        console.error('Failed to fetch payment modes:', error);
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

  // --- Membership Plans Hook ---
  function useMembershipPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
      
        if (!token || !uid) {
          console.error('Authentication required for fetching plans');
          return;
        }
      
        const response = await api.get('/groupSettings/get_membership_plans', {
          headers: getAuthHeaders()
        });
      
        console.log('Membership Plans Response:', response.data);
        console.log('Membership Plans Response Structure:', JSON.stringify(response.data, null, 2));
      
        const plansData = Array.isArray(response.data?.data) ? response.data.data : [];
        setPlans(plansData);
        console.log('Plans loaded:', plansData);
        if (plansData.length > 0) {
          console.log('First plan structure:', plansData[0]);
          console.log('Available fields in plan:', Object.keys(plansData[0]));
        }
      } catch (error) {
        console.error('Failed to fetch membership plans:', error);
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

  // --- Bank Details Hook ---
  function useBankDetails() {
    const [bankDetails, setBankDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchBankDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        
        if (!token || !uid) {
          console.error('Authentication required for fetching bank details');
          return;
        }
        
        const response = await api.get('/payment_detail/getbankdetails', {
          headers: getAuthHeaders()
        });
        
        console.log('Bank Details Response:', response.data);
        console.log('Bank Details Response Structure:', JSON.stringify(response.data, null, 2));
        
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
        console.log('Bank details loaded:', bankData);
        console.log('First bank structure:', bankData[0]);
      } catch (error) {
        console.error('Failed to fetch bank details:', error);
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

  // --- Payment Form Functions ---

  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPaymentForm({ ...editPaymentForm, [name]: value });
    // Clear error for this field
    if (paymentFormErrors[name]) {
      setPaymentFormErrors({ ...paymentFormErrors, [name]: '' });
    }
  };

  const validatePaymentForm = (form) => {
    const errors = {};
    if (!form.paymentMode.trim()) errors.paymentMode = 'Payment Mode is required';
    if (!form.bankName.trim()) errors.bankName = 'Bank Name is required';
    if (!form.date.trim()) errors.date = 'Date is required';
    if (!form.amount.trim()) errors.amount = 'Amount is required';
    return errors;
  };



  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePaymentForm(editPaymentForm);
    if (Object.keys(errors).length > 0) {
      setPaymentFormErrors(errors);
      return;
    }

    try {
      setSavePaymentLoading(true);
      
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (!token || !uid) {
        toast.error('Authentication required');
        return;
      }

      // TODO: Replace with actual API call
      // const response = await api.post('/payments/update', {
      //   payment_id: editPaymentForm.id,
      //   payment_mode: editPaymentForm.paymentMode,
      //   bank_name: editPaymentForm.bankName,
      //   payment_date: editPaymentForm.date,
      //   amount: editPaymentForm.amount
      // }, {
      //   headers: {
      //     'Client-Service': 'COHAPPRT',
      //     'Auth-Key': '4F21zrjoAASqz25690Zpqf67UyY',
      //     'uid': uid,
      //     'token': token,
      //     'rurl': 'etribe.mittalservices.com',
      //     'Content-Type': 'application/json',
      //   },
      // });

      // TODO: Uncomment above API call and remove this mock success
      // For now, show success message but don't update local state
      toast.success('Payment updated successfully (API integration pending)');
      
      setShowEditPaymentModal(false);
      setSelectedPayment(null);
      
      // Refresh payments data after successful update
      await fetchPayments();
    } catch (error) {
      console.error('Update payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setSavePaymentLoading(false);
    }
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleEdit = (payment) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit Payment records.');
      return;
    }
    setSelectedPayment(payment);
    setEditForm({
      chequeNo: payment.chequeNo || '',
      chequeAmount: payment.amount || '',
      depositBank: payment.bank || '',
      chequeStatus: payment.status || '',
      statusUpdateDate: payment.updatedDate || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to edit Payment records.');
      return;
    }
    try {
      // TODO: Implement edit payment API call
      toast.success('Payment updated successfully (API integration pending)');
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    // Check permission before deleting
    if (!canDelete) {
      toast.error('You do not have permission to delete Payment records.');
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        setDeleteLoading(true);
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        
        if (!token) {
          toast.error("Please log in to delete payment records");
          window.location.href = "/";
          return;
        }

        console.log('Deleting payment with ID:', paymentId);
        
        const response = await api.post("/payment_detail/delete", {
          id: paymentId.toString()
        }, {
          headers: {
            ...getAuthHeaders(),
            "Authorization": `Bearer ${token}`,
          },
        });
        
        console.log('Delete API response:', response.data);
        
        if (response.data?.status === 'success' || response.status === 200) {
          // Remove the deleted payment from the local state
          setPayments(payments.filter(payment => payment.id !== paymentId));
          toast.success("Payment record deleted successfully");
          
          // Refresh payments data to ensure consistency
          await fetchPayments();
        } else {
          toast.error(response.data?.message || "Failed to delete payment record");
        }
      } catch (err) {
        console.error('Error deleting payment:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        if (err.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          window.location.href = "/login";
        } else if (err.response?.status === 404) {
          toast.error("Delete endpoint not found. Please check the API configuration.");
        } else {
          toast.error(err.response?.data?.message || err.message || "Failed to delete payment record");
        }
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const openEditPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setEditPaymentForm({
      id: payment.id,
      paymentMode: payment.paymentMode,
      bankName: payment.bankName,
      date: payment.date,
      amount: payment.amount
    });
    setPaymentFormErrors({});
    setShowEditPaymentModal(true);
  };

  // --- Add Payment Functions ---
  const openAddPaymentModal = () => {
    setShowAddPaymentModal(true);
    // Set today's date as default for startDate (calendar date field)
    const today = new Date().toISOString().split('T')[0];
    setAddPaymentForm({
      plan: "",
      startDate: today,
      paymentMode: "",
      bankName: "",
      price: "",
      validUpto: "",
      chequeNo: "",
      chequeImg: null,
      chequeAmount: "",
      chequeDate: ""
    });
    setSelectedPaymentModeName("");
    setSelectedGateway("");
    setAddPaymentError(null);
    setAddPaymentSuccess(null);
  };

  const closeAddPaymentModal = () => {
    setShowAddPaymentModal(false);
    setAddPaymentForm({
      plan: "",
      startDate: "",
      paymentMode: "",
      bankName: "",
      price: "",
      validUpto: "",
      chequeNo: "",
      chequeImg: null,
      chequeAmount: "",
      chequeDate: ""
    });
    setSelectedPaymentModeName("");
    setSelectedGateway("");
    setAddPaymentError(null);
    setAddPaymentSuccess(null);
  };

  const handleAddPaymentFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setAddPaymentForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      if (name === 'plan') {
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
              const baseDate = addPaymentForm.startDate ? new Date(addPaymentForm.startDate) : new Date();
              const validityText = planValidity.toString().toLowerCase();
              console.log('Base date:', baseDate);
              console.log('Plan validity:', validityText);
              
              // If it's just a number (like "1"), assume it's months
              if (validityText.includes('year') || validityText.includes('yr')) {
                const years = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setFullYear(baseDate.getFullYear() + years);
                console.log('Added years:', years);
              } else if (validityText.includes('month') || validityText.includes('mon')) {
                const months = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setMonth(baseDate.getMonth() + months);
                console.log('Added months:', months);
              } else if (validityText.includes('day')) {
                const days = parseInt(validityText.match(/\d+/)?.[0] || 1);
                baseDate.setDate(baseDate.getDate() + days);
                console.log('Added days:', days);
              } else {
                // If just a number (like "1"), assume it's months
                const months = parseInt(validityText);
                if (!isNaN(months)) {
                  baseDate.setMonth(baseDate.getMonth() + months);
                  console.log('Added months (default):', months);
                }
              }
              
              calculatedValidUpto = baseDate.toISOString().split('T')[0];
              console.log('Calculated valid upto date:', calculatedValidUpto);
            } catch (error) {
              console.log('Error calculating valid upto date:', error);
              calculatedValidUpto = planValidity; // Fallback to original value
            }
          }
          
          setAddPaymentForm(prev => ({
            ...prev,
            [name]: value,
            price: planPrice,
            validUpto: calculatedValidUpto
          }));
        } else {
          setAddPaymentForm(prev => ({ ...prev, [name]: value }));
        }
      } else if (name === 'paymentMode') {
        // When payment mode is selected, update the selected payment mode name
        const selectedMode = apiPaymentModes.find(mode => mode.id == value);
        const modeName = selectedMode ? (selectedMode.mode_name || selectedMode.payment_mode_name || selectedMode.name || selectedMode.mode || selectedMode) : '';
        console.log('Selected payment mode:', selectedMode);
        console.log('Payment mode name:', modeName);
        setSelectedPaymentModeName(modeName);
        // Reset gateway selection when payment mode changes
        setSelectedGateway("");
        setAddPaymentForm(prev => ({ ...prev, [name]: value }));
      } else {
        setAddPaymentForm(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleAddPaymentDateChange = (e) => {
    const selectedDate = e.target.value;
    setAddPaymentForm(prev => ({ ...prev, startDate: selectedDate }));
    
    // If we have a selected plan, recalculate the valid upto based on the selected date
    if (addPaymentForm.plan) {
      const selectedPlan = plans.find(plan => plan.id == addPaymentForm.plan);
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
            setAddPaymentForm(prev => ({ ...prev, validUpto: calculatedValidUpto }));
          } catch (error) {
            console.log('Error calculating valid upto date:', error);
          }
        }
      }
    }
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
    
    console.log('addPaymentDetail called with payload:', payload);
    console.log('isCheque:', isCheque);
    
    data = new FormData();
    data.append('company_detail_id', String(payload.company_detail_id));
    data.append('payment_mode', payload.payment_mode);
    data.append('bank_id', String(payload.bank_id));
    data.append('cheque_amount', String(payload.cheque_amount));
    data.append('cheque_no', String(payload.cheque_no));
    data.append('cheque_date', payload.cheque_date);
    if (payload.valid_upto) data.append('valid_upto', payload.valid_upto);
    if (payload.file) data.append('file', payload.file);
    // Remove content-type for FormData
    delete headers['Content-Type'];
    
    // Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of data.entries()) {
      console.log(key, ':', value);
    }
    
    console.log('API Headers:', headers);
    
    const response = await api.post('/payment_detail/add', data, {
      headers,
      timeout: 15000,
    });
    
    console.log('Payment API Response:', response.data);
    return response.data;
  };

  // Create Razorpay order via backend API
  const createRazorpayOrder = async (amount, currency = 'INR') => {
    try {
      const response = await api.post('/payment/razorpay/create-order', {
        amount: Math.round(amount * 100), // Convert to paise (Razorpay expects amount in smallest currency unit)
        currency: currency,
        company_detail_id: member?.company_detail_id || member?.id,
        plan_id: addPaymentForm.plan,
        valid_upto: addPaymentForm.validUpto
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
      console.error('Error creating Razorpay order:', error);
      throw new Error('Razorpay order creation failed. Please configure the backend API endpoint: /payment/razorpay/create-order');
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      const selectedPlan = plans.find(plan => plan.id == addPaymentForm.plan);
      const amount = selectedPlan ? parseFloat(selectedPlan.price || selectedPlan.plan_price || selectedPlan.cost || selectedPlan.amount || 0) : 0;
      
      if (amount <= 0) {
        setAddPaymentError('Invalid payment amount. Please select a valid membership plan.');
        setAddPaymentLoading(false);
        return;
      }

      // Create Razorpay order
      const orderData = await createRazorpayOrder(amount);
      
      // Get Razorpay key from environment or use default test key
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        setAddPaymentError('Razorpay checkout script not loaded. Please refresh the page.');
        setAddPaymentLoading(false);
        return;
      }

      // Get user details for Razorpay
      const userName = member?.user_name || member?.name || localStorage.getItem('userName') || 'User';
      const userEmail = member?.email || localStorage.getItem('userEmail') || '';
      const userPhone = member?.phone || member?.mobile || '';

      const options = {
        key: razorpayKey,
        amount: orderData.amount || Math.round(amount * 100),
        currency: orderData.currency || 'INR',
        name: 'ETribe Membership',
        description: `Membership Plan Payment - ${selectedPlan?.plan_name || selectedPlan?.name || 'Plan'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          console.log('Razorpay Payment Success:', response);
          
          try {
            // Verify payment on backend
            const verifyResponse = await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              company_detail_id: member?.company_detail_id || member?.id,
              plan_id: addPaymentForm.plan,
              amount: amount,
              valid_upto: addPaymentForm.validUpto
            }, {
              headers: getAuthHeaders()
            });

            if (verifyResponse.data && (verifyResponse.data.status === true || verifyResponse.data.success === true)) {
              const paymentModeString = `${selectedPaymentModeName} - Razorpay`;
              
              const paymentPayload = {
                company_detail_id: member?.company_detail_id || member?.id,
                payment_mode: paymentModeString,
                bank_id: '',
                cheque_amount: amount.toString(),
                cheque_no: response.razorpay_payment_id,
                cheque_date: '',
                file: undefined,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                valid_upto: addPaymentForm.validUpto, // Use the calculated Valid upto field
              };

              const paymentResponse = await addPaymentDetail(paymentPayload, false);
              
              if (paymentResponse && (paymentResponse.status === true || paymentResponse.success === true || paymentResponse.data)) {
                toast.success('Payment completed successfully via Razorpay!');
                
                await fetchPayments();
                
                setTimeout(() => {
                  filterPayments();
                }, 100);
                
                setShowAddPaymentModal(false);
                
                setAddPaymentForm({
                  plan: "",
                  validUpto: "",
                  paymentMode: "",
                  bankName: "",
                  price: "",
                  validTill: "",
                  chequeNo: "",
                  chequeImg: null,
                  chequeAmount: "",
                  chequeDate: ""
                });
                setSelectedPaymentModeName("");
                setSelectedGateway("");
                setAddPaymentError(null);
                setAddPaymentSuccess(null);
                setAddPaymentLoading(false);
              } else {
                throw new Error('Failed to record payment in system');
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
            setAddPaymentError('Payment verification failed. Please contact support.');
            setAddPaymentLoading(false);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            setAddPaymentLoading(false);
            setAddPaymentError(null);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Razorpay payment error:', error);
      setAddPaymentError(error.message || 'Failed to initiate Razorpay payment. Please try again.');
      toast.error(error.message || 'Failed to initiate Razorpay payment.');
      setAddPaymentLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!addPaymentForm.plan) {
      setAddPaymentError('Please select a membership plan.');
      return;
    }
    if (!addPaymentForm.validUpto) {
      setAddPaymentError('Please select a membership plan to calculate valid upto date.');
      return;
    }
    // Check if valid upto date is in future
    const validUptoDate = new Date(addPaymentForm.validUpto);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validUptoDate <= today) {
      setAddPaymentError('Valid upto date must be in the future. Please select a membership plan.');
      return;
    }
    
    // Validate payment mode
    if (!addPaymentForm.paymentMode) {
      setAddPaymentError('Please select a payment mode.');
      return;
    }
    
    // Check if Payment Gateway is selected
    const isPaymentGateway = selectedPaymentModeName && (
      selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
      selectedPaymentModeName.toLowerCase().includes('gateway') ||
      selectedPaymentModeName.toLowerCase() === 'paymentgateway'
    );
    
    // If Payment Gateway is selected, validate gateway selection
    if (isPaymentGateway) {
      if (!selectedGateway) {
        setAddPaymentError('Please select a payment gateway (PhonePe, Razorpay, or Stripe).');
        return;
      }
      
      // Handle Razorpay payment gateway
      if (selectedGateway === 'Razorpay') {
        setAddPaymentLoading(true);
        setAddPaymentError(null);
        setAddPaymentSuccess(null);
        await handleRazorpayPayment();
        return; // Exit early as Razorpay flow handles its own submission
      }
      
      // TODO: Handle other gateways (PhonePe, Stripe) here
    }
    
    // Validate bank name for non-gateway payments (except Cash)
    const isCash = selectedPaymentModeName && selectedPaymentModeName.toLowerCase() === 'cash';
    if (!isPaymentGateway && !isCash && !addPaymentForm.bankName) {
      setAddPaymentError('Please select a bank name.');
      return;
    }
    
    setAddPaymentLoading(true);
    setAddPaymentError(null);
    setAddPaymentSuccess(null);
    
    try {
      // Add payment detail
      const isCheque = selectedPaymentModeName && selectedPaymentModeName.toLowerCase() === 'cheque';
      const selectedPlan = plans.find(plan => plan.id == addPaymentForm.plan);
      
      // Create payment mode string - include gateway name if Payment Gateway is selected
      let paymentModeString = selectedPaymentModeName;
      if (isPaymentGateway && selectedGateway) {
        paymentModeString = `${selectedPaymentModeName} - ${selectedGateway}`;
      }
      
      const paymentPayload = {
        company_detail_id: member?.company_detail_id || member?.id,
        payment_mode: paymentModeString,
        bank_id: addPaymentForm.bankName || '',
        cheque_amount: isCheque ? addPaymentForm.chequeAmount : (selectedPlan ? (selectedPlan.price || selectedPlan.plan_price || selectedPlan.cost || selectedPlan.amount || '') : ''),
        cheque_no: isCheque ? addPaymentForm.chequeNo : '',
        cheque_date: isCheque ? addPaymentForm.chequeDate : '',
        file: isCheque ? addPaymentForm.chequeImg : undefined,
        valid_upto: addPaymentForm.validUpto, // Use the calculated Valid upto field
      };
      
      console.log('Payment Payload:', paymentPayload);
      console.log('Is Cheque:', isCheque);
      console.log('Selected Plan:', selectedPlan);
      console.log('Selected Payment Mode:', selectedPaymentModeName);
      
      const paymentResponse = await addPaymentDetail(paymentPayload, isCheque);
      console.log('Payment API Response:', paymentResponse);

      if (paymentResponse && (paymentResponse.status === true || paymentResponse.success === true || paymentResponse.data)) {
        toast.success('Payment recorded successfully!');
        setAddPaymentSuccess('Payment recorded successfully!');
        
        // Refresh payments data
        await fetchPayments();
        
        // Force re-filtering and update display
        setTimeout(() => {
          filterPayments();
        }, 100);
        
        // Close modal immediately
        setShowAddPaymentModal(false);
        
        // Reset form
        setAddPaymentForm({
          plan: "",
          startDate: "",
          paymentMode: "",
          bankName: "",
          price: "",
          validUpto: "",
          chequeNo: "",
          chequeImg: null,
          chequeAmount: "",
          chequeDate: ""
        });
        setSelectedPaymentModeName("");
        setSelectedGateway("");
        setAddPaymentError(null);
        setAddPaymentSuccess(null);
      } else {
        const errorMsg = paymentResponse?.message || paymentResponse?.error || 'Payment API did not return success.';
        setAddPaymentError(
          typeof errorMsg === 'string'
            ? errorMsg
            : errorMsg?.message
              ? errorMsg.message
              : JSON.stringify(errorMsg)
        );
        toast.error(
          typeof errorMsg === 'string'
            ? errorMsg
            : errorMsg?.message
              ? errorMsg.message
              : JSON.stringify(errorMsg)
        );
      }
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Failed to record payment';
        setAddPaymentError(
          typeof errorMessage === 'string'
            ? errorMessage
            : errorMessage?.message
              ? errorMessage.message
              : JSON.stringify(errorMessage)
        );
        toast.error(
          typeof errorMessage === 'string'
            ? errorMessage
            : errorMessage?.message
              ? errorMessage.message
              : JSON.stringify(errorMessage)
        );
      } else if (err.request) {
        setAddPaymentError('Network error. Please check your connection.');
        toast.error('Network error. Please check your connection.');
      } else {
        setAddPaymentError('Failed to record payment. Please try again.');
        toast.error('Failed to record payment.');
      }
          } finally {
        setAddPaymentLoading(false);
      }
    };

    // --- Utility Functions ---
  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower.includes('cleared') || statusLower.includes('success') || statusLower.includes('completed')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {status}
        </span>
      );
    } else if (statusLower.includes('pending') || statusLower.includes('processing')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {status}
        </span>
      );
    } else if (statusLower.includes('failed') || statusLower.includes('rejected') || statusLower.includes('bounced')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {status}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#202123] dark:text-gray-200">
          {status || 'Unknown'}
        </span>
      );
    }
  };



  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => loading, [loading]);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading your membership details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !member) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Member Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'The requested member could not be found.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderUserProfile = () => (
    <div className="relative w-full flex flex-col md:flex-row gap-8 items-start">
      {/* Left: Profile Picture */}
      <div className="flex flex-col items-center gap-6 min-w-[220px] w-full md:w-[220px]">
        <div className="relative">
          {(member.profile_image || member.user_image || member.avatar) ? (
            <img
              src={`${BASE_URL}/${member.profile_image || member.user_image || member.avatar}`}
              alt="User Profile"
              className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-[#1E1E1E]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-28 h-28 rounded-full border-2 border-gray-300 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center" 
            style={{ display: (member.profile_image || member.user_image || member.avatar) ? 'none' : 'flex' }}
          >
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="text-3xl font-bold mb-1">
                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-xs">
                {member.name || 'User'}
              </div>
            </div>
          </div>
          
          {/* Image Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center group cursor-pointer">
            <label className="cursor-pointer w-full h-full flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleUserProfileImageChange}
                className="hidden"
                disabled={imageUploading}
              />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <FiEdit className="text-white text-xl" />
              </div>
            </label>
          </div>
        </div>
        
        {/* Image Upload Controls */}
        {userProfileImage && (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {userProfileImage.name}
            </div>
            <div className="flex gap-2">
              <button
                onClick={uploadUserProfileImage}
                disabled={imageUploading}
                className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {imageUploading ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={12} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload size={12} />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={() => setUserProfileImage(null)}
                disabled={imageUploading}
                className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{member.name || 'User'}</h2>
          <div className="text-sm text-gray-500 dark:text-gray-300 font-medium">{member.email}</div>
          <div className="text-sm text-gray-400 dark:text-gray-400">{member.phone_num}</div>
        </div>
      </div>

      {/* Right: Details Table or Edit Form */}
      <div className="flex-1 w-full">
        {editUserMode ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit User Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact No.</label>
                <input
                  type="tel"
                  value={editData.phone_num || ''}
                  onChange={(e) => handleFormChange('phone_num', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editData.address || ''}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  value={editData.city || ''}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
                <input
                  type="text"
                  value={editData.district || ''}
                  onChange={(e) => handleFormChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  value={editData.pincode || ''}
                  onChange={(e) => handleFormChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <select
                  value={editData.country || ''}
                  onChange={(e) => {
                    handleFormChange('country', e.target.value);
                    if (e.target.value) {
                      fetchStates(e.target.value);
                    } else {
                      setStates([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select Country</option>
                  {countries.map((country, index) => (
                    <option key={index} value={country.country}>{country.country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <select
                  value={editData.state || ''}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>{state.state}</option>
                  ))}
                </select>
              </div>
              {/* Hidden field for user_role_id */}
              <input
                type="hidden"
                value={editData.user_role_id || ''}
                onChange={(e) => handleFormChange('user_role_id', e.target.value)}
              />
              {/* Dynamic User Additional Fields (all ad fields from API) */}
              {Object.keys(userAdditionalFields).map((fieldKey, index) => {
                const fieldName = userAdditionalFields[fieldKey];
                if (!fieldName) return null;
                
                return (
                  <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {fieldName}
                    </label>
                    <input
                      type="text"
                      value={editData[fieldKey] || ''}
                      onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-xl">
              <tbody>
                {[
                  { label: 'Name', key: 'name' },
                  { label: 'Email', key: 'email' },
                  { label: 'Contact No.', key: 'phone_num' },
                  { label: 'Address', key: 'address' },
                  { label: 'City', key: 'city' },
                  { label: 'District', key: 'district' },
                  { label: 'Pincode', key: 'pincode' },
                  { label: 'Country', key: 'country' },
                  { label: 'State', key: 'state' },
                  // Dynamic User Additional Fields (all ad fields from API)
                  ...Object.keys(userAdditionalFields).map(fieldKey => ({
                    label: userAdditionalFields[fieldKey],
                    key: fieldKey
                  })).filter(item => item.label) // Show all fields that have labels, regardless of values
                ].map(({ label, key, value }) => {
                  return (
                    <tr key={key} className="border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#202123]/50 w-48 align-top">{label}</td>
                      <td className="px-6 py-4 bg-white dark:bg-[#1E1E1E]">
                        <span className="text-gray-900 dark:text-gray-100 text-base font-normal">
                          {key === 'state' || key === 'country' ? 
                            (stateCountryLoading ? 
                              <span className="text-gray-500">Loading...</span> : 
                              (value || member[key] || '-')
                            ) : 
                            (value || member[key] || '-')
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderBusinessProfile = () => (
    <div className="relative w-full flex flex-col md:flex-row gap-8 items-start">
      {/* Left: Business Logo */}
      <div className="flex flex-col items-center gap-6 min-w-[220px] w-full md:w-[220px]">
        <div className="relative">
          {(member.logo || member.company_logo || member.business_logo) ? (
            <img
              src={`${BASE_URL}/${member.logo || member.company_logo || member.business_logo}`}
              alt="Business Logo"
              className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-[#1E1E1E]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-28 h-28 rounded-full border-2 border-gray-300 dark:border-gray-700 shadow-md bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center" 
            style={{ display: (member.logo || member.company_logo || member.business_logo) ? 'none' : 'flex' }}
          >
            <div className="text-center text-gray-600 dark:text-gray-400">
              <div className="text-3xl font-bold mb-1">
                {member.company_name ? member.company_name.charAt(0).toUpperCase() : 'B'}
              </div>
              <div className="text-xs">
                {member.company_name || 'Business'}
              </div>
            </div>
          </div>
          
          {/* Image Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center group cursor-pointer">
            <label className="cursor-pointer w-full h-full flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleCompanyLogoChange}
                className="hidden"
                disabled={imageUploading}
              />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <FiEdit className="text-white text-xl" />
              </div>
            </label>
          </div>
        </div>
        
        {/* Image Upload Controls */}
        {companyLogoImage && (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {companyLogoImage.name}
            </div>
            <div className="flex gap-2">
              <button
                onClick={uploadCompanyLogo}
                disabled={imageUploading}
                className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {imageUploading ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={12} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload size={12} />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={() => setCompanyLogoImage(null)}
                disabled={imageUploading}
                className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{member.company_name || 'Business'}</h2>
          <div className="text-sm text-gray-500 dark:text-gray-300 font-medium">{member.company_email || 'No company email'}</div>
          <div className="text-sm text-gray-400 dark:text-gray-400">{member.company_contact || 'No company contact'}</div>
        </div>
      </div>

      {/* Right: Business Details Table or Edit Form */}
      <div className="flex-1 w-full">
        {editBusinessMode ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Business Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editData.company_name || ''}
                  onChange={(e) => handleFormChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Email</label>
                <input
                  type="email"
                  value={editData.company_email || ''}
                  onChange={(e) => handleFormChange('company_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Contact</label>
                <input
                  type="tel"
                  value={editData.company_contact || ''}
                  onChange={(e) => handleFormChange('company_contact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Address</label>
                <input
                  type="text"
                  value={editData.company_address || ''}
                  onChange={(e) => handleFormChange('company_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company City</label>
                <input
                  type="text"
                  value={editData.company_city || ''}
                  onChange={(e) => handleFormChange('company_city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company District</label>
                <input
                  type="text"
                  value={editData.company_district || ''}
                  onChange={(e) => handleFormChange('company_district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Pincode</label>
                <input
                  type="text"
                  value={editData.company_pincode || ''}
                  onChange={(e) => handleFormChange('company_pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Country</label>
                <select
                  value={editData.company_country || ''}
                  onChange={(e) => {
                    handleFormChange('company_country', e.target.value);
                    if (e.target.value) {
                      fetchStates(e.target.value);
                    } else {
                      setStates([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select Country</option>
                  {countries.map((country, index) => (
                    <option key={index} value={country.country}>{country.country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company State</label>
                <select
                  value={editData.company_state || ''}
                  onChange={(e) => handleFormChange('company_state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>{state.state}</option>
                  ))}
                </select>
              </div>
              {/* Hidden field for user_role_id */}
              <input
                type="hidden"
                value={editData.user_role_id || ''}
                onChange={(e) => handleFormChange('user_role_id', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  value={editData.pincode || ''}
                  onChange={(e) => handleFormChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              {/* Dynamic Company Additional Fields (all cad fields from API) */}
              {Object.keys(companyAdditionalFields).map((fieldKey, index) => {
                const fieldName = companyAdditionalFields[fieldKey];
                if (!fieldName) return null;
                
                return (
                  <div key={fieldKey}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {fieldName}
                    </label>
                    <input
                      type="text"
                      value={editData[fieldKey] || ''}
                      onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-xl">
              <tbody>
                {[
                  { label: 'Name', key: 'company_name' },
                  { label: 'Email', key: 'company_email' },
                  { label: 'Contact No', key: 'company_contact' },
                  { label: 'Address', key: 'company_address' },
                  { label: 'City', key: 'company_city' },
                  { label: 'District', key: 'company_district' },
                  { label: 'Country', key: 'company_country' },
                  { label: 'State', key: 'company_state' },
                  { label: 'Pincode', key: 'company_pincode' },
                  // Dynamic Company Additional Fields (all cad fields from API)
                  ...Object.keys(companyAdditionalFields).map(fieldKey => ({
                    label: companyAdditionalFields[fieldKey],
                    key: fieldKey
                  })).filter(item => item.label) // Show all fields that have labels, regardless of values
                ].map(({ label, key, value, fallback }) => {
                  return (
                    <tr key={key} className="border-b last:border-b-0 border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#202123]/50 w-48 align-top">{label}</td>
                      <td className="px-6 py-4 bg-white dark:bg-[#1E1E1E]">
                        <span className="text-gray-900 dark:text-gray-100 text-base font-normal">
                          {key === 'company_state' || key === 'company_country' ? 
                            (stateCountryLoading ? 
                              <span className="text-gray-500">Loading...</span> : 
                              (value || member[key] || '-')
                            ) : 
                            (value || member[key] || '-')
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user-profile':
        return renderUserProfile();
      case 'business-profile':
        return renderBusinessProfile();
      case 'company-documents':
        if (userDocumentsLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
                <p className="text-indigo-700 dark:text-indigo-300">Loading company documents...</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
                Company Documents 
                <span className="ml-3 text-lg font-medium text-blue-600 dark:text-blue-400">
                  ({getCompanyDocuments().length})
                </span>
              </h1>
            </div>
            
            <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full">
              {getCompanyDocuments().length === 0 ? (
                <div className="text-center py-16">
                  <FiFileText className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No company documents</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Upload your first company document to get started. Click the "Add Document" button above to begin.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getCompanyDocuments().map((doc, index) => (
                      <div key={doc.id} className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group relative">
                        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="p-6">
                          {/* Document Header */}
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {doc.doc_type || 'Document'}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              Company Document
                            </p>
                          </div>

                          {/* Document Preview */}
                          {doc.document_path && (
                            <div className="mb-4">
                              <div className="relative group cursor-pointer" onClick={() => handleViewDocument(doc)}>
                                <img 
                                  src={`${BASE_URL}/${doc.document_path}`}
                                  alt={doc.doc_type}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 group-hover:opacity-80 transition-opacity"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                                  <div className="text-center text-gray-500 dark:text-gray-400">
                                    <FiFileText className="mx-auto text-2xl mb-1" />
                                    <p className="text-xs">Preview not available</p>
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <FiEye className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Document Details */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                                Description
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2">
                                {doc.description || 'No description provided'}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                                Uploaded
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </p>
                            </div>

                            {/* Document Status Actions */}
                            {doc.status === 'pending' && (
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                  onClick={() => handleDocumentStatusChange(doc.id, 'approved')}
                                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 hover:scale-110"
                                  title="Approve Document"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDocumentStatusChange(doc.id, 'rejected')}
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 hover:scale-110"
                                  title="Reject Document"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            
                            {/* Approved Status Indicator */}
                            {doc.status === 'approved' && (
                              <div className="flex items-center justify-center pt-2">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-medium">Approved</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
            case 'personal-documents':
        if (userDocumentsLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
                <p className="text-indigo-700 dark:text-indigo-300">Loading personal documents...</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-green-600">
                Personal Documents 
                <span className="ml-3 text-lg font-medium text-green-600 dark:text-green-400">
                  ({getPersonalDocuments().length})
                </span>
              </h1>
            </div>
            
            <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full">
              {getPersonalDocuments().length === 0 ? (
                <div className="text-center py-16">
                  <FiFileText className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No personal documents</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Upload your first personal document to get started. Click the "Add Document" button above to begin.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getPersonalDocuments().map((doc, index) => (
                      <div key={doc.id} className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group relative">
                        <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="p-6">
                          {/* Document Header */}
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {doc.doc_type || 'Document'}
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Personal Document
                            </p>
                          </div>

                          {/* Document Preview */}
                          {doc.document_path && (
                            <div className="mb-4">
                              <div className="relative group cursor-pointer" onClick={() => handleViewDocument(doc)}>
                                <img 
                                  src={`${BASE_URL}/${doc.document_path}`}
                                  alt={doc.doc_type}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 group-hover:opacity-80 transition-opacity"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                                  <div className="text-center text-gray-500 dark:text-gray-400">
                                    <FiFileText className="mx-auto text-2xl mb-1" />
                                    <p className="text-xs">Preview not available</p>
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <FiEye className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Document Details */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                                Description
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2">
                                {doc.description || 'No description provided'}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                                Uploaded
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </p>
                            </div>

                            {/* Document Status Actions */}
                            {doc.status === 'pending' && (
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                  onClick={() => handleDocumentStatusChange(doc.id, 'approved')}
                                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 hover:scale-110"
                                  title="Approve Document"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDocumentStatusChange(doc.id, 'rejected')}
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 hover:scale-110"
                                  title="Reject Document"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            
                            {/* Approved Status Indicator */}
                            {doc.status === 'approved' && (
                              <div className="flex items-center justify-center pt-2">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-medium">Approved</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'payment-details':
        // --- Payment Details Tab Content ---
        if (paymentsLoading && payments.length === 0) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
                <p className="text-indigo-700 dark:text-indigo-300">Loading payment details...</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Payment Details</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUsers className="text-indigo-600" />
                  <span>Total Payments: {payments.length}</span>
                </div>
                <button
                  onClick={openAddPaymentModal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="Add New Payment"
                >
                  <FiPlus size={16} />
                  Add Payment
                </button>
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
                      placeholder="Search by company, name, payment mode, bank, or status..."
                      className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ minWidth: '100%', maxWidth: '100%' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                    <span>Showing {Math.min((currentPage - 1) * entriesPerPage + 1, filteredPayments.length)} to {Math.min(currentPage * entriesPerPage, filteredPayments.length)} of {filteredPayments.length} entries</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">

                  {/* Desktop Export Buttons */}
                  <div className="hidden xl:flex gap-2">
                    <button 
                      className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                      onClick={copyToClipboard}
                      title="Copy to Clipboard"
                    >
                      <FiCopy /> 
                      Copy
                    </button>
                    <button 
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                      onClick={exportToCSV}
                      title="Export CSV"
                    >
                      <FiDownload /> 
                      CSV
                    </button>
                    <button 
                      className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                      onClick={exportToExcel}
                      title="Export Excel"
                    >
                      <FiFile /> 
                      Excel
                    </button>
                    <button 
                      className="flex items-center gap-1 bg-rose-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition"
                      onClick={exportToPDF}
                      title="Export PDF"
                    >
                      <FiFile /> 
                      PDF
                    </button>
                  </div>
                  {/* Mobile Export Dropdown */}
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
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-32">
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                          onClick={() => { copyToClipboard(); setShowExportDropdown(false); }}
                        >
                          <FiCopy className="text-gray-500" />
                          Copy
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => { exportToCSV(); setShowExportDropdown(false); }}
                        >
                          <FiDownload className="text-green-500" />
                          CSV
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-700"
                          onClick={() => { exportToExcel(); setShowExportDropdown(false); }}
                        >
                          <FiFile className="text-emerald-500" />
                          Excel
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                          onClick={() => { exportToPDF(); setShowExportDropdown(false); }}
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
              <div className="hidden lg:block overflow-x-auto" key={`payments-table-${payments.length}`}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '60px', width: '60px' }}>S.No</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>Company</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>Name</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>Payment Mode</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '150px', width: '150px' }}>Bank</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '100px', width: '100px' }}>Amount</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '100px', width: '100px' }}>Date</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '100px', width: '100px' }}>Status</th>
                      <th className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap" style={{ minWidth: '120px', width: '120px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((payment, idx) => (
                      <tr key={`${payment.id}-${idx}`} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                        <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{payment.company || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">{(payment.name || 'N').charAt(0).toUpperCase()}</div><span className="font-medium text-gray-800 dark:text-gray-100">{payment.name || 'N/A'}</span></div></td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{payment.paymentMode || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{payment.bank || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-medium">₹{(payment.amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{payment.date || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700">{getStatusBadge(payment.status)}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {(payment.status === 'Processing' || payment.status === 'Bounced') ? (
                              <>
                                <button onClick={() => handleView(payment)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><FiEye size={16} /></button>
                                {canEdit && (
                                  <button onClick={() => handleEdit(payment)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit"><FiEdit size={16} /></button>
                                )}
                                {canDelete && (
                                  <button 
                                    onClick={() => handleDeletePayment(payment.id)} 
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    title="Delete"
                                    disabled={deleteLoading}
                                  >
                                    {deleteLoading ? (
                                      <FiRefreshCw className="animate-spin" size={16} />
                                    ) : (
                                      <FiTrash2 size={16} />
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              canDelete && (
                                <button 
                                  onClick={() => handleDeletePayment(payment.id)} 
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                  title="Delete"
                                  disabled={deleteLoading}
                                >
                                  {deleteLoading ? (
                                    <FiRefreshCw className="animate-spin" size={16} />
                                  ) : (
                                    <FiTrash2 size={16} />
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {filteredPayments.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((payment, idx) => (
                  <div key={payment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">{payment.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{payment.name || 'N/A'}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{payment.company || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(payment.status === 'Processing' || payment.status === 'Bounced') ? (
                          <>
                            <button onClick={() => handleView(payment)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><FiEye size={16} /></button>
                            {canEdit && (
                              <button onClick={() => handleEdit(payment)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit"><FiEdit size={16} /></button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDeletePayment(payment.id)} 
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                title="Delete"
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? (
                                  <FiRefreshCw className="animate-spin" size={16} />
                                ) : (
                                  <FiTrash2 size={16} />
                                )}
                              </button>
                            )}
                          </>
                        ) : (
                          canDelete && (
                            <button 
                              onClick={() => handleDeletePayment(payment.id)} 
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                              title="Delete"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? (
                                <FiRefreshCw className="animate-spin" size={16} />
                              ) : (
                                <FiTrash2 size={16} />
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600 dark:text-gray-400">Payment Mode:</span><p className="font-medium text-gray-800 dark:text-gray-100">{payment.paymentMode || 'N/A'}</p></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Bank:</span><p className="font-medium text-gray-800 dark:text-gray-100">{payment.bank || 'N/A'}</p></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Amount:</span><p className="font-medium text-gray-800 dark:text-gray-100">₹{(payment.amount || 0).toLocaleString()}</p></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Date:</span><p className="font-medium text-gray-800 dark:text-gray-100">{payment.date || 'N/A'}</p></div>
                      <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Status:</span><div className="mt-1">{getStatusBadge(payment.status)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                  <select
                    className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                    value={entriesPerPage}
                    onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    {[5, 10, 25, 50, 100].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">entries per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Previous"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Page {currentPage} of {Math.ceil(filteredPayments.length / entriesPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPayments.length / entriesPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(filteredPayments.length / entriesPerPage)}
                    className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${currentPage === Math.ceil(filteredPayments.length / entriesPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Next"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
              {/* Edit Payment Modal */}
              {showEditModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-md w-full">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Edit Cheque Details
                      </h3>
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <FiX className="w-6 h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cheque No
                        </label>
                        <input
                          type="text"
                          value={editForm.chequeNo}
                          onChange={(e) => handleEditFormChange('chequeNo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Enter cheque number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cheque Amount
                        </label>
                        <input
                          type="number"
                          value={editForm.chequeAmount}
                          onChange={(e) => handleEditFormChange('chequeAmount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Deposit Bank
                        </label>
                        <select
                          value={editForm.depositBank}
                          onChange={(e) => handleEditFormChange('depositBank', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                          disabled={bankDetailsLoading}
                        >
                          <option value="">
                            {bankDetailsLoading ? "Loading banks..." : "Select Bank"}
                          </option>
                          {bankDetails.map((bank, index) => {
                            const bankId = bank.id || bank.bank_id || (index + 1).toString();
                            const bankName = bank.name || bank.bank_name || bank.mode_name || bank.toString();
                            return (
                              <option key={bankId} value={bankId}>
                                {bankName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cheque Status
                        </label>
                        <select
                          value={editForm.chequeStatus}
                          onChange={(e) => handleEditFormChange('chequeStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="">Select Status</option>
                          <option value="Processing">Processing</option>
                          <option value="Cleared">Cleared</option>
                          <option value="Bounced">Bounced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status Update Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={editForm.statusUpdateDate}
                            onChange={(e) => handleEditFormChange('statusUpdateDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100 pr-10"
                          />
                          <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {/* View Payment Modal */}
              {showViewModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Payment Details
                      </h3>
                      <button
                        onClick={() => setShowViewModal(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <FiX className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment Information */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Payment Information
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.company || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Mode:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.paymentMode || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.bank || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{(selectedPayment.amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.date || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                              <div>{getStatusBadge(selectedPayment.status)}</div>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cheque No:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.chequeNo || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cheque Date:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.chequeDate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Depositing Bank:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.depositingBank || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated Date:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.updatedDate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated By:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.updatedBy || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Valid Upto:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">{selectedPayment.validUpto || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        {/* Cheque Image */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Cheque Image
                          </h4>
                          {selectedPayment.chequeImg ? (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                              <img 
                                src={`${BASE_URL}/${selectedPayment.chequeImg}`} 
                                alt="Cheque Image" 
                                className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-700"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className=" flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                  <FiFile className="mx-auto text-4xl mb-2" />
                                  <p>Image not available</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="text-center text-gray-500 dark:text-gray-400">
                                <FiFile className="mx-auto text-4xl mb-2" />
                                <p>No cheque image available</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Add Payment Modal */}
              {showAddPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                  <div className="bg-white dark:bg-[#202123] rounded-xl shadow-xl dark:shadow-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Payment</h2>
                    <button
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={closeAddPaymentModal}
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
                          value={addPaymentForm.paymentMode || ''}
                          onChange={handleAddPaymentFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Payment Mode"
                          required
                          disabled={paymentModesLoading}
                        >
                          <option value="">
                            {paymentModesLoading ? 'Loading payment modes...' : 'Payment Mode'}
                          </option>
                          {apiPaymentModes.map(mode => {
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
                        {!paymentModesLoading && apiPaymentModes.length === 0 && (
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
                              value={addPaymentForm.chequeNo}
                              onChange={handleAddPaymentFormChange}
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
                              value={addPaymentForm.chequeAmount}
                              onChange={handleAddPaymentFormChange}
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
                              value={addPaymentForm.chequeDate}
                              onChange={handleAddPaymentFormChange}
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
                              onChange={e => setAddPaymentForm(prev => ({ ...prev, chequeImg: e.target.files[0] }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Bank Name - Hidden for Payment Gateway or Cash selections */}
                      {!isGatewayModeSelected && !isCashModeSelected && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            *Bank Name
                          </label>
                          <select
                            name="bankName"
                            value={addPaymentForm.bankName || ''}
                            onChange={handleAddPaymentFormChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Select Bank"
                            required
                            disabled={bankDetailsLoading}
                          >
                            <option value="">
                              {bankDetailsLoading ? 'Loading bank details...' : 'Select Bank'}
                            </option>
                            {apiBankDetails.map(bank => {
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
                          {!bankDetailsLoading && apiBankDetails.length === 0 && (
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
                          value={addPaymentForm.plan}
                          onChange={handleAddPaymentFormChange}
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
                          value={addPaymentForm.startDate}
                          onChange={handleAddPaymentDateChange}
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
                          value={addPaymentForm.price || ''}
                          onChange={handleAddPaymentFormChange}
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
                          value={addPaymentForm.validUpto || ''}
                          onChange={handleAddPaymentFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                          placeholder="Auto-filled from membership plan"
                          readOnly
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Validity will be automatically filled when you select a membership plan
                        </p>
                      </div>

                      {/* Payment Gateway Selection - Only shown when Payment Gateway is selected */}
                      {selectedPaymentModeName && (
                        selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
                        selectedPaymentModeName.toLowerCase().includes('gateway') ||
                        selectedPaymentModeName.toLowerCase() === 'paymentgateway'
                      ) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            *Select Payment Gateway
                          </label>
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* PhonePe Option */}
                            <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                              addPaymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="PhonePe"
                                checked={selectedGateway === 'PhonePe'}
                                onChange={(e) => setSelectedGateway(e.target.value)}
                                disabled={addPaymentLoading}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                              />
                              <img 
                                src={PhonepeLogo} 
                                alt="PhonePe" 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">PhonePe</span>
                            </label>

                            {/* Separator */}
                            <span className="text-gray-400 dark:text-gray-500">|</span>

                            {/* Razorpay Option */}
                            <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                              addPaymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="Razorpay"
                                checked={selectedGateway === 'Razorpay'}
                                onChange={(e) => setSelectedGateway(e.target.value)}
                                disabled={addPaymentLoading}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <img 
                                src={RazorpayLogo} 
                                alt="Razorpay" 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">Razorpay</span>
                            </label>

                            {/* Separator */}
                            <span className="text-gray-400 dark:text-gray-500">|</span>

                            {/* Stripe Option */}
                            <label className={`flex items-center gap-1 cursor-pointer transition-opacity ${
                              addPaymentLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="Stripe"
                                checked={selectedGateway === 'Stripe'}
                                onChange={(e) => setSelectedGateway(e.target.value)}
                                disabled={addPaymentLoading}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <img 
                                src={StripeLogo} 
                                alt="Stripe" 
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">Stripe</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {addPaymentError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FiAlertCircle />
                            <span>{typeof addPaymentError === 'string' ? addPaymentError : addPaymentError?.message ? addPaymentError.message : JSON.stringify(addPaymentError)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={closeAddPaymentModal}
                          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                          disabled={addPaymentLoading}
                        >
                          Cancel
                        </button>
                        {(() => {
                          // Check if Payment Gateway is selected
                          const isPaymentGateway = selectedPaymentModeName && (
                            selectedPaymentModeName.toLowerCase() === 'payment gateway' || 
                            selectedPaymentModeName.toLowerCase().includes('gateway') ||
                            selectedPaymentModeName.toLowerCase() === 'paymentgateway'
                          );
                          
                          // If Payment Gateway is selected, gateway must be chosen
                          const isGatewayRequired = isPaymentGateway && !selectedGateway;
                          
                          return (
                            <button
                              type="button"
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                              onClick={handleAddPayment}
                              disabled={addPaymentLoading || !addPaymentForm.plan || !addPaymentForm.validUpto || isGatewayRequired}
                            >
                              {addPaymentLoading && <FiRefreshCw className="animate-spin" size={16} />}
                              {addPaymentLoading ? 'Processing...' : 'Confirm Payment'}
                            </button>
                          );
                        })()}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'products':
        if (productsLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
              <div className="flex items-center gap-3">
                <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
                <p className="text-indigo-700 dark:text-indigo-300">Loading products...</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Products</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiBriefcase className="text-indigo-600" />
                <span>Total Products: {products.length}</span>
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
                      placeholder="Search by product name, company, HSN code, or description..."
                      className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      style={{ minWidth: '100%', maxWidth: '100%' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                    <span>Showing {Math.min((productCurrentPage - 1) * productEntriesPerPage + 1, filteredProducts.length)} to {Math.min(productCurrentPage * productEntriesPerPage, filteredProducts.length)} of {filteredProducts.length} entries</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">

                </div>
              </div>
              {/* Table - Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                      <th 
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                        style={{ minWidth: '60px', width: '60px' }}
                        onClick={() => handleProductSort('id')}
                      >
                        Sr No. {renderSortIcon('id')}
                      </th>
                      <th 
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                        style={{ minWidth: '120px', width: '120px' }}
                        onClick={() => handleProductSort('image')}
                      >
                        Product Image {renderSortIcon('image')}
                      </th>
                      <th 
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                        style={{ minWidth: '120px', width: '120px' }}
                        onClick={() => handleProductSort('hsnCode')}
                      >
                        HSN Code {renderSortIcon('hsnCode')}
                      </th>
                      <th 
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                        style={{ minWidth: '150px', width: '150px' }}
                        onClick={() => handleProductSort('product')}
                      >
                        Product Name {renderSortIcon('product')}
                      </th>
                      <th 
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                        style={{ minWidth: '200px', width: '200px' }}
                        onClick={() => handleProductSort('description')}
                      >
                        Product Description {renderSortIcon('description')}
                      </th>
                      <th
                        className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap"
                        style={{ minWidth: '120px', width: '120px' }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedProducts().slice((productCurrentPage - 1) * productEntriesPerPage, productCurrentPage * productEntriesPerPage).map((product, idx) => (
                      <tr key={product.id} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                        <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{(productCurrentPage - 1) * productEntriesPerPage + idx + 1}</td>
                        <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                          {product.image ? (
                            <img
                              src={`${BASE_URL}/${product.image}`}
                              alt={product.product}
                              className="w-16 h-16 object-cover rounded-lg mx-auto"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto" style={{ display: product.image ? 'none' : 'flex' }}>
                            <FiImage className="text-gray-400" size={24} />
                          </div>
                        </td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{product.hsnCode || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-medium">{product.product || 'N/A'}</td>
                        <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                          <div 
                            className="max-h-20 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }}
                          />
                        </td>
                        <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleProductView(product)}
                              className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                              title="View"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleProductEdit(product)}
                              className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                              title="Edit"
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
              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {getSortedProducts().slice((productCurrentPage - 1) * productEntriesPerPage, productCurrentPage * productEntriesPerPage).map((product, idx) => (
                  <div key={product.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {product.image ? (
                          <img
                            src={`${BASE_URL}/${product.image}`}
                            alt={product.product}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center" style={{ display: product.image ? 'none' : 'flex' }}>
                          <FiImage className="text-gray-400" size={24} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-600 dark:text-gray-400">Sr No.:</span><p className="font-semibold text-indigo-700 dark:text-indigo-300">{(productCurrentPage - 1) * productEntriesPerPage + idx + 1}</p></div>
                          <div><span className="text-gray-600 dark:text-gray-400">HSN Code:</span><p className="font-medium text-gray-800 dark:text-gray-100">{product.hsnCode || 'N/A'}</p></div>
                          <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Product Name:</span><p className="font-medium text-gray-800 dark:text-gray-100">{product.product || 'N/A'}</p></div>
                          <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Description:</span><div className="mt-1 max-h-20 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }} /></div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleProductView(product)}
                            className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                            title="View"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => handleProductEdit(product)}
                            className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                  <select
                    className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                    value={productEntriesPerPage}
                    onChange={e => { setProductEntriesPerPage(Number(e.target.value)); setProductCurrentPage(1); }}
                  >
                    {[5, 10, 25, 50, 100].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">entries per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductCurrentPage(p => Math.max(1, p - 1))}
                    disabled={productCurrentPage === 1}
                    className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${productCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Previous"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Page {productCurrentPage} of {Math.ceil(filteredProducts.length / productEntriesPerPage)}
                  </span>
                  <button
                    onClick={() => setProductCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / productEntriesPerPage), p + 1))}
                    disabled={productCurrentPage === Math.ceil(filteredProducts.length / productEntriesPerPage)}
                    className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${productCurrentPage === Math.ceil(filteredProducts.length / productEntriesPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Next"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderUserProfile();
    }
  };

  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{ __html: chromeTabStyles }} />
      <div className="flex flex-col gap-4 py-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiChevronLeft size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
              {activeTab === 'user-profile' ? 'User Profile' : activeTab === 'business-profile' ? 'Business Profile' : 'Member Profile'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiUser className="text-indigo-600" />
            <span>Member ID: {memberId}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="chrome-tabs-wrapper">
          <div
            className="chrome-tabs-container"
            role="tablist"
            aria-label="Member detail sections"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`chrome-tab-button${isActive ? ' active' : ''}`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="chrome-tabs-underline" />
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">

          
          <div className="flex items-center gap-2">
            {/* User Profile Tab - Show buttons only when editing user profile */}
            {activeTab === 'user-profile' && editUserMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiEdit2 size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX size={16} />
                  Cancel
                </button>
              </>
            ) : activeTab === 'business-profile' && editBusinessMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiEdit2 size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX size={16} />
                  Cancel
                </button>
              </>
            ) : (activeTab === 'company-documents' ? (
              <button
                onClick={() => openDocumentModal('company')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FiFileText size={16} />
                Add Document
              </button>
            ) : activeTab === 'personal-documents' ? (
              <button
                onClick={() => openDocumentModal('personal')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FiFileText size={16} />
                Add Document
              </button>
            ) : activeTab === 'products' ? (
              <button
                onClick={openProductModal}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center gap-2"
              >
                <FiPlus size={16} />
                Add Product
              </button>
            ) : activeTab === 'payment-details' ? (
              // Payment details has its own buttons inside the content area
              null
            ) : (
              canEdit && (
                <button
                  onClick={handleEditData}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <FiEdit2 size={16} />
                  Edit Data
                </button>
              )
            ))}
          </div>
        </div>

        {/* Profile Content */}
        {renderTabContent()}
      </div>
      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeDocumentModal}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-800">Add Document</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={documentType}
                onChange={e => {
                  console.log('🔍 DEBUG: Document type dropdown changed:', {
                    selectedValue: e.target.value,
                    documentSection: documentSection,
                    availableDocumentTypes: documentTypes,
                    selectedDocumentType: documentTypes.find(dt => dt.value === e.target.value)
                  });
                  setDocumentType(e.target.value);
                }}
                disabled={documentTypesLoading}
              >
                {documentTypesLoading ? (
                  <option>Loading...</option>
                ) : (
                  documentTypes.map(dt => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))
                )}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                value={documentDescription}
                onChange={e => setDocumentDescription(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Upload Document</label>
              <input
                type="file"
                className="w-full border rounded-lg px-3 py-2"
                onChange={e => setDocumentFile(e.target.files[0])}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={closeDocumentModal}
              >
                Close
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleDocumentSave}
                disabled={!documentType || !documentFile}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document View Modal */}
      {showDocumentViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Document Details
              </h3>
              <button
                onClick={closeDocumentViewModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Document Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedDocument.doc_type || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedDocument.belongs_to === 'company' ? 'Company Document' : 'Personal Document'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Uploaded:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedDocument.created_at ? 
                          new Date(selectedDocument.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Image */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Document Preview
                  </h4>
                  
                  {selectedDocument.document_path ? (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img 
                        src={`${BASE_URL}/${selectedDocument.document_path}`} 
                        alt="Document Preview" 
                        className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400" style={{ display: 'none' }}>
                        <div className="text-center">
                          <FiFileText className="mx-auto text-4xl mb-2" />
                          <p>Document not available</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <FiFileText className="mx-auto text-4xl mb-2" />
                        <p>No document available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description Section */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Description
                </h4>
                <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {selectedDocument.description ? 
                    selectedDocument.description
                      .replace(/<[^>]*>/g, '') // Remove HTML tags
                      .replace(/\n/g, '<br />') // Convert newlines to HTML breaks
                      .split('<br />')
                      .map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {line.trim() || '\u00A0'} {/* Use non-breaking space for empty lines */}
                        </p>
                      ))
                    : 'No description available'}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={closeDocumentViewModal}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeProductModal}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">{isEditingProduct ? 'Edit Product' : 'Add Product'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* HSN/SAC Code */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  * HSN/SAC Code
                </label>
                <input
                  type="text"
                  placeholder="Enter HSN Code"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={productForm.hsnCode}
                  onChange={(e) => handleProductFormChange('hsnCode', e.target.value)}
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  * Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Product Name"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={productForm.productName}
                  onChange={(e) => handleProductFormChange('productName', e.target.value)}
                />
              </div>
            </div>

            {/* Product Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                onChange={(e) => handleProductFormChange('productImage', e.target.files[0])}
              />
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Product Description
              </label>
              <div className="border rounded-lg focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400">
                <RichTextEditor
                  data={productForm.productDescription}
                  onChange={(data) => handleProductFormChange('productDescription', data)}
                  placeholder="Enter product description..."
                  height="300px"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                onClick={closeProductModal}
              >
                Close
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleProductSave}
                disabled={productSaving || !productForm.hsnCode || !productForm.productName}
              >
                {productSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    {isEditingProduct ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    {isEditingProduct ? 'Update Product' : 'Save Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      {showProductViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Details</h3>
              <button
                onClick={() => { setShowProductViewModal(false); setSelectedProduct(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">HSN/SAC Code:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.hsnCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Product Name:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.product || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.company || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedProduct.dtime ? new Date(selectedProduct.dtime).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Image</h4>
                  {selectedProduct.image ? (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={`${BASE_URL}/${selectedProduct.image}`}
                        alt="Product Image"
                        className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400" style={{ display: 'none' }}>
                        <div className="text-center">
                          <FiFile className="mx-auto text-4xl mb-2" />
                          <p>Image not available</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <FiFile className="mx-auto text-4xl mb-2" />
                        <p>No image available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h4>
                <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {(() => {
                    const description = selectedProduct.description || 'No description available';
                    return description
                      .replace(/<[^>]*>/g, '')
                      .replace(/\n/g, '<br />')
                      .split('<br />')
                      .map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">{line.trim() || '\u00A0'}</p>
                      ));
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowProductViewModal(false); setSelectedProduct(null); }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowEditPaymentModal(false)}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-800">Edit Payment</h2>
            
            <form onSubmit={handleEditPaymentSubmit}>
              <div className="space-y-4">
                {/* Payment Mode */}
                <div>
                                    <label className="block text-sm font-medium mb-1">
                    Payment Mode *
                  </label>
                  <select
                    name="paymentMode"
                    value={editPaymentForm.paymentMode}
                    onChange={handleEditPaymentChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    disabled={paymentModesLoading}
                  >
                    <option value="">
                      {paymentModesLoading ? 'Loading payment modes...' : 'Select Payment Mode'}
                    </option>
                    {apiPaymentModes.map(mode => {
                      // Handle different possible data structures
                      const modeId = mode.id || mode.mode_id || mode;
                      const modeName = mode.mode_name || mode.name || mode.mode || mode;
                      
                      // Ensure we have a string for display
                      const displayName = typeof modeName === 'string' ? modeName : JSON.stringify(modeName);
                      
                      return (
                        <option key={modeId} value={displayName}>
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
                  {!paymentModesLoading && apiPaymentModes.length === 0 && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      No payment modes available
                    </p>
                  )}
                  {paymentFormErrors.paymentMode && (
                    <p className="text-red-500 text-xs mt-1">{paymentFormErrors.paymentMode}</p>
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bank Name *
                  </label>
                  <select
                    name="bankName"
                    value={editPaymentForm.bankName}
                    onChange={handleEditPaymentChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  >
                    {bankNames.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  {paymentFormErrors.bankName && (
                    <p className="text-red-500 text-xs mt-1">{paymentFormErrors.bankName}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={editPaymentForm.date}
                    onChange={handleEditPaymentChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                  {paymentFormErrors.date && (
                    <p className="text-red-500 text-xs mt-1">{paymentFormErrors.date}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={editPaymentForm.amount}
                    onChange={handleEditPaymentChange}
                    placeholder="Enter amount"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                  {paymentFormErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">{paymentFormErrors.amount}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  onClick={() => setShowEditPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savePaymentLoading}
                >
                  {savePaymentLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiEdit size={16} />
                      Update Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 
