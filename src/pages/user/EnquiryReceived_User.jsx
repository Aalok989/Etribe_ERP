import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/DashboardLayout";
import { FiSearch, FiRefreshCw, FiDownload, FiCopy, FiFile, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiMessageSquare, FiPlus, FiX, FiCalendar } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_STORAGE_KEY = 'enquiry_received_cache';

// Cache utility functions
const isDataFresh = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCacheMetadata = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCacheData = (data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Failed to cache enquiry received data:', error);
  }
};

export default function EnquiryReceived() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    loadEnquiries();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, search]);

  // Helper function to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\r?\n/g, ' ').trim();
  };

  const loadEnquiries = async (force = false) => {
    // Check cache first unless force refresh
    if (!force) {
      const cached = getCacheMetadata();
      if (cached && isDataFresh(cached.timestamp)) {
        setEnquiries(cached.data);
        setLoading(false);
        return;
      }
    }

    // Fetch from API
    await fetchEnquiries(force);
  };

  const fetchEnquiries = async (force = false) => {
    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view enquiries");
        window.location.href = "/";
        return;
      }

      const response = await api.post("/product/view_enquiry", {}, {
        headers: getAuthHeaders()
      });
      
      // Handle the API response data - optimized for the actual API structure
      if (response.data?.data?.view_enquiry) {
        // API returns data in response.data.data.view_enquiry format (this is your case)
        const apiEnquiries = response.data.data.view_enquiry;
        const mappedEnquiries = apiEnquiries.map((enquiry, index) => {
          return {
            id: enquiry.id || index + 1,
            product: enquiry.product_name || enquiry.product || enquiry.name || '',
            companyName: enquiry.company_name || enquiry.company || enquiry.business_name || '',
            enquiry: stripHtmlTags(enquiry.enquiry || enquiry.message || enquiry.description || enquiry.details || ''),
            postedOn: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || new Date().toISOString().split('T')[0],
          };
        });
        
        setEnquiries(mappedEnquiries);
        setCacheData(mappedEnquiries);
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: API returns data directly in response.data as an array
        const apiEnquiries = response.data;
        
        const mappedEnquiries = apiEnquiries.map((enquiry, index) => {
          return {
            id: enquiry.id || index + 1,
            product: enquiry.product_name || enquiry.product || enquiry.name || '',
            companyName: enquiry.company_name || enquiry.company || enquiry.business_name || '',
            enquiry: stripHtmlTags(enquiry.enquiry || enquiry.message || enquiry.description || enquiry.details || ''),
            postedOn: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || new Date().toISOString().split('T')[0],
          };
        });
        
        setEnquiries(mappedEnquiries);
        setCacheData(mappedEnquiries);
      } else if (response.data?.data?.enquiry) {
        // Fallback: API returns data in response.data.data.enquiry format
        const apiEnquiries = response.data.data.enquiry;
        const mappedEnquiries = Array.isArray(apiEnquiries) ? apiEnquiries.map((enquiry, index) => {
          return {
            id: enquiry.id || index + 1,
            product: enquiry.product_name || enquiry.product || enquiry.name || '',
            companyName: enquiry.company_name || enquiry.company || enquiry.business_name || '',
            enquiry: stripHtmlTags(enquiry.enquiry || enquiry.message || enquiry.description || enquiry.details || ''),
            postedOn: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || new Date().toISOString().split('T')[0],
          };
        }) : [];
        
        setEnquiries(mappedEnquiries);
      } else if (response.data?.enquiry) {
        // Fallback: API returns data directly in response.data.enquiry
        const apiEnquiries = response.data.enquiry;
        const mappedEnquiries = Array.isArray(apiEnquiries) ? apiEnquiries.map((enquiry, index) => {
          return {
            id: enquiry.id || index + 1,
            product: enquiry.product_name || enquiry.product || enquiry.name || '',
            companyName: enquiry.company_name || enquiry.company || enquiry.business_name || '',
            enquiry: stripHtmlTags(enquiry.enquiry || enquiry.message || enquiry.description || enquiry.details || ''),
            postedOn: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || new Date().toISOString().split('T')[0],
          };
        }) : [];
        
        setEnquiries(mappedEnquiries);
      } else if (response.data?.data) {
        // Fallback for other data structures
        const apiEnquiries = response.data.data;
        const mappedEnquiries = Array.isArray(apiEnquiries) ? apiEnquiries.map((enquiry, index) => {
          return {
            id: enquiry.id || index + 1,
            product: enquiry.product_name || enquiry.product || enquiry.name || '',
            companyName: enquiry.company_name || enquiry.company || enquiry.business_name || '',
            enquiry: stripHtmlTags(enquiry.enquiry || enquiry.message || enquiry.description || enquiry.details || ''),
            postedOn: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || new Date().toISOString().split('T')[0],
          };
        }) : [];
        
        setEnquiries(mappedEnquiries);
        setCacheData(mappedEnquiries);
      } else {
        setEnquiries([]);
        setCacheData([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } else if (err.response?.status === 404) {
        toast.error("Enquiries endpoint not found. Please check the API configuration.");
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to fetch enquiries");
      }
      
      setEnquiries([]);
      setCacheData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEnquiries = () => {
    const filtered = enquiries.filter(
      (enquiry) =>
        (enquiry.product || '').toLowerCase().includes(search.toLowerCase()) ||
        (enquiry.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
        (enquiry.enquiry || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEnquiries(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const exportToExcel = () => {
    const exportData = filteredEnquiries.map((enquiry, index) => ({
      "Sr No": index + 1,
      Product: enquiry.product || 'N/A',
      "Company Name": enquiry.companyName || 'N/A',
      Enquiry: enquiry.enquiry || 'N/A',
      "Posted On": enquiry.postedOn || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Enquiries Received");
        XLSX.writeFile(wb, "enquiries_received.xlsx");
        toast.success("Enquiries Received exported to Excel!");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Sr No", "Product", "Company Name", "Enquiry", "Posted On"],
      ...filteredEnquiries.map((enquiry, index) => [
        index + 1,
        enquiry.product || 'N/A',
        enquiry.companyName || 'N/A',
        enquiry.enquiry || 'N/A',
        enquiry.postedOn || 'N/A',
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
            link.setAttribute("download", "enquiries_received.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Enquiries Received exported to CSV!");
  };

  const copyToClipboard = () => {
    const text = filteredEnquiries.map((enquiry, index) => 
      `${index + 1}. ${enquiry.product || 'N/A'} - ${enquiry.companyName || 'N/A'} - ${enquiry.enquiry || 'N/A'} - ${enquiry.postedOn || 'N/A'}`
    ).join("\n");
    
    navigator.clipboard.writeText(text).then(() => {
              toast.success("Enquiries Received copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const exportToPDF = () => {
    if (!filteredEnquiries.length) {
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
              doc.text("Enquiries Received Report", 40, 40);

      // Add date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);

      // Define headers
      const headers = [
        "Sr No", "Product", "Company Name", "Enquiry", "Posted On"
      ];

      // Prepare data rows
      const rows = filteredEnquiries.map((enquiry, index) => [
        index + 1,
        enquiry.product || 'N/A',
        enquiry.companyName || 'N/A',
        enquiry.enquiry || 'N/A',
        enquiry.postedOn || 'N/A'
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
          1: { cellWidth: 50 }, // Product
          2: { cellWidth: 60 }, // Company Name
          3: { cellWidth: 80 }, // Enquiry
          4: { cellWidth: 40 }  // Posted On
        },
        margin: { top: 80, right: 40, bottom: 40, left: 40 }
      });

      // Add summary at the bottom
      const summaryY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Summary:", 40, summaryY);
      
      doc.setFont("helvetica", "normal");
              doc.text(`Total Enquiries Received: ${filteredEnquiries.length}`, 40, summaryY + 15);
        doc.text(`Latest Enquiry Received: ${filteredEnquiries[0]?.postedOn || 'N/A'}`, 40, summaryY + 30);

      // Save the PDF
              doc.save("enquiries_received.pdf");
        toast.success("Enquiries Received exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };


  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Sort enquiries
  const sortedEnquiries = [...filteredEnquiries].sort((a, b) => {
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
  const currentEntries = sortedEnquiries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(sortedEnquiries.length / entriesPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-indigo-700 dark:text-indigo-300">Loading enquiries...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Enquiries Received</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiMessageSquare className="text-indigo-600" />
            <span>Total Enquiries: {enquiries.length}</span>
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
                  placeholder="Search by product, company, or enquiry received..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, sortedEnquiries.length)} of {sortedEnquiries.length} entries</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">
              
              {/* Export Buttons */}
              <div className="hidden xl:flex gap-2">
                <button 
                  className="flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={copyToClipboard}
                  title="Copy to Clipboard"
                >
                  <FiCopy className="text-gray-500 hover:text-gray-700" />
                </button>
                
                <div className="relative">
                  <button
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    title="Export Options"
                  >
                    <FiDownload className="text-blue-500 hover:text-blue-700" />
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-32">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
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
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-[#1E1E1E] dark:to-[#1E1E1E] text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm border-b-2 border-gray-400 dark:border-gray-600">
                <tr className="border-b-2 border-indigo-200 dark:border-gray-600">
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
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
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("product")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Product
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "product" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "product" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("companyName")}
                    style={{ minWidth: '150px', width: '150px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Company Name
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "companyName" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "companyName" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("enquiry")}
                    style={{ minWidth: '200px', width: '200px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Enquiry
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "enquiry" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "enquiry" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("postedOn")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Posted On
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "postedOn" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "postedOn" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((enquiry, idx) => (
                  <tr 
                    key={enquiry.id} 
                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#1E1E1E]'
                    } hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm`}
                  >
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">
                      {indexOfFirstEntry + idx + 1}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {enquiry.product || 'N/A'}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {enquiry.companyName || 'N/A'}
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      <div 
                        className="max-w-xs mx-auto"
                        dangerouslySetInnerHTML={{ __html: enquiry.enquiry || 'N/A' }}
                      />
                    </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {enquiry.postedOn || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 sm:p-6 space-y-4">
            {currentEntries.map((enquiry, idx) => (
              <div key={enquiry.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {(enquiry.product || 'N').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{enquiry.product || 'N/A'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enquiry #{indexOfFirstEntry + idx + 1}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{enquiry.companyName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <FiMessageSquare className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                    <div 
                      className="text-gray-700 dark:text-gray-300 text-xs line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: enquiry.enquiry || 'N/A' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400 flex-shrink-0" size={14} />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{enquiry.postedOn || 'N/A'}</span>
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
    </DashboardLayout>
  );
}
