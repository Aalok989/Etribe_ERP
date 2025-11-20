import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/DashboardLayout";
import {
  FiFileText,
  FiFile,
  FiEye,
  FiX,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiSearch,
  FiFilter,
  FiDownload,
  FiCopy,
  FiRefreshCw,
  FiImage,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from "react-toastify";

export default function AllEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showViewEventModal, setShowViewEventModal] = useState(false);
  const [selectedEventIdx, setSelectedEventIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("datetime");
  const [sortDirection, setSortDirection] = useState("desc");
  const [imageError, setImageError] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const uid = localStorage.getItem("uid");
        const response = await api.post(
          "/event/index",
          {},
          {
            headers: getAuthHeaders()
          }
        );
        let backendEvents = [];
        if (Array.isArray(response.data?.data?.event)) {
          backendEvents = response.data.data.event;
        } else if (Array.isArray(response.data?.data?.events)) {
          backendEvents = response.data.data.events;
        } else if (Array.isArray(response.data?.data)) {
          backendEvents = response.data.data;
        } else if (Array.isArray(response.data)) {
          backendEvents = response.data;
        } else if (
          response.data?.data &&
          typeof response.data.data === "object"
        ) {
          backendEvents = Object.values(response.data.data);
        }
        
        // Map the backend fields to expected frontend fields
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const mappedEvents = backendEvents.map((e, idx) => ({
          id: e.id || idx,
          event: e.event_title || e.event || e.title || e.name || "",
          agenda: e.event_description || e.agenda || e.description || "",
          venue: e.event_venue || e.venue || e.location || "",
          datetime: e.event_date && e.event_time 
              ? `${e.event_date}T${e.event_time}`
              : e.datetime || e.date_time || e.date || "",
          imageUrl: e.event_image
            ? (e.event_image.startsWith("http") ? e.event_image : BASE_URL + e.event_image)
            : e.image || e.imageUrl || "",
        }));
        
        setEvents(mappedEvents);
      } catch (error) {
        toast.error("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
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

  const openViewEventModal = (idx) => {
    setSelectedEventIdx(idx);
    setShowViewEventModal(true);
  };

  const closeViewEventModal = () => {
    setShowViewEventModal(false);
    setSelectedEventIdx(null);
  };

  const handleRefresh = () => {
    window.location.reload();
    toast.info("Refreshing events...");
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
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
    if (sortField === field) {
    return sortDirection === "asc" ? "↑" : "↓";
    }
    return "";
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Filter and sort events
  const filtered = events.filter((event) =>
    Object.values(event).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "datetime") {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    } else {
      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
    }

    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / entriesPerPage);
  const startIdx = (currentPage - 1) * entriesPerPage;
  const paginated = sorted.slice(startIdx, startIdx + entriesPerPage);

  // Export functions
  const exportToCSV = () => {
    const csvContent = [
      ["Event Name", "Agenda", "Venue", "Date & Time"],
      ...paginated.map((event) => [
        event.event || "",
        event.agenda ? event.agenda.replace(/<[^>]*>/g, "") : "",
        event.venue || "",
        event.datetime || "",
      ]),
    ];

    const csvString = csvContent
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "events.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Events exported to CSV successfully!");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      paginated.map((event) => ({
        "Event Name": event.event || "",
        Agenda: event.agenda ? event.agenda.replace(/<[^>]*>/g, "") : "",
        Venue: event.venue || "",
        "Date & Time": event.datetime || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, "events.xlsx");
    toast.success("Events exported to Excel successfully!");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = paginated.map((event) => [
      event.event || "",
      event.agenda ? event.agenda.replace(/<[^>]*>/g, "") : "",
      event.venue || "",
      event.datetime || "",
    ]);

    doc.autoTable({
      head: [["Event Name", "Agenda", "Venue", "Date & Time"]],
      body: tableData,
        startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
      },
    });

    doc.text("Events Report", 14, 15);
    doc.save("events.pdf");
    toast.success("Events exported to PDF successfully!");
  };

  const copyToClipboard = async () => {
    const text = paginated
      .map(
        (event) =>
          `${event.event || ""}\t${event.agenda ? event.agenda.replace(/<[^>]*>/g, "") : ""}\t${event.venue || ""}\t${event.datetime || ""}`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Events copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading events...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">All Events</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiCalendar className="text-indigo-600" />
            <span>Total Events: {events.length}</span>
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
                  placeholder="Search events, agenda, or venue..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={handleSearch}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
                      </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {startIdx + 1} to {Math.min(startIdx + entriesPerPage, filtered.length)} of {filtered.length} entries</span>
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
              <div className="relative xl:hidden flex-1 flex justify-center export-dropdown">
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-[#1E1E1E] dark:to-[#1E1E1E] text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm border-b-2 border-gray-400 dark:border-gray-600">
                <tr className="border-b-2 border-indigo-200 dark:border-gray-600">
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600"
                    onClick={() => handleSort("event")}
                  >
                    <div className="flex items-center gap-2">
                      Event Name {getSortIcon("event")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600"
                    onClick={() => handleSort("agenda")}
                  >
                    <div className="flex items-center gap-2">
                      Agenda {getSortIcon("agenda")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600"
                    onClick={() => handleSort("venue")}
                  >
                    <div className="flex items-center gap-2">
                      <FiMapPin />
                      Venue {getSortIcon("venue")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-indigo-200 dark:border-gray-600"
                    onClick={() => handleSort("datetime")}
                  >
                    <div className="flex items-center gap-2">
                      <FiClock />
                      Date & Time {getSortIcon("datetime")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {paginated.map((event, idx) => (
                  <tr
                    key={event.id || idx}
                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-[#1E1E1E]"
                        : "bg-gray-50 dark:bg-[#1E1E1E]"
                    } hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {event.event ? event.event.charAt(0).toUpperCase() : "E"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {event.event || "Untitled Event"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                        {event.agenda ? (
                          <div
                            className="line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: event.agenda,
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            No agenda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {event.venue || (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            No venue
                        </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {event.datetime ? (
                          new Date(event.datetime).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">
                            No date
                        </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-400 transition-colors"
                          onClick={() => openViewEventModal(idx)}
                          title="View Event Details"
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
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <span>
                  Showing {startIdx + 1} to{" "}
                  {Math.min(startIdx + entriesPerPage, filtered.length)} of{" "}
                  {filtered.length} results
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    Show
                  </span>
                  <select
                    className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                    value={entriesPerPage}
                    onChange={handleEntriesChange}
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    entries
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                      currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
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
                    className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    title="Next"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Event Modal */}
        {showViewEventModal && selectedEventIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={closeViewEventModal}
                title="Close"
                aria-label="Close modal"
              >
                <FiX size={24} />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <FiEye className="text-indigo-600 dark:text-indigo-300" />
                  Event Details
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  View complete event information
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <FiCalendar className="text-indigo-600 dark:text-indigo-300" />
                    Event Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Event:
                      </span>{" "}
                      {paginated[selectedEventIdx]?.event}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Venue:
                      </span>{" "}
                      {paginated[selectedEventIdx]?.venue}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        Date & Time:
                      </span>{" "}
                      {paginated[selectedEventIdx]?.datetime &&
                        new Date(
                          paginated[selectedEventIdx]?.datetime
                        ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Agenda
                  </h3>
                  <div
                    className="text-sm text-gray-600 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: paginated[selectedEventIdx]?.agenda || "",
                    }}
                  />
                </div>

                {paginated[selectedEventIdx]?.imageUrl &&
                paginated[selectedEventIdx]?.imageUrl.trim() !== "" &&
                !imageError ? (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <FiImage className="text-indigo-600 dark:text-indigo-300" />
                      Event Image
                    </h3>
                    <img
                      src={paginated[selectedEventIdx]?.imageUrl}
                      alt="Event"
                      className="rounded-lg border border-gray-200 dark:border-gray-700 shadow max-w-full max-h-48 object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <FiImage className="text-gray-400 dark:text-gray-300" />
                      Event Image
                    </h3>
                    <div className="text-gray-400 dark:text-gray-300 italic text-sm">
                      No image available
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
