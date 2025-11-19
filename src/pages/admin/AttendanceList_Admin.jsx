import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiFilter,
  FiUsers,
  FiFile,
  FiChevronDown,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from "react-toastify";

export default function AttendanceList() {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventName, setSelectedEventName] = useState("");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    // Read event ID and name from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const eventId = searchParams.get('eventId');
    const eventName = searchParams.get('eventName');
    
    if (eventId) {
      setSelectedEventId(eventId);
    }
    
    if (eventName) {
      setSelectedEventName(decodeURIComponent(eventName));
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendanceRecords();
    }
  }, [selectedEventId]);

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



  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      if (!uid || !token) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      // Using the real API endpoint from your curl command
      const response = await api.post('/attendance/get_active_members_by_event', {
        event_id: selectedEventId
      }, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.status === true && response.data.data) {
        // Map the API response to match our table structure
        const mappedRecords = response.data.data.map(member => ({
          id: member.id,
          name: member.name,
          company: member.company_name || 'N/A',
          contact: member.phone_num || 'N/A',
          email: member.email || 'N/A',
          membership_name: member.plan_name || 'N/A'
        }));
        
        setAttendanceRecords(mappedRecords);
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      toast.error("Failed to fetch attendance records");
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered, sorted and paginated data
  const filtered = attendanceRecords.filter(
    (record) =>
      record.name.toLowerCase().includes(search.toLowerCase()) ||
      record.company.toLowerCase().includes(search.toLowerCase()) ||
      record.email.toLowerCase().includes(search.toLowerCase()) ||
      record.contact.includes(search) ||
      record.membership_name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "contact") {
      aVal = aVal || "";
      bVal = bVal || "";
    } else {
      aVal = aVal?.toLowerCase() || "";
      bVal = bVal?.toLowerCase() || "";
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalEntries = sorted.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const paginated = sorted.slice(startIdx, startIdx + entriesPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      attendanceRecords.map(record => ({
        "Sr No": record.id,
        "Name": record.name,
        "Company": record.company,
        "Contact": record.contact,
        "Email": record.email,
        "Membership Name": record.membership_name,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");
    XLSX.writeFile(wb, "attendance_records.xlsx");
    toast.success("Attendance records exported to Excel!");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const headers = [[
      "Sr No", "Name", "Company", "Contact", "Email", "Membership Name"
    ]];
    const rows = attendanceRecords.map(record => [
      record.id,
      record.name,
      record.company,
      record.contact,
      record.email,
      record.membership_name,
    ]);
    try {
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      doc.save("attendance_records.pdf");
      toast.success("Attendance records exported to PDF!");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  const handleRefresh = () => {
    fetchAttendanceRecords();
    toast.info("Data refreshed!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="animate-spin text-4xl text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
              {selectedEventName ? `Attendance List: ${selectedEventName}` : 'Attendance List'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedEventName 
                ? `View and manage attendance records for ${selectedEventName}`
                : 'View and manage attendance records'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="text-indigo-600" />
            <span>Total Records: {attendanceRecords.length}</span>
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
                  placeholder="Search records, companies, emails..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {filtered.length} of {attendanceRecords.length} records</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">
              {/* Back to Event button when in specific event context */}
              {selectedEventName && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                  title="Back to Event"
                >
                  ← Back to Event
                </button>
              )}
              
              {/* Desktop Export Buttons - Hidden on smaller screens */}
              <div className="hidden xl:flex items-center gap-2">
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
              <div className="relative xl:hidden export-dropdown">
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
                        handleExportExcel();
                        setShowExportDropdown(false);
                      }}
                    >
                      <FiFile className="text-emerald-500" />
                      Excel
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:hover:bg-gray-700 rounded-b-lg"
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
              
              <button 
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={handleRefresh}
                title="Refresh Records"
              >
                <FiRefreshCw /> 
                <span>Refresh</span>
              </button>
              
              <button
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                <FiPlus />
                <span className="hidden sm:inline">Add Record</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Table - Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            {attendanceRecords.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                  <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                    <th className="p-3 text-center font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("id")}>
                      Sr No {getSortIcon("id")}
                    </th>
                    <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("name")}>
                      Name {getSortIcon("name")}
                    </th>
                    <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("company")}>
                      Company {getSortIcon("company")}
                    </th>
                    <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("contact")}>
                      Contact {getSortIcon("contact")}
                    </th>
                    <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("email")}>
                      Email {getSortIcon("email")}
                    </th>
                    <th className="p-3 text-left font-semibold whitespace-nowrap cursor-pointer" onClick={() => handleSort("membership_name")}>
                      Membership Name {getSortIcon("membership_name")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((record, idx) => (
                    <tr key={record.id} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                      <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{startIdx + idx + 1}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{record.name}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{record.company}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{record.contact}</td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{record.email}</td>
                      <td className="p-3 text-left text-gray-800 dark:text-gray-100">{record.membership_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No attendance records available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No attendance records found.</p>
              </div>
            )}
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {attendanceRecords.length > 0 ? (
              paginated.map((record, idx) => (
                <div key={record.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {record.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{record.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">#{startIdx + idx + 1}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{record.membership_name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Company:</span>
                      <span className="text-gray-800 dark:text-gray-100">{record.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                      <span className="text-gray-800 dark:text-gray-100">{record.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-800 dark:text-gray-100">{record.email}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No attendance records available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No attendance records found.</p>
              </div>
            )}
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
