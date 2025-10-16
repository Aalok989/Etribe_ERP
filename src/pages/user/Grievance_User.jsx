import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/Layout/DashboardLayout";
import { FiPlus, FiX, FiUpload, FiSearch, FiRefreshCw, FiDownload, FiCopy, FiChevronDown, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiUser, FiCalendar, FiEye, FiFile } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import RichTextEditor from '../../components/shared/RichTextEditor';

export default function Grievances() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    grievance: '',
    grievance_file: null
  });
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      // Handle file upload
      const file = files[0];
      const maxSizeInMB = 5; // 5MB limit
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (file.size > maxSizeInBytes) {
        toast.error(`File size must be less than ${maxSizeInMB}MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = ''; // Clear the file input
        return;
      }
      
      // Check file type - allow images, PDFs, and documents
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid file (Images, PDF, DOC, or DOCX)');
        e.target.value = ''; // Clear the file input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditorChange = (data) => {
    setFormData(prev => ({
      ...prev,
      grievance: data
    }));
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  useEffect(() => {
    filterGrievances();
  }, [grievances, searchTerm]);

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view grievances");
        window.location.href = "/";
        return;
      }

      // Use the grievance by ID endpoint with the current user's ID
      const currentUid = uid;
      console.log('Fetching grievances for user ID:', currentUid, 'with credentials:', { uid, token });
      
      const response = await api.get(`/grievances/grevancebyId/${currentUid}`, {
        headers: getAuthHeaders()
      });
      
      console.log('Grievances API response:', response.data);
      
      let mappedGrievances = [];
      
      // Handle different possible response structures for grievance by ID endpoint
      let apiGrievances = [];
      
      if (response.data && response.data.grievances && Array.isArray(response.data.grievances)) {
        // Structure: { grievances: [...] }
        apiGrievances = response.data.grievances;
      } else if (response.data && Array.isArray(response.data)) {
        // Structure: [...] (direct array)
        apiGrievances = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Structure: { data: [...] }
        apiGrievances = response.data.data;
      } else if (response.data && response.data.grievance && Array.isArray(response.data.grievance)) {
        // Structure: { grievance: [...] }
        apiGrievances = response.data.grievance;
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Structure: { grievance: {...} } - single grievance object
        apiGrievances = [response.data.grievance || response.data];
      }
      
      if (apiGrievances.length > 0) {
        console.log('Found grievances array with', apiGrievances.length, 'items');
        
        mappedGrievances = apiGrievances.map((grievance, index) => {
          console.log(`Mapping grievance ${index + 1}:`, grievance);
          
          return {
            id: grievance.id || grievance.grievance_id || index + 1,
            title: grievance.subject || grievance.title || '',
            description: grievance.description || grievance.grievance || '',
            status: grievance.status || 'Pending',
            submittedBy: grievance.posted_by || grievance.submitted_by || grievance.user_name || '',
            submittedDate: grievance.posted_date || grievance.created_at || grievance.created_date || '',
            lastUpdated: grievance.updated_at || grievance.updated_date || grievance.posted_date || '',
            file: grievance.file || grievance.grievance_file || grievance.attachment || null
          };
        });
        
        setGrievances(mappedGrievances);
        console.log('Final mapped grievances:', mappedGrievances);
      } else {
        console.log('No grievances found in API response');
        console.log('Available keys in response.data:', Object.keys(response.data || {}));
        setGrievances([]);
      }
    } catch (err) {
      console.error('Error fetching grievances:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to fetch grievances");
      }
      
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGrievances = () => {
    const filtered = grievances.filter(
      (grievance) =>
        (grievance.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grievance.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grievance.submittedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGrievances(filtered);
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.subject.trim() || !formData.grievance.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to submit grievance");
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('Subject', formData.subject);
      formDataToSend.append('Grievance', formData.grievance);
      
      if (formData.grievance_file) {
        formDataToSend.append('grievance_file', formData.grievance_file);
      }

      // Send to API using axios instance
      const response = await api.post('/grievances/add_grievance', formDataToSend, {
        headers: getAuthHeaders()
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Grievance submitted successfully!");
        setFormData({
          subject: '',
          grievance: '',
          grievance_file: null
        });
        setShowAddForm(false);
        fetchGrievances(); // Refresh the list
      } else {
        console.error('API Error Response:', response.status, response.statusText);
        let errorMessage = 'Failed to submit grievance';
        try {
          const errorData = response.data;
          console.error('Error Response Body:', errorData);
          if (errorData) {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting grievance:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to submit grievance. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData({
      subject: '',
      grievance: '',
      grievance_file: null
    });
    setShowAddForm(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300', icon: '🟢' },
      'Pending': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-300', icon: '🟡' },
      'Closed': { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-300', icon: '🔴' }
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        {status || 'Pending'}
      </span>
    );
  };

  const handleView = async (grievance) => {
    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view grievance details");
        return;
      }

      // Fetch detailed grievance data
      const response = await api.get(`/grievances/grevancebyId/${grievance.id}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 200 && response.data) {
        console.log('Detailed grievance data:', response.data);
        
        // Map the detailed data to our format
        const detailedGrievance = {
          ...grievance,
          // Override with detailed data if available
          title: response.data.subject || grievance.title,
          description: response.data.description || response.data.grievance || grievance.description,
          status: response.data.status || grievance.status,
          submittedBy: response.data.posted_by || grievance.submittedBy,
          submittedDate: response.data.posted_date || response.data.created_at || grievance.submittedDate,
          lastUpdated: response.data.updated_at || grievance.lastUpdated,
          file: response.data.file || response.data.grievance_file || grievance.file,
          // Additional detailed fields
          category: response.data.category,
          priority: response.data.priority,
          response: response.data.response,
          responseDate: response.data.response_date,
          assignedTo: response.data.assigned_to,
          department: response.data.department
        };
        
        setSelectedGrievance(detailedGrievance);
        setShowViewModal(true);
      } else {
        // Fallback to basic grievance data if API fails
        setSelectedGrievance(grievance);
        setShowViewModal(true);
        console.warn('Failed to fetch detailed grievance, using basic data');
      }
    } catch (error) {
      console.error('Error fetching detailed grievance:', error);
      // Fallback to basic grievance data if API fails
      setSelectedGrievance(grievance);
      setShowViewModal(true);
      toast.warning('Could not fetch detailed grievance data, showing basic information');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchGrievances();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredGrievances.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredGrievances.length / entriesPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading your grievances...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600">Grievances</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Submit and view your grievance complaints</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiAlertTriangle className="text-green-600" />
              <span>Total: {grievances.length}</span>
            </div>
            <button 
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <FiRefreshCw /> 
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiPlus size={20} />
              Add Grievance
            </button>
          </div>
        </div>

        {/* Information Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-blue-700 dark:text-blue-300 text-lg mb-2">
              Please feel free to share your grievances in this section.
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              We will try our best to find a suitable solution.
            </p>
          </div>
        </div>

        {/* Search and Export Controls */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search grievances by title, description, submitted by..."
                  className="pl-10 pr-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-green-400 transition-colors w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredGrievances.length)} of {filteredGrievances.length} entries</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="hidden xl:flex gap-2">
                <button 
                  className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                  onClick={() => navigator.clipboard.writeText(filteredGrievances.map((g, i) => `${i+1}. ${g.title} - ${g.status} - ${g.submittedBy}`).join('\n'))}
                  title="Copy to Clipboard"
                >
                  <FiCopy /> 
                  Copy
                </button>
              </div>
              
              {/* Mobile Export Dropdown */}
              <div className="relative xl:hidden">
                <button
                  className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
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
                      onClick={() => {
                        navigator.clipboard.writeText(filteredGrievances.map((g, i) => `${i+1}. ${g.title} - ${g.status} - ${g.submittedBy}`).join('\n'));
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiCopy className="text-gray-500" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grievances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentEntries.map((grievance, idx) => (
            <div key={grievance.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
              {/* Compact Header */}
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2 leading-tight">
                      {grievance.title || 'Untitled Grievance'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => handleView(grievance)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="View Details"
                    >
                      <FiEye size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Brief Description */}
                <div className="mb-3">
                  <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {grievance.description ? 
                      grievance.description.replace(/<[^>]*>/g, '').trim().substring(0, 80) + (grievance.description.length > 80 ? '...' : '') || 'No description' 
                      : 'No description'}
                  </p>
                </div>
                
                {/* File Attachment Indicator */}
                {grievance.file && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">📎 Attachment</span>
                  </div>
                )}
              </div>

              {/* Compact Details - Always at bottom */}
              <div className="px-4 pb-4 space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-xs">
                  <FiUser className="text-gray-400 flex-shrink-0 w-3 h-3" />
                  <span className="text-gray-600 dark:text-gray-400">By:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">{grievance.submittedBy || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <FiCalendar className="text-gray-400 flex-shrink-0 w-3 h-3" />
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                    {grievance.submittedDate ? new Date(grievance.submittedDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentEntries.length === 0 && !loading && (
          <div className="text-center py-12">
            <FiAlertTriangle className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No grievances found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No grievances match your search criteria.' : 'No grievances at the moment.'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredGrievances.length > 0 && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                <select
                  className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-green-400 transition-colors"
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
                  className={`p-2 rounded-lg text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-gray-700 transition-colors ${
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
                  className={`p-2 rounded-lg text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-gray-700 transition-colors ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Next"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Grievance Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Grievance</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter grievance subject"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Grievance
                    </label>
                    <RichTextEditor
                      data={formData.grievance}
                      onChange={handleEditorChange}
                      placeholder="Please describe your grievance in detail..."
                      height="200px"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload File (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        name="grievance_file"
                        onChange={handleInputChange}
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        id="grievanceFile"
                      />
                      <label
                        htmlFor="grievanceFile"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <FiUpload size={16} />
                        Choose File
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formData.grievance_file ? formData.grievance_file.name : "No file chosen"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum file size: 5MB. Supported formats: Images, PDF, DOC, DOCX
                    </p>
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Submit Grievance
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Grievance Modal */}
        {showViewModal && selectedGrievance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Grievance Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Grievance Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Grievance Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Title:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">
                          {selectedGrievance.title || 'N/A'}
                        </span>
                      </div>
                      

                      
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted By:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">
                          {selectedGrievance.submittedBy || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted Date:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedGrievance.submittedDate ? 
                            new Date(selectedGrievance.submittedDate).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                        </span>
                      </div>

                      {/* Additional detailed fields */}
                      {selectedGrievance.category && (
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedGrievance.category}
                          </span>
                        </div>
                      )}

                      {selectedGrievance.priority && (
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedGrievance.priority}
                          </span>
                        </div>
                      )}

                      {selectedGrievance.department && (
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedGrievance.department}
                          </span>
                        </div>
                      )}

                      {selectedGrievance.assignedTo && (
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedGrievance.assignedTo}
                          </span>
                        </div>
                      )}

                      {selectedGrievance.lastUpdated && (
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(selectedGrievance.lastUpdated).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Attachment Image */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Attachment
                    </h4>
                    
                    {selectedGrievance.file ? (
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL}/${selectedGrievance.file}`} 
                          alt="Grievance Attachment" 
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
                          <p>No attachment available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Description and Response Section */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Description
                  </h4>
                  <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                    {selectedGrievance.description ? 
                      selectedGrievance.description
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
                  
                  {/* Response Section */}
                  {selectedGrievance.response && (
                    <div className="space-y-3 mt-4">
                      <h5 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                        Response
                      </h5>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div 
                          className="text-sm text-gray-700 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: selectedGrievance.response }}
                        />
                        {selectedGrievance.responseDate && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Responded on: {new Date(selectedGrievance.responseDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
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
      </div>
    </DashboardLayout>
  );
} 