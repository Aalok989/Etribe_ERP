import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/DashboardLayout";
import { FiSearch, FiRefreshCw, FiDownload, FiCopy, FiFile, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiMessageSquare, FiPlus, FiX, FiEye, FiSend } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RichTextEditor from '../../components/shared/RichTextEditor';

export default function Enquiry() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Fetch enquiries when search changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== '') {
        fetchEnquiries();
      } else if (search.trim() === '') {
        // If search is empty, fetch all products
        fetchEnquiries();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, search]);



  // Helper function to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\r?\n/g, ' ').trim();
  };

  const fetchEnquiries = async () => {
    try {
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view enquiries");
        window.location.href = "/";
        return;
      }

             const response = await api.post("/product/search_keyword", {
         keyword: search.trim() || ""
       }, {
         headers: getAuthHeaders()
       });
      
             // Handle the API response data - based on the actual API response structure
               if (response.data?.data?.product) {
          // API returns data in response.data.data.product format
          const apiEnquiries = response.data.data.product;
          
          const mappedEnquiries = apiEnquiries
            .filter(enquiry => {
              // Filter out products that belong to the current user
              const productUserId = enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '';
              return productUserId !== uid;
            })
            .map((enquiry, index) => {
              return {
                id: enquiry.id || enquiry.product_id || index + 1,
                productName: enquiry.product_name || enquiry.product || enquiry.name || enquiry.title || '',
                productDescription: enquiry.product_description || enquiry.description || enquiry.details || enquiry.desc || '',
                soldBy: enquiry.name || enquiry.seller_name || enquiry.company_name || enquiry.seller || enquiry.vendor || '',
                hsnCode: enquiry.hsn_code || enquiry.hsn || '',
                productImage: enquiry.product_image || enquiry.image || enquiry.photo || '',
                dtime: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || enquiry.created_date || new Date().toISOString().split('T')[0],
                status: enquiry.status || enquiry.active || '',
                companyName: enquiry.company_name || enquiry.company || enquiry.business_name || enquiry.organization || '',
                companyAddress: enquiry.company_address || enquiry.address || enquiry.location || '',
                userDetailId: enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '',
                companyDetailId: enquiry.company_detail_id || enquiry.company_id || '',
                email: enquiry.email || enquiry.contact_email || '',
                phoneNum: enquiry.phone_num || enquiry.phone || enquiry.contact || enquiry.mobile || ''
              };
            });
          
          setEnquiries(mappedEnquiries);
       } else if (response.data && Array.isArray(response.data)) {
        // Fallback: API returns data directly in response.data as an array
        const apiEnquiries = response.data;
        
                 const mappedEnquiries = apiEnquiries
           .filter(enquiry => {
             // Filter out products that belong to the current user
             const productUserId = enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '';
             return productUserId !== uid;
           })
           .map((enquiry, index) => {
             return {
               id: enquiry.id || enquiry.product_id || index + 1,
               productName: enquiry.product_name || enquiry.product || enquiry.name || enquiry.title || '',
               productDescription: enquiry.product_description || enquiry.description || enquiry.details || enquiry.desc || '',
               soldBy: enquiry.name || enquiry.seller_name || enquiry.company_name || enquiry.seller || enquiry.vendor || '',
               hsnCode: enquiry.hsn_code || enquiry.hsn || '',
               productImage: enquiry.product_image || enquiry.image || enquiry.photo || '',
               dtime: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || enquiry.created_date || new Date().toISOString().split('T')[0],
               status: enquiry.status || enquiry.active || '',
               companyName: enquiry.company_name || enquiry.company || enquiry.business_name || enquiry.organization || '',
             companyAddress: enquiry.company_address || enquiry.address || enquiry.location || '',
             userDetailId: enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '',
             companyDetailId: enquiry.company_detail_id || enquiry.company_id || '',
             email: enquiry.email || enquiry.contact_email || '',
             phoneNum: enquiry.phone_num || enquiry.phone || enquiry.contact || enquiry.mobile || ''
           };
         });
         
         setEnquiries(mappedEnquiries);
      } else if (response.data?.data) {
        // Fallback for other data structures
        const apiEnquiries = response.data.data;
                 const mappedEnquiries = Array.isArray(apiEnquiries) ? apiEnquiries
           .filter(enquiry => {
             // Filter out products that belong to the current user
             const productUserId = enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '';
             return productUserId !== uid;
           })
           .map((enquiry, index) => {
             return {
               id: enquiry.id || enquiry.product_id || index + 1,
               productName: enquiry.product_name || enquiry.product || enquiry.name || enquiry.title || '',
               productDescription: enquiry.product_description || enquiry.description || enquiry.details || enquiry.desc || '',
               soldBy: enquiry.name || enquiry.seller_name || enquiry.company_name || enquiry.seller || enquiry.vendor || '',
               hsnCode: enquiry.hsn_code || enquiry.hsn || '',
               productImage: enquiry.product_image || enquiry.image || enquiry.photo || '',
               dtime: enquiry.dtime || enquiry.posted_on || enquiry.created_at || enquiry.date || enquiry.created_date || new Date().toISOString().split('T')[0],
               status: enquiry.status || enquiry.active || '',
               companyName: enquiry.company_name || enquiry.company || enquiry.business_name || enquiry.organization || '',
               companyAddress: enquiry.company_address || enquiry.address || enquiry.location || '',
               userDetailId: enquiry.user_detail_id || enquiry.user_id || enquiry.seller_id || '',
               companyDetailId: enquiry.company_detail_id || enquiry.company_id || '',
               email: enquiry.email || enquiry.contact_email || '',
               phoneNum: enquiry.phone_num || enquiry.phone || enquiry.contact || enquiry.mobile || ''
             };
           }) : [];
         
         setEnquiries(mappedEnquiries);
      } else {
        setEnquiries([]);
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
    } finally {
      setLoading(false);
    }
  };

  const filterEnquiries = () => {
    const filtered = enquiries.filter(
      (enquiry) =>
        (enquiry.productName || '').toLowerCase().includes(search.toLowerCase()) ||
        (enquiry.productDescription || '').toLowerCase().includes(search.toLowerCase()) ||
        (enquiry.soldBy || '').toLowerCase().includes(search.toLowerCase()) ||
        (enquiry.companyName || '').toLowerCase().includes(search.toLowerCase())
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
      "Product Name": enquiry.productName || 'N/A',
      "Product Description": enquiry.productDescription || 'N/A',
      "Sold By": enquiry.soldBy || 'N/A',
      "HSN Code": enquiry.hsnCode || 'N/A',
      "Company Name": enquiry.companyName || 'N/A',
      "Company Address": enquiry.companyAddress || 'N/A',
      "Email": enquiry.email || 'N/A',
      "Phone": enquiry.phoneNum || 'N/A',
      "Posted On": enquiry.dtime || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enquiries");
    XLSX.writeFile(wb, "enquiries.xlsx");
    toast.success("Enquiries exported to Excel!");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Sr No", "Product Name", "Product Description", "Sold By", "HSN Code", "Company Name", "Company Address", "Email", "Phone", "Posted On"],
      ...filteredEnquiries.map((enquiry, index) => [
        index + 1,
        enquiry.productName || 'N/A',
        enquiry.productDescription || 'N/A',
        enquiry.soldBy || 'N/A',
        enquiry.hsnCode || 'N/A',
        enquiry.companyName || 'N/A',
        enquiry.companyAddress || 'N/A',
        enquiry.email || 'N/A',
        enquiry.phoneNum || 'N/A',
        enquiry.dtime || 'N/A',
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "enquiries.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Enquiries exported to CSV!");
  };

  const copyToClipboard = () => {
    const text = filteredEnquiries.map((enquiry, index) => 
      `${index + 1}. ${enquiry.productName || 'N/A'} - ${enquiry.productDescription || 'N/A'} - ${enquiry.soldBy || 'N/A'} - ${enquiry.companyName || 'N/A'} - ${enquiry.dtime || 'N/A'}`
    ).join("\n");
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Enquiries copied to clipboard!");
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
      doc.text("Enquiries Report", 40, 40);

      // Add date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);

      // Define headers
      const headers = [
        "Sr No", "Product Name", "Product Description", "Sold By", "Company Name", "Posted On"
      ];

      // Prepare data rows
      const rows = filteredEnquiries.map((enquiry, index) => [
        index + 1,
        enquiry.productName || 'N/A',
        enquiry.productDescription || 'N/A',
        enquiry.soldBy || 'N/A',
        enquiry.companyName || 'N/A',
        enquiry.dtime || 'N/A'
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
          1: { cellWidth: 50 }, // Product Name
          2: { cellWidth: 60 }, // Product Description
          3: { cellWidth: 50 }, // Sold By
          4: { cellWidth: 60 }, // Company Name
          5: { cellWidth: 40 }  // Posted On
        },
        margin: { top: 80, right: 40, bottom: 40, left: 40 }
      });

      // Add summary at the bottom
      const summaryY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Summary:", 40, summaryY);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Total Enquiries: ${filteredEnquiries.length}`, 40, summaryY + 15);
      doc.text(`Latest Enquiry: ${filteredEnquiries[0]?.dtime || 'N/A'}`, 40, summaryY + 30);

      // Save the PDF
      doc.save("enquiries.pdf");
      toast.success("Enquiries exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchEnquiries();
  };

  const handleViewEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedEnquiry(null);
  };

  const handleSendEnquiry = async () => {
    if (!enquiryMessage.trim()) {
      toast.error("Please enter an enquiry message");
      return;
    }

    try {
      setEnquiryLoading(true);
      const response = await api.post("/product/enquiry", {
        product: selectedEnquiry.id,
        enquiry: enquiryMessage.trim()
      }, {
        headers: getAuthHeaders()
      });

      if (response.data?.status) {
        toast.success(response.data.message || "Enquiry sent successfully!");
        setEnquiryMessage("");
        setShowEnquiryModal(false);
        setShowViewModal(false);
      } else {
        toast.error(response.data?.message || "Failed to send enquiry");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to send enquiry");
      }
    } finally {
      setEnquiryLoading(false);
    }
  };

  const openEnquiryModal = () => {
    setShowEnquiryModal(true);
  };

  const closeEnquiryModal = () => {
    setShowEnquiryModal(false);
    setEnquiryMessage("");
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
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Enquiries</h1>
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
                  placeholder="Search by product name, description, or seller..."
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
                    onClick={() => handleSort("productName")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Product Name
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "productName" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "productName" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("productDescription")}
                    style={{ minWidth: '150px', width: '150px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Product Description
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "productDescription" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "productDescription" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("soldBy")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Sold By
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "soldBy" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "soldBy" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
                      </div>
                    </div>
                  </th>
                  <th 
                    className="p-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600 whitespace-nowrap text-center"
                    onClick={() => handleSort("dtime")}
                    style={{ minWidth: '120px', width: '120px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Details
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortField === "dtime" && sortDirection === "asc" ? "text-indigo-600" : "text-gray-400"}`}>▲</span>
                        <span className={`text-xs ${sortField === "dtime" && sortDirection === "desc" ? "text-indigo-600" : "text-gray-400"}`}>▼</span>
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
                      {enquiry.productName || 'N/A'}
                    </td>
                                         <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                       <div 
                         className="text-sm"
                         dangerouslySetInnerHTML={{ 
                           __html: enquiry.productDescription || 'N/A' 
                         }}
                       />
                     </td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      {enquiry.soldBy || 'N/A'}
                    </td>
                                                              <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewEnquiry(enquiry)}
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

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 sm:p-6 space-y-4">
            {currentEntries.map((enquiry, idx) => (
              <div key={enquiry.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {(enquiry.productName || 'N').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{enquiry.productName || 'N/A'}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enquiry #{indexOfFirstEntry + idx + 1}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{enquiry.soldBy || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <FiFile className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                    <div 
                      className="text-gray-700 dark:text-gray-300 text-xs line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: enquiry.productDescription || 'N/A' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMessageSquare className="text-gray-400 flex-shrink-0" size={14} />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{enquiry.companyName || 'N/A'}</span>
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
                  <FiChevronLeft />
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
                  <FiChevronRight />
                </button>
              </div>
            </div>
                     </div>
         </div>
       </div>

       {/* View Details Modal */}
       {showViewModal && selectedEnquiry && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             {/* Modal Header */}
                           <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Product Details
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEnquiryModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    title="Send Enquiry"
                  >
                    <FiSend size={16} />
                    Enquiry
                  </button>
                  <button
                    onClick={closeViewModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

             {/* Modal Content */}
             <div className="p-6 space-y-6">
               {/* Product Information */}
               <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <FiFile className="text-indigo-600" />
                   Product Information
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Product Name
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.productName || 'N/A'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       HSN Code
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.hsnCode || 'N/A'}
                     </p>
                   </div>
                                        <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                         Product Description
                       </label>
                       <div 
                         className="text-gray-800 dark:text-gray-100"
                         dangerouslySetInnerHTML={{ 
                           __html: selectedEnquiry.productDescription || 'N/A' 
                         }}
                       />
                     </div>
                 </div>
               </div>

               {/* Seller Information */}
               <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <FiMessageSquare className="text-indigo-600" />
                   Seller Information
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Seller Name
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.soldBy || 'N/A'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Posted On
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.dtime || 'N/A'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Company Information */}
               <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                   <FiMessageSquare className="text-indigo-600" />
                   Company Information
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Company Name
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.companyName || 'N/A'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Company Address
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.companyAddress || 'N/A'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Email
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.email || 'N/A'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                       Phone Number
                     </label>
                     <p className="text-gray-800 dark:text-gray-100 font-medium">
                       {selectedEnquiry.phoneNum || 'N/A'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Product Image */}
               {selectedEnquiry.productImage && (
                 <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                     <FiFile className="text-indigo-600" />
                     Product Image
                   </h3>
                   <div className="flex justify-center">
                     <img
                       src={`${import.meta.env.VITE_API_BASE_URL}/${selectedEnquiry.productImage}`}
                       alt={selectedEnquiry.productName || 'Product'}
                       className="max-w-full h-auto max-h-64 rounded-lg shadow-md"
                       onError={(e) => {
                         e.target.style.display = 'none';
                       }}
                     />
                   </div>
                 </div>
               )}
             </div>

             {/* Modal Footer */}
             <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
               <button
                 onClick={closeViewModal}
                 className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
               )}

        {/* Enquiry Modal */}
        {showEnquiryModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Send Enquiry
                </h2>
                <button
                  onClick={closeEnquiryModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Product Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FiFile className="text-indigo-600" />
                    Product Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        You are enquiring for
                      </label>
                      <p className="text-gray-800 dark:text-gray-100 font-medium bg-white dark:bg-gray-600 px-3 py-2 rounded border">
                        {selectedEnquiry.productName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Sold By
                      </label>
                      <p className="text-gray-800 dark:text-gray-100 font-medium bg-white dark:bg-gray-600 px-3 py-2 rounded border">
                        {selectedEnquiry.soldBy || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                                 {/* Enquiry Message */}
                 <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                     <FiMessageSquare className="text-indigo-600" />
                     Enquiry Message
                   </h3>
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                       Message *
                     </label>
                     <RichTextEditor
                       data={enquiryMessage}
                       onChange={(data) => setEnquiryMessage(data)}
                       placeholder="Enter your enquiry message here..."
                       height="200px"
                     />
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                       Please provide details about what you'd like to know about this product.
                     </p>
                   </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeEnquiryModal}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEnquiry}
                  disabled={enquiryLoading || !enquiryMessage.trim()}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    enquiryLoading || !enquiryMessage.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {enquiryLoading ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend size={16} />
                      Send Enquiry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }
