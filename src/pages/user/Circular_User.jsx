import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/Layout/DashboardLayout";
import { FiSearch, FiRefreshCw, FiDownload, FiCopy, FiFile, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiFileText, FiEye, FiCalendar, FiSettings } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



export default function Circulars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredCirculars, setFilteredCirculars] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");




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
    
    console.log(`Mapping circular ${index + 1}:`, {
      original: circular,
      mappedSubject: mappedCircular.subject,
      mappedBody: mappedCircular.body,
      mappedDescription: mappedCircular.description
    });
    
    return mappedCircular;
  };

  const fetchCirculars = async () => {
    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view circulars");
        window.location.href = "/";
        return;
      }

      console.log('Fetching circulars with credentials:', { uid, token });
      
      const response = await api.post("/notifications/get_all_circulars", {}, {
        headers: getAuthHeaders()
      });
      
      console.log('Circulars API response:', response.data);
      
      // Debug: Log the structure of each circular object
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('Individual circular objects:');
        response.data.data.forEach((circular, index) => {
          console.log(`Circular ${index + 1}:`, {
            id: circular.id,
            circular_no: circular.circular_no,
            circularNo: circular.circularNo,
            circular_number: circular.circular_number,
            subject: circular.subject,
            title: circular.title,
            name: circular.name,
            date: circular.date,
            created_at: circular.created_at,
            uploaded_on: circular.uploaded_on,
            description: circular.description,
            content: circular.content,
            body: circular.body,
            body_content: circular.body_content,
            message: circular.message,
            text: circular.text,
            file: circular.file,
            file_path: circular.file_path,
            document: circular.document,
            attachment: circular.attachment,
            // Log all keys to see what's actually available
            allKeys: Object.keys(circular),
            // Log all values to see what's actually in the data
            allValues: Object.values(circular)
          });
        });
      }
      
      // Handle the API response data
      if (response.data?.data) {
        // If the API returns data in response.data.data format
        const apiCirculars = response.data.data;
        const mappedCirculars = Array.isArray(apiCirculars) ? apiCirculars.map((circular, index) => mapCircularData(circular, index)) : [];
        
        setCirculars(mappedCirculars);
        console.log('Final mapped circulars:', mappedCirculars);
      } else if (response.data) {
        // If the API returns data directly in response.data
        const apiCirculars = Array.isArray(response.data) ? response.data : [response.data];
        const mappedCirculars = apiCirculars.map((circular, index) => mapCircularData(circular, index));
        
        setCirculars(mappedCirculars);
        console.log('Final mapped circulars:', mappedCirculars);
      } else {
        // No data found in API response
        console.log('No data found in API response');
        setCirculars([]);
      }
    } catch (err) {
      console.error('Error fetching circulars:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
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
    console.log(`View circular ${id}`);
    
    // Find the circular by ID
    const circular = circulars.find(c => c.id === id);
    if (!circular) {
      toast.error("Circular not found");
      return;
    }

    console.log("Circular data for view:", circular);
    console.log("Circular description:", circular.description);
    console.log("Circular body:", circular.body);
    console.log("Circular file fields:", {
      file: circular.file,
      file_path: circular.file_path,
      document: circular.document,
      attachment: circular.attachment
    });
    console.log("All circular properties:", Object.keys(circular));
    console.log("Circular values:", Object.values(circular));

    // Always show the modal first, regardless of whether there's a file or not
    setSelectedCircular(circular);
    setShowViewModal(true);
  };

  const downloadCircularFile = async (fileUrl, fileName) => {
    try {
      console.log("Attempting to download file:", fileUrl);
      console.log("File name:", fileName);
      
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
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        console.error("File download failed:", response.status, response.statusText);
        toast.error(`Failed to download file: ${response.status} ${response.statusText}`);
        return;
      }

      // Get the file blob
      const blob = await response.blob();
      console.log("File blob received:", blob.size, "bytes");

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
      console.error("Error downloading file:", error);
      
      // Fallback: try direct link approach
      try {
        console.log("Trying fallback download method...");
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'circular';
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download initiated...");
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
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
      console.log("Attempting to open circular file:", filePath);
      
      // Construct the full URL for the circular file
      const fileUrl = filePath.startsWith('http') 
        ? filePath 
        : `${import.meta.env.VITE_API_BASE_URL}/${filePath}`;
      
      console.log("Full file URL:", fileUrl);
      
      // Get authentication token
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token || !uid) {
        toast.error("Authentication required to open files");
        return;
      }
      
      // Check file extension to determine how to handle it
      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      console.log("File extension:", fileExtension);
      
      if (fileExtension === 'pdf') {
        // For PDF files, try to open in new tab with authentication
        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success("Opening PDF circular...");
          } else {
            console.error("Failed to fetch PDF:", response.status);
            // Fallback to direct URL
            window.open(fileUrl, '_blank');
            toast.success("Opening PDF circular...");
          }
        } catch (error) {
          console.error("Error opening PDF:", error);
          // Fallback to direct URL
          window.open(fileUrl, '_blank');
          toast.success("Opening PDF circular...");
        }
      } else if (['doc', 'docx'].includes(fileExtension)) {
        // For Word documents, offer download option
        if (window.confirm("Word documents cannot be previewed in browser. Would you like to download the file?")) {
          await downloadCircularFile(fileUrl, circular.subject);
        }
      } else {
        // For other file types, try to open in new tab
        try {
          const response = await fetch(fileUrl, {
            method: 'GET',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success("Opening circular file...");
          } else {
            console.error("Failed to fetch file:", response.status);
            // Fallback to direct URL
            window.open(fileUrl, '_blank');
            toast.success("Opening circular file...");
          }
        } catch (error) {
          console.error("Error opening file:", error);
          // Fallback to direct URL
          window.open(fileUrl, '_blank');
          toast.success("Opening circular file...");
        }
      }
    } catch (error) {
      console.error("Error opening circular file:", error);
      toast.error("Failed to open circular file. Please try again.");
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
      console.error("PDF export failed:", err);
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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
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
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiFileText className="text-indigo-600" />
            <span>Total Circulars: {circulars.length}</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 w-full">
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
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-32">
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
                      idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'
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





      {/* View Circular Details Modal */}
      {showViewModal && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                          src={`${import.meta.env.VITE_API_BASE_URL}/${selectedCircular.file || selectedCircular.file_path || selectedCircular.document || selectedCircular.attachment}`} 
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