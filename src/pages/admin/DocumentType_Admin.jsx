import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import {
  FiSearch,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiFile,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiPlus,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiSave,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";

import { getAuthHeaders } from "../../utils/apiHeaders";

export default function DocumentType() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState([]);

  const [showUploadForm, setShowUploadForm] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingDocumentType, setEditingDocumentType] = useState(null);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [submitting, setSubmitting] = useState(false);

     // Form state for add/edit
       const [formData, setFormData] = useState({
      documentType: "",
      description: "",
      belongsTo: "", // empty by default to show "Select"
      required: false,
    });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    filterDocumentTypes();
  }, [documentTypes, searchTerm]);

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view document types");
        window.location.href = "/";
        return;
      }

      console.log('Fetching document types with credentials:', { uid, token });
      
             const response = await api.post("/UserDetail/getDocType", {}, {
         headers: getAuthHeaders()
       });
      
             console.log('Document types API response:', response.data);
       console.log('Response status:', response.status);
       console.log('Response headers:', response.headers);
       
       let mappedDocumentTypes = [];
       
       // Try different response structures
       if (response.data?.data && Array.isArray(response.data.data)) {
         const apiDocumentTypes = response.data.data;
         console.log('Found document types array with', apiDocumentTypes.length, 'items');
         
         mappedDocumentTypes = apiDocumentTypes.map((docType, index) => {
           return {
             id: docType.id || docType.doc_id || docType.document_id || docType.document_type_id || index + 1,
             documentType: docType.document_type || docType.name || docType.type || '',
             description: docType.description || docType.desc || '',
             belongsTo: docType.belongs_to || docType.document_for || docType.category || docType.for || 'user',
             required: docType.is_required === '1' || docType.is_required === true || docType.required === '1' || docType.required === true || docType.mandatory === '1' || docType.mandatory === true,
             created_at: docType.created_at || docType.created_date || new Date().toISOString(),
             updated_at: docType.updated_at || docType.updated_date || new Date().toISOString(),
           };
         });
       } else if (response.data && Array.isArray(response.data)) {
         const apiDocumentTypes = response.data;
         console.log('Found document types array with', apiDocumentTypes.length, 'items');
         
         mappedDocumentTypes = apiDocumentTypes.map((docType, index) => {
           return {
             id: docType.id || docType.doc_id || docType.document_id || docType.document_type_id || index + 1,
             documentType: docType.document_type || docType.name || docType.type || '',
             description: docType.description || docType.desc || '',
             belongsTo: docType.belongs_to || docType.document_for || docType.category || docType.for || 'user',
             required: docType.is_required === '1' || docType.is_required === true || docType.required === '1' || docType.required === true || docType.mandatory === '1' || docType.mandatory === true,
             created_at: docType.created_at || docType.created_date || new Date().toISOString(),
             updated_at: docType.updated_at || docType.updated_date || new Date().toISOString(),
           };
         });
       } else if (response.data?.document_types && Array.isArray(response.data.document_types)) {
         // Alternative response structure
         const apiDocumentTypes = response.data.document_types;
         console.log('Found document types array with', apiDocumentTypes.length, 'items');
         
         mappedDocumentTypes = apiDocumentTypes.map((docType, index) => {
           return {
             id: docType.id || docType.doc_id || docType.document_id || docType.document_type_id || index + 1,
             documentType: docType.document_type || docType.name || docType.type || '',
             description: docType.description || docType.desc || '',
             belongsTo: docType.belongs_to || docType.document_for || docType.category || docType.for || 'user',
             required: docType.is_required === '1' || docType.is_required === true || docType.required === '1' || docType.required === true || docType.mandatory === '1' || docType.mandatory === true,
             created_at: docType.created_at || docType.created_date || new Date().toISOString(),
             updated_at: docType.updated_at || docType.updated_date || new Date().toISOString(),
           };
         });
       } else {
         // No data found, set empty array
         console.log('No document types found in response. Response structure:', response.data);
         mappedDocumentTypes = [];
       }
      
      setDocumentTypes(mappedDocumentTypes);
      setFilteredDocumentTypes(mappedDocumentTypes);
      console.log('Final mapped document types:', mappedDocumentTypes);
      
         } catch (error) {
       console.error('Error fetching document types:', error);
       console.error('Error response:', error.response);
       console.error('Error message:', error.message);
       
       let errorMessage = 'Failed to fetch document types';
       if (error.response?.status === 401) {
         errorMessage = 'Authentication failed. Please log in again.';
       } else if (error.response?.status === 403) {
         errorMessage = 'Access denied. You do not have permission to view document types.';
       } else if (error.response?.status === 404) {
         errorMessage = 'API endpoint not found. Please check the configuration.';
       } else if (error.response?.data?.message) {
         errorMessage = error.response.data.message;
       }
       
       toast.error(errorMessage);
       setDocumentTypes([]);
       setFilteredDocumentTypes([]);
     } finally {
      setLoading(false);
    }
  };

  const filterDocumentTypes = () => {
    const filtered = documentTypes.filter(
      (docType) =>
        (docType.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (docType.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (docType.belongsTo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocumentTypes(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getSortedDocumentTypes = () => {
    if (!sortField) return filteredDocumentTypes;
    
    return [...filteredDocumentTypes].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FiChevronDown className="text-gray-400" />;
    return sortDirection === "asc" ? <FiChevronUp className="text-blue-500" /> : <FiChevronDown className="text-blue-500" />;
  };

  const handleAdd = () => {
    setFormData({
      documentType: "",
      description: "",
      belongsTo: "",
      required: false,
    });
    setShowAddModal(true);
  };

  const handleEdit = (docType) => {
    setEditingDocumentType(docType);
    setFormData({
      documentType: docType.documentType,
      description: docType.description,
      belongsTo: docType.belongsTo,
      required: docType.required,
    });
    setShowEditModal(true);
  };



  const handleDelete = async (docType) => {
    if (window.confirm(`Are you sure you want to delete "${docType.documentType}"?`)) {
      try {
        setSubmitting(true);
                                   const response = await api.delete(`/GroupSettings/delete_document/${docType.id}`, {
            headers: getAuthHeaders()
          });
        
        if (response.data?.status === 'success') {
          toast.success('Document type deleted successfully!');
          fetchDocumentTypes();
        } else {
          toast.error(response.data?.message || 'Failed to delete document type');
        }
      } catch (error) {
        console.error('Error deleting document type:', error);
        toast.error('Failed to delete document type');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Validate required fields for new document types
      if (!editingDocumentType) {
        if (!formData.belongsTo) {
          toast.error('Please select whether this document type belongs to User or Company');
          return;
        }
        if (!formData.documentType.trim()) {
          toast.error('Please enter a document type name');
          return;
        }
      }
      
      const payload = {
        document_type: formData.documentType,
        description: formData.description,
        ...(editingDocumentType ? {} : { belongs_to: formData.belongsTo }), // Only include belongs_to for new documents
        is_required: formData.required ? '1' : '0',
      };

      let response;
             if (editingDocumentType) {
                   // Update existing
          response = await api.put(`/GroupSettings/edit_document/${editingDocumentType.id}`, payload, {
            headers: getAuthHeaders()
          });
       } else {
         // Create new
         response = await api.post('/GroupSettings/documentType_upload', payload, {
           headers: getAuthHeaders()
         });
       }

      if (response.data?.status === 'success') {
        toast.success(editingDocumentType ? 'Document type updated successfully!' : 'Document type created successfully!');
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingDocumentType(null);
        fetchDocumentTypes();
      } else {
        toast.error(response.data?.message || 'Failed to save document type');
      }
    } catch (error) {
      console.error('Error saving document type:', error);
      toast.error('Failed to save document type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingDocumentType(null);
    setFormData({
      documentType: "",
      description: "",
      belongsTo: "",
      required: false,
    });
  };



  // Pagination
  const totalEntries = filteredDocumentTypes.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const endIdx = startIdx + entriesPerPage;
  const paginatedDocumentTypes = getSortedDocumentTypes().slice(startIdx, endIdx);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading && documentTypes.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700">Loading document types...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-600">Document Types</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <FiFileText className="text-indigo-600" />
            <span>Total: {documentTypes.length} document types</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 max-w-7xl w-full mx-auto border border-gray-200 dark:border-gray-700">
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end">
              <button className="flex items-center gap-1 bg-blue-500 text-white px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 transition" onClick={fetchDocumentTypes} disabled={loading} title="Refresh Document Types">
                <FiRefreshCw className={loading ? "animate-spin" : ""} /> 
                <span>Refresh</span>
              </button>
              <button className="flex items-center gap-1 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition" onClick={handleAdd}>
                <FiPlus /> 
                <span>Add Doc Type</span>
              </button>
            </div>
          </div>

          {/* Search and Entries */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search document types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors text-sm w-full sm:w-64"
                />
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <FiFilter className="text-indigo-600" />
                <span>Filtered: {filteredDocumentTypes.length} results</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={handleEntriesChange}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
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
                    onClick={() => handleSort('id')}
                  >
                    S.No {renderSortIcon('id')}
                  </th>
                  <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '150px', width: '150px' }}
                    onClick={() => handleSort('documentType')}
                  >
                    Document Type {renderSortIcon('documentType')}
                  </th>
                  <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '200px', width: '200px' }}
                    onClick={() => handleSort('description')}
                  >
                    Description {renderSortIcon('description')}
                  </th>
                  <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '120px', width: '120px' }}
                    onClick={() => handleSort('belongsTo')}
                  >
                    Belongs To {renderSortIcon('belongsTo')}
                  </th>
                  <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '100px', width: '100px' }}
                    onClick={() => handleSort('required')}
                  >
                    Required {renderSortIcon('required')}
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
                {paginatedDocumentTypes.map((docType, idx) => (
                  <tr key={docType.id} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{startIdx + idx + 1}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-medium">{docType.documentType || 'N/A'}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{docType.description || 'N/A'}</td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        docType.belongsTo === 'company' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                      }`}>
                        {docType.belongsTo === 'company' ? 'Company' : 'User'}
                      </span>
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                      {docType.required ? (
                        <FiCheckCircle className="text-green-500 mx-auto" size={16} />
                      ) : (
                        <FiXCircle className="text-gray-400 mx-auto" size={16} />
                      )}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(docType)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(docType)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                          disabled={submitting}
                        >
                          <FiTrash2 size={14} />
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
            {paginatedDocumentTypes.map((docType, idx) => (
              <div key={docType.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-1">{docType.documentType || 'N/A'}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{docType.description || 'N/A'}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        docType.belongsTo === 'company' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                      }`}>
                        {docType.belongsTo === 'company' ? 'Company' : 'User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {docType.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(docType)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(docType)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete"
                      disabled={submitting}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  ID: {docType.id}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Showing {Math.min(startIdx + 1, totalEntries)} to {Math.min(endIdx, totalEntries)} of {totalEntries} entries</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={closeModals}
              >
                <FiX size={24} />
              </button>
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                {showAddModal ? 'Add Document Type' : 'Edit Document Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Document Type Name *</label>
                  <input
                    type="text"
                    value={formData.documentType}
                    onChange={(e) => handleFormChange('documentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                    placeholder="Enter document type name"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                    placeholder="Enter description"
                    rows={3}
                    disabled={submitting}
                  />
                </div>
                
                {/* Belongs To field - only show in add form */}
                {showAddModal && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Belongs To <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.belongsTo}
                      onChange={(e) => handleFormChange('belongsTo', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors ${
                        formData.belongsTo === '' ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      required
                      disabled={submitting}
                    >
                      <option value="">Select</option>
                      <option value="user">User (Personal Documents)</option>
                      <option value="company">Company (Business Documents)</option>
                    </select>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      Select whether this document type is for individual users or company/business purposes
                    </p>
                    {formData.belongsTo === '' && (
                      <p className="text-red-500 text-xs mt-1">Please select whether this document type belongs to User or Company</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={formData.required}
                    onChange={(e) => handleFormChange('required', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={submitting}
                  />
                  <label htmlFor="required" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Required Document
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        {showAddModal ? 'Add' : 'Update'}
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
