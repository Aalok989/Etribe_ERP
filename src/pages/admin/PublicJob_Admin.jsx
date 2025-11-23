import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/admin/DashboardLayout";
import { FiDownload, FiFilter, FiEdit2, FiTrash2, FiChevronDown, FiFileText, FiFile, FiX, FiCopy, FiPlus, FiUser, FiRefreshCw, FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { usePermissions } from "../../context/PermissionContext";

export default function PublicJobPage() {
  // Get permissions for Resume/Job Portal module (module_id: 14)
  const { hasPermission } = usePermissions();
  const RESUME_MODULE_ID = 14;
  const canView = hasPermission(RESUME_MODULE_ID, 'view');
  const canAdd = hasPermission(RESUME_MODULE_ID, 'add');
  const canEdit = hasPermission(RESUME_MODULE_ID, 'edit');
  const canDelete = hasPermission(RESUME_MODULE_ID, 'delete');
  
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [editJob, setEditJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [addJobForm, setAddJobForm] = useState({ company_name: "", job_type: "", job_description: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch public jobs from API
  const fetchPublicJobs = async () => {
    setLoading(true);
    try {
      const response = await api.post('/Job_post/all_public', {}, {
        headers: getAuthHeaders()
      });
      
      // Handle different response structures
      const jobs = response.data?.data || response.data || [];
      setJobsData(Array.isArray(jobs) ? jobs : []);
    } catch (err) {
      toast.error("Failed to fetch public jobs: " + (err.response?.data?.message || err.message));
      setJobsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPublicJobs();
  }, []);

  // Handle click outside for export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const filteredJobs = jobsData.filter(j => {
    const matchesFilter = filter === "All";
    const matchesSearch = search === "" || 
      (j.company_name && j.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (j.job_type && j.job_type.toLowerCase().includes(search.toLowerCase())) ||
      (j.job_description && j.job_description.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortAsc) {
      return (a.company_name || "").localeCompare(b.company_name || "");
    } else {
      return (b.company_name || "").localeCompare(a.company_name || "");
    }
  });

  // Pagination logic
  const totalEntries = sortedJobs.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const endIdx = startIdx + entriesPerPage;
  const paginatedJobs = sortedJobs.slice(startIdx, endIdx);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Handlers for edit form
  const [editForm, setEditForm] = useState({ id: '', company_name: '', job_type: '', job_description: '' });
  React.useEffect(() => {
    if (editJob) {
      setEditForm({
        id: editJob.id || '',
        company_name: editJob.company_name || '',
        job_type: editJob.job_type || '',
        job_description: editJob.job_description || ''
      });
    }
  }, [editJob]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    // Check permission before saving
    if (!canEdit) {
      toast.error('You do not have permission to edit Jobs.');
      setEditJob(null);
      return;
    }
    
    setFormError(null);
    try {
      // TODO: Implement edit API call
      toast.success("Job updated successfully!");
      setEditJob(null);
    } catch (err) {
      setFormError(err.toString());
      toast.error("Failed to update job: " + err.message);
      setEditJob(null);
    }
  };

  const handleDelete = async () => {
    // Check permission before deleting
    if (!canDelete) {
      toast.error('You do not have permission to delete Jobs.');
      setDeleteJob(null);
      setDeleteConfirm("");
      return;
    }
    
    if (deleteConfirm.trim().toLowerCase() === "delete") {
      setDeleteLoading(true);
      setFormError(null);
      try {
        // TODO: Implement delete API call
        setDeleteJob(null);
        setDeleteConfirm("");
        toast.success("Job deleted successfully!");
      } catch (err) {
        setFormError(err.toString());
        toast.error("Failed to delete job: " + err.message);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Add job handlers
  const handleAddJobChange = (e) => {
    setAddJobForm({ ...addJobForm, [e.target.name]: e.target.value });
  };

  const handleAddJobSubmit = async (e) => {
    e.preventDefault();
    
    // Check permission before submitting
    if (!canAdd) {
      toast.error('You do not have permission to add Jobs.');
      return;
    }
    
    setFormError(null);
    try {
      // TODO: Implement add API call
      setAddJobForm({ company_name: "", job_type: "", job_description: "" });
      toast.success("Job added successfully!");
      setShowAddJobModal(false);
    } catch (err) {
      setFormError(err.toString());
      toast.error("Failed to add job: " + err.message);
      setShowAddJobModal(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["Company Name", "Job Type", "Job Description"];
    const rows = jobsData.map(j => [j.company_name || "", j.job_type || "", j.job_description || ""]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "public_jobs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Jobs exported to CSV!");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      jobsData.map(j => ({
        "Company Name": j.company_name || "",
        "Job Type": j.job_type || "",
        "Job Description": j.job_description || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Public Jobs");
    XLSX.writeFile(wb, "public_jobs.xlsx");
    toast.success("Jobs exported to Excel!");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const headers = [[
      "Company Name", "Job Type", "Job Description"
    ]];
    const rows = jobsData.map(j => [
      j.company_name || "",
      j.job_type || "",
      j.job_description || "",
    ]);
    try {
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      doc.save("public_jobs.pdf");
      toast.success("Jobs exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  const handleCopyToClipboard = () => {
    const data = jobsData.map(j => 
      `${j.company_name || ""},${j.job_type || ""},${j.job_description || ""}`
    ).join('\n');
    navigator.clipboard.writeText(data);
    toast.success("All jobs copied to clipboard!");
  };

  const handleRefresh = () => {
    fetchPublicJobs();
    toast.info("Refreshing jobs...");
  };

  // Loading state
  if (loading && jobsData.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading public jobs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Public Job</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUser className="text-indigo-600" />
            <span>Total Jobs: {jobsData.length}</span>
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
                  placeholder="Search by company name, type, or description..."
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
              <div className="relative xl:hidden flex-1 flex justify-center">
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
                  <th className="p-3 text-center font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Sr No</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Company Logo</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Company Name</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Type</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Description</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-600 dark:text-gray-300">
                      No public jobs available.
                    </td>
                  </tr>
                ) : paginatedJobs.map((j, idx) => {
                  const logoUrl = j.company_logo 
                    ? (j.company_logo.startsWith('http') ? j.company_logo : `${API_BASE_URL}/${j.company_logo}`)
                    : null;
                  
                  return (
                    <tr key={j.id || idx} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                      <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{startIdx + idx + 1}</td>
                      <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={j.company_name || "Company Logo"}
                            className="w-12 h-12 object-contain mx-auto rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 mx-auto rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-semibold"
                          style={{ display: logoUrl ? 'none' : 'flex' }}
                        >
                          {(j.company_name || "C").charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{j.company_name || ""}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{j.job_type || ""}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{j.job_description || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 sm:p-6 space-y-4">
            {paginatedJobs.length === 0 && (
              <div className="text-center text-gray-600 dark:text-gray-300 py-8 bg-white dark:bg-[#1E1E1E] rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                No public jobs available.
              </div>
            )}
            {paginatedJobs.map((j, idx) => {
              const logoUrl = j.company_logo 
                ? (j.company_logo.startsWith('http') ? j.company_logo : `${API_BASE_URL}/${j.company_logo}`)
                : null;
              
              return (
                <div key={j.id || idx} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={j.company_name || "Company Logo"}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 flex items-center justify-center flex-shrink-0"
                        style={{ display: logoUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-sm font-medium text-white">
                          {(j.company_name || "J").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{j.company_name || ""}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Job #{startIdx + idx + 1}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{j.job_type || ""}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {j.job_description && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                          <strong>Description:</strong> {j.job_description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

        {/* Add Job Modal */}
        {showAddJobModal && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 w-full max-w-md relative h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
              <button
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
                onClick={() => setShowAddJobModal(false)}
                title="Close"
              >
                <FiX size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="mb-4 sm:mb-6 pr-8 sm:pr-0">
                <h2 className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-200 flex items-center gap-2">
                  <FiPlus className="text-indigo-600 dark:text-indigo-300" />
                  Add New Job
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Create a new public job posting</p>
              </div>
              
              {formError && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900 p-2 rounded-lg">{formError}</p>}
              
              <form className="flex-1 flex flex-col" onSubmit={handleAddJobSubmit}>
                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 sm:mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={addJobForm.company_name}
                      onChange={handleAddJobChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 sm:mb-2">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="job_type"
                      value={addJobForm.job_type}
                      onChange={handleAddJobChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                      placeholder="Enter job type"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 sm:mb-2">
                      Job Description
                    </label>
                    <textarea
                      name="job_description"
                      value={addJobForm.job_description}
                      onChange={handleAddJobChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                      placeholder="Enter job description"
                      rows="4"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setShowAddJobModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-700 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
                  >
                    <FiPlus />
                    Add Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Job Modal */}
        {editJob && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="bg-white dark:bg-[#202123] rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 w-full max-w-md relative h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
              <button
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
                onClick={() => setEditJob(null)}
                title="Close"
              >
                <FiX size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="mb-4 sm:mb-6 pr-8 sm:pr-0">
                <h2 className="text-lg sm:text-xl font-bold text-indigo-700 dark:text-indigo-200 flex items-center gap-2">
                  <FiEdit2 className="text-indigo-600 dark:text-indigo-300" />
                  Edit Job
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Update job information</p>
              </div>
              
              {formError && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900 p-2 rounded-lg">{formError}</p>}
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={editForm.company_name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="job_type"
                    value={editForm.job_type}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Job Description
                  </label>
                  <textarea
                    name="job_description"
                    value={editForm.job_description}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                    rows="4"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setEditJob(null)}
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-700 text-white font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
                      onClick={handleEditSave}
                    >
                      <FiEdit2 />
                      Save Changes
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Job Modal */}
        {deleteJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => setDeleteJob(null)}
                title="Close"
              >
                <FiX size={24} />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <FiTrash2 className="text-red-600" />
                  Delete Job
                </h2>
                <p className="text-gray-600 text-sm mt-1">This action cannot be undone</p>
              </div>
              
              {formError && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-lg">{formError}</p>}
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    Type <span className="font-mono bg-red-100 px-2 py-1 rounded">Delete</span> to confirm deletion of <span className="font-semibold">{deleteJob.company_name || "this job"}</span>.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="Type 'Delete' to confirm"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                    onClick={() => setDeleteJob(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      deleteConfirm.trim().toLowerCase() === 'delete' 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    onClick={handleDelete}
                    disabled={deleteConfirm.trim().toLowerCase() !== 'delete' || deleteLoading || !canDelete}
                  >
                    {deleteLoading ? 'Deleting...' : <><FiTrash2 /> Delete Job</>}
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

