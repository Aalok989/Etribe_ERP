import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/admin/DashboardLayout";
import { FiSearch, FiRefreshCw, FiDownload, FiCopy, FiFile, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiFileText, FiEye, FiEdit2, FiTrash2, FiX, FiCalendar, FiSettings } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePermissions } from "../../context/PermissionContext";



export default function Circulars() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get permissions for Notifications module (module_id: 12)
  const { hasPermission } = usePermissions();
  const NOTIFICATIONS_MODULE_ID = 12;
  const canView = hasPermission(NOTIFICATIONS_MODULE_ID, 'view');
  const canAdd = hasPermission(NOTIFICATIONS_MODULE_ID, 'add');
  const canEdit = hasPermission(NOTIFICATIONS_MODULE_ID, 'edit');
  const canDelete = hasPermission(NOTIFICATIONS_MODULE_ID, 'delete');
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredCirculars, setFilteredCirculars] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    circularNumber: '',
    subject: '',
    body: '',
    date: '',
    file: null
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    circularNumber: '',
    subject: '',
    body: '',
    date: '',
    file: null
  });

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState(null);

  useEffect(() => {
    fetchCirculars();
  }, []);

  useEffect(() => {
    filterCirculars();
  }, [circulars, search]);

  // Helper function to map circular data with comprehensive fallbacks
  const mapCircularData = (circular, index) => {
    const mappedCircular = {
      id: circular.id || index + 1,
      circularNo: circular.circular_no || circular.circularNo || circular.circular_number || '',
      subject: circular.subject || circular.title || circular.name || circular.circular_subject || circular.subject_title || '',
      date: circular.date || circular.created_at || circular.uploaded_on || new Date().toISOString().split('T')[0],
      description: circular.body || circular.description || circular.content || circular.body_content || circular.message || circular.text || circular.circular_body || circular.circular_content || circular.notification_body || '',
      body: circular.body || circular.description || circular.content || circular.body_content || circular.message || circular.text || circular.circular_body || circular.circular_content || circular.notification_body || '',
      file: circular.file || circular.file_path || circular.document || circular.attachment || '',
      file_path: circular.file_path || circular.file || circular.document || circular.attachment || '',
      document: circular.document || circular.file || circular.file_path || circular.attachment || ''
    };
    
    return mappedCircular;
  };

  const fetchCirculars = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please log in to view circulars");
        window.location.href = "/";
        return;
      }

      const uid = localStorage.getItem("uid");
      
      const response = await api.post("/notifications/get_all_circulars", {}, {
        headers: getAuthHeaders()
      });
      
      // Handle the API response data
      if (response.data?.data) {
        // If the API returns data in response.data.data format
        const apiCirculars = response.data.data;
        const mappedCirculars = Array.isArray(apiCirculars) ? apiCirculars.map((circular, index) => mapCircularData(circular, index)) : [];
        
        setCirculars(mappedCirculars);
      } else if (response.data) {
        // If the API returns data directly in response.data
        const apiCirculars = Array.isArray(response.data) ? response.data : [response.data];
        const mappedCirculars = apiCirculars.map((circular, index) => mapCircularData(circular, index));
        
        setCirculars(mappedCirculars);
      } else {
        // No data found in API response
        setCirculars([]);
      }
    } catch (err) {
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } else if (err.response?.status === 404) {
        toast.error("Circulars endpoint not found. Please check the API configuration.");
      } else {
      toast.error(err.response?.data?.message || err.message || "Failed to fetch circulars");
      }
      
      // Set empty array on error instead of mock data
      setCirculars([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCirculars = () => {
    const filtered = circulars.filter(
      (circular) =>
        circular.circularNo.toString().toLowerCase().includes(search.toLowerCase()) ||
        circular.subject.toLowerCase().includes(search.toLowerCase()) ||
        circular.date.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCirculars(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const handleView = (id) => {
    // Find the circular by ID
    const circular = circulars.find(c => c.id === id);
    if (!circular) {
      toast.error("Circular not found");
      return;
    }

    // Always show the modal first, regardless of whether there's a file or not
    setSelectedCircular(circular);
    setShowViewModal(true);
  };

  const downloadCircularFile = async (fileUrl, fileName) => {
    try {
      // Get authentication token
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token || !uid) {
        toast.error("Authentication required to download files");
        return;
      }

      // Try to fetch the file with authentication headers
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        toast.error(`Failed to download file: ${response.status} ${response.statusText}`);
        return;
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'circular';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully!");
    } catch (error) {
      // Fallback: try direct link approach
      try {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'circular';
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download initiated...");
      } catch (fallbackError) {
        toast.error("Failed to download file. Please try again or contact support.");
      }
    }
  };

  const openCircularFile = async (circular) => {
    const filePath = circular.file || circular.file_path || circular.document || circular.attachment;
    if (!filePath) {
      toast.error("No file available for this circular");
      return;
    }

    try {
      // Construct the full URL for the circular file
      const fileUrl = filePath.startsWith('http') 
        ? filePath 
        : `${BASE_URL}/${filePath}`;
      
      // Get authentication token
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required to open files");
        return;
      }
      
      // For images, open in new tab
      try {
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          toast.success("Opening circular image...");
        } else {
          window.open(fileUrl, '_blank');
          toast.success("Opening circular image...");
        }
      } catch (error) {
        window.open(fileUrl, '_blank');
        toast.success("Opening circular image...");
      }
    } catch (error) {
      toast.error("Failed to open circular file. Please try again.");
    }
  };

  const handleEdit = (id) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit Circulars.');
      return;
    }
    // Find the circular by ID
    const circular = circulars.find(c => c.id === id);
    if (!circular) {
      toast.error("Circular not found");
      return;
    }

    // Populate the edit form with current data
    setEditFormData({
      id: circular.id,
      circularNumber: circular.circularNo || '',
      subject: circular.subject || '',
      body: circular.description || '',
      date: circular.date || new Date().toISOString().split('T')[0],
      file: null
    });

    setShowEditForm(true);
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    
    // Check permission before submitting
    if (!canEdit) {
      toast.error('You do not have permission to edit Circulars.');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['circularNumber', 'subject', 'body', 'date'];
    const missingFields = requiredFields.filter(field => !editFormData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please log in to edit circulars");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('id', editFormData.id);
      formData.append('circular_number', editFormData.circularNumber);
      formData.append('circular_subject', editFormData.subject);
      formData.append('circular_body', editFormData.body);
      formData.append('date', editFormData.date);
      
      // Add file if selected
      if (editFormData.file) {
        formData.append('file', editFormData.file);
      }

      const response = await api.post("/notifications/edit_circular", formData, {
        headers: {
          ...getAuthHeaders(),
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        withCredentials: true,
      });

      if (response.data?.status === 'success' || response.data?.message || response.data?.data) {
        // Refresh the circulars list to get the updated data
        await fetchCirculars();
        
        // Reset form
        setEditFormData({
          id: '',
          circularNumber: '',
          subject: '',
          body: '',
          date: '',
          file: null
        });
        
        setShowEditForm(false);
        toast.success("Circular updated successfully!");
      } else {
        toast.error("Update completed but response format unexpected");
      }
    } catch (err) {
      // Handle specific file size error
      if (err.response?.data?.message && err.response.data.message.includes('larger than the permitted size')) {
        toast.error("File size exceeds the server limit. Please choose a smaller file (max 10MB).");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (err.response?.status === 413) {
        toast.error("File too large. Please select a smaller file.");
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to update circular");
      }
    }
  };

  const handleEditFormCancel = () => {
    setShowEditForm(false);
    setEditFormData({
      id: '',
      circularNumber: '',
      subject: '',
      body: '',
      date: '',
      file: null
    });
  };

  const handleEditFormInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Handle file input with size validation
    if (files && files[0]) {
      const file = files[0];
      const maxSizeInMB = 10; // 10MB limit
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (file.size > maxSizeInBytes) {
        toast.error(`File size must be less than ${maxSizeInMB}MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = ''; // Clear the file input
        return;
      }
      
      // Check file type - only images allowed
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file type (JPG, PNG, GIF, WEBP, or BMP)');
        e.target.value = ''; // Clear the file input
        return;
      }
      
      setEditFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddCircular = () => {
    if (!canAdd) {
      toast.error('You do not have permission to add Circulars.');
      return;
    }
    setShowAddForm(true);
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    
    // Check permission before submitting
    if (!canAdd) {
      toast.error('You do not have permission to add Circulars.');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please log in to add circular");
        return;
      }

      // Validate required fields
      if (!addFormData.circularNumber || !addFormData.subject || !addFormData.body || !addFormData.date) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('circular_subject', addFormData.subject);
      formData.append('circular_body', addFormData.body);
      formData.append('circular_number', addFormData.circularNumber);
      formData.append('date', addFormData.date);
      
      if (addFormData.file) {
        formData.append('file', addFormData.file);
      }

      const response = await api.post("/notifications/add_circular", formData, {
        headers: {
          ...getAuthHeaders(),
          "Authorization": `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success || response.data.status === 'success') {
        toast.success("Circular added successfully!");
        setShowAddForm(false);
        setAddFormData({
          circularNumber: '',
          subject: '',
          body: '',
          date: '',
          file: null
        });
        fetchCirculars(); // Refresh the list
      } else {
        toast.error(response.data.message || "Failed to add circular");
      }
    } catch (err) {
      // Handle specific file size error
      if (err.response?.data?.message && err.response.data.message.includes('larger than the permitted size')) {
        toast.error("File size exceeds the server limit. Please choose a smaller file (max 10MB).");
      } else {
        toast.error(err.response?.data?.message || "Failed to add circular");
      }
    }
  };

  const handleAddFormCancel = () => {
    setShowAddForm(false);
    setAddFormData({
      circularNumber: '',
      subject: '',
      body: '',
      date: '',
      file: null
    });
  };

  const handleAddFormInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Handle file input with size validation
    if (files && files[0]) {
      const file = files[0];
      const maxSizeInMB = 10; // 10MB limit
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (file.size > maxSizeInBytes) {
        toast.error(`File size must be less than ${maxSizeInMB}MB. Current file size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = ''; // Clear the file input
        return;
      }
      
      // Check file type - only images allowed
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file type (JPG, PNG, GIF, WEBP, or BMP)');
        e.target.value = ''; // Clear the file input
        return;
      }
      
      setAddFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setAddFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDelete = async (id) => {
    // Check permission before deleting
    if (!canDelete) {
      toast.error('You do not have permission to delete Circulars.');
      return;
    }
    
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete circular ${id}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please log in to delete circulars");
        return;
      }

      // Try DELETE method first (standard REST approach)
      let response;
      try {
        response = await api.delete(`/notifications/delete_circular/${id}`, {
          headers: {
            ...getAuthHeaders(),
            "Authorization": `Bearer ${token}`,
          },
          withCredentials: true,
        });
      } catch (deleteError) {
        // If DELETE fails, try POST with form data (as shown in curl)
        const formData = new FormData();
        formData.append('circular_subject', 'Delete Request');
        formData.append('circular_body', 'Delete Request');
        formData.append('circular_number', 'DELETE');
        formData.append('date', new Date().toISOString().split('T')[0]);
        
        response = await api.post(`/notifications/delete_circular/${id}`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Authorization": `Bearer ${token}`,
          },
          withCredentials: true,
        });
      }

      if (response.data?.status === 'success' || response.data?.message || response.status === 200 || response.status === 204) {
        // Remove the circular from the local state
        setCirculars(prev => prev.filter(circular => circular.id !== id));
        setFilteredCirculars(prev => prev.filter(circular => circular.id !== id));
        
        toast.success("Circular deleted successfully!");
        
        // Optionally refresh the list from server
        await fetchCirculars();
      } else {
        toast.error("Delete completed but response format unexpected");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (err.response?.status === 404) {
        toast.error("Circular not found or already deleted.");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to delete this circular.");
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to delete circular");
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredCirculars.map((circular, index) => ({
      "Sr No": index + 1,
      "Circular No": circular.circularNo,
      Subject: circular.subject,
      Date: circular.date,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Circulars");
    XLSX.writeFile(wb, "circulars.xlsx");
    toast.success("Circulars exported to Excel!");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Sr No", "Circular No", "Subject", "Date"],
      ...filteredCirculars.map((circular, index) => [
        index + 1,
        circular.circularNo,
        circular.subject,
        circular.date,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "circulars.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Circulars exported to CSV!");
  };

  const copyToClipboard = () => {
    const text = filteredCirculars.map((circular, index) => 
      `${index + 1}. ${circular.circularNo} - ${circular.subject} - ${circular.date}`
    ).join("\n");
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Circulars copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const exportToPDF = () => {
    if (!filteredCirculars.length) {
      toast.error("No data to export!");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      // Add title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Circulars Report", 40, 40);

      // Add date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);

      // Define headers
      const headers = [
        "Sr No", "Circular No", "Subject", "Date"
      ];

      // Prepare data rows
      const rows = filteredCirculars.map((circular, index) => [
        index + 1,
        circular.circularNo,
        circular.subject,
        circular.date
      ]);

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 80,
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Sr No
          1: { cellWidth: 50 }, // Circular No
          2: { cellWidth: 80 }, // Subject
          3: { cellWidth: 40 }  // Date
        },
        margin: { top: 80, right: 40, bottom: 40, left: 40 }
      });

      // Add summary at the bottom
      const summaryY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Summary:", 40, summaryY);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Total Circulars: ${filteredCirculars.length}`, 40, summaryY + 15);
      doc.text(`Latest Circular: ${filteredCirculars[0]?.date || 'N/A'}`, 40, summaryY + 30);

      // Save the PDF
      doc.save("circulars.pdf");
      toast.success("Circulars exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchCirculars();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Sort circulars
  const sortedCirculars = [...filteredCirculars].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = sortedCirculars.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(sortedCirculars.length / entriesPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading circulars...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Circulars</h1>
          <div className="flex items-center gap-4">
            {canAdd && (
              <button
                onClick={handleAddCircular}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
              >
                <FiFileText size={16} />
                <span>Add Circular</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiFileText className="text-indigo-600" />
              <span>Total Circulars: {circulars.length}</span>
            </div>
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
                  placeholder="Search by circular no, subject, or date..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, sortedCirculars.length)} of {sortedCirculars.length} entries</span>
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
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-32">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      onClick={() => {
                        copyToClipboard();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiCopy className="text-gray-500" />
                      Copy
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        exportToCSV();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiDownload className="text-green-500" />
                      CSV
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        exportToExcel();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiFile className="text-emerald-500" />
                      Excel
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      onClick={() => {
                        exportToPDF();
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
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap text-center"
                    onClick={() => handleSort("id")}
                    style={{ minWidth: '60px', width: '60px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Sr No
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "id" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "id" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap text-center"
                    onClick={() => handleSort("circularNo")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Circular No
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "circularNo" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "circularNo" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap text-center"
                    onClick={() => handleSort("subject")}
                    style={{ minWidth: '150px', width: '150px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Subject
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "subject" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "subject" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap text-center"
                    onClick={() => handleSort("date")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Date
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "date" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "date" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap text-center"
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((circular, idx) => (
                  <tr 
                    key={circular.id} 
                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'
                    } hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}
                  >
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">
                      {indexOfFirstEntry + idx + 1}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {circular.circularNo || 'N/A'}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {circular.subject || 'N/A'}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {circular.date || 'N/A'}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(circular.id)}
                          className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(circular.id)}
                            className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-100 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-700 transition-colors"
                            title="Edit Circular"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(circular.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-100 rounded-full hover:bg-red-100 dark:hover:bg-gray-700 transition-colors"
                            title="Delete Circular"
                          >
                            <FiTrash2 size={16} />
                          </button>
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
            {currentEntries.map((circular, idx) => (
              <div key={circular.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(circular.circularNo || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{circular.circularNo || 'N/A'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{circular.subject || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{circular.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{circular.date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-400">Show</span>
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
                className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title="Previous"
                  >
                    &lt;
                </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Page {currentPage} of {totalPages}
                  </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title="Next"
                  >
                    &gt;
                </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Circular Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Circular</h2>
              <button
                onClick={handleEditFormCancel}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditFormSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Circular Number
                    </label>
                    <input
                      type="text"
                      name="circularNumber"
                      value={editFormData.circularNumber}
                      onChange={handleEditFormInputChange}
                      placeholder="Enter circular number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={editFormData.subject}
                      onChange={handleEditFormInputChange}
                      placeholder="Enter circular subject"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditFormInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Body/Content
                    </label>
                    <textarea
                      name="body"
                      value={editFormData.body}
                      onChange={handleEditFormInputChange}
                      placeholder="Enter circular content"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Image (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        name="file"
                        onChange={handleEditFormInputChange}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                        className="hidden"
                        id="editCircularFile"
                      />
                      <label
                        htmlFor="editCircularFile"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        Choose Image
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {editFormData.file ? editFormData.file.name : "No image chosen"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum file size: 10MB. Supported formats: JPG, PNG, GIF, WEBP, BMP (Images only)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleEditFormCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Circular Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Circular</h2>
              <button
                onClick={handleAddFormCancel}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddFormSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Circular Number
                    </label>
                    <input
                      type="text"
                      name="circularNumber"
                      value={addFormData.circularNumber}
                      onChange={handleAddFormInputChange}
                      placeholder="Enter circular number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={addFormData.subject}
                      onChange={handleAddFormInputChange}
                      placeholder="Enter circular subject"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={addFormData.date}
                      onChange={handleAddFormInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Body/Content
                    </label>
                    <textarea
                      name="body"
                      value={addFormData.body}
                      onChange={handleAddFormInputChange}
                      placeholder="Enter circular content"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Image (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        name="file"
                        onChange={handleAddFormInputChange}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                        className="hidden"
                        id="addCircularFile"
                      />
                      <label
                        htmlFor="addCircularFile"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        Choose Image
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {addFormData.file ? addFormData.file.name : "No image chosen"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum file size: 10MB. Supported formats: JPG, PNG, GIF, WEBP, BMP (Images only)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleAddFormCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Circular Details Modal */}
      {showViewModal && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Circular Details
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
                {/* Circular Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Circular Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Circular No:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">
                        {selectedCircular.circularNo || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">
                        {selectedCircular.subject || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedCircular.date ? 
                          new Date(selectedCircular.date).toLocaleString('en-US', {
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

                                  {/* File Attachment */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Attachment
                    </h4>
                    
                    {(() => {
                      const filePath = selectedCircular.file || selectedCircular.file_path || selectedCircular.document || selectedCircular.attachment;
                      return filePath;
                    })() ? (
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <img 
                          src={`${BASE_URL}/${selectedCircular.file || selectedCircular.file_path || selectedCircular.document || selectedCircular.attachment}`} 
                          alt="Circular Attachment" 
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
              
              {/* Description Section */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Description
                </h4>
                <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {(() => {
                    const description = selectedCircular.description || selectedCircular.body || 'No description available';
                    return description
                      .replace(/<[^>]*>/g, '') // Remove HTML tags
                      .replace(/\n/g, '<br />') // Convert newlines to HTML breaks
                      .split('<br />')
                      .map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {line.trim() || '\u00A0'} {/* Use non-breaking space for empty lines */}
                        </p>
                      ));
                  })()}
                </div>
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
    </DashboardLayout>
  );
} 
