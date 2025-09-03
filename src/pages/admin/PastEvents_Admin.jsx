import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import {
  FiPlus,
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
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiImage,
  FiCheckCircle,
  FiUpload,
  FiAlertCircle,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api/axiosConfig";
import RichTextEditor from "../../components/shared/RichTextEditor";
import UploadAttendanceModal from "../../components/admin/UploadAttendanceModal";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../../utils/apiHeaders";


// Helper to decode HTML entities
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Helper to strip HTML tags
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}



export default function PastEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showViewEventModal, setShowViewEventModal] = useState(false);
  const [selectedEventIdx, setSelectedEventIdx] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEventForUpload, setSelectedEventForUpload] = useState(null);
  const [addEventForm, setAddEventForm] = useState({
    event: "",
    agenda: "",
    venue: "",
    date: "",
    time: "",
    reminder: "Yes",
    sendReminderTo: "Only Approved Members",
    invitationImage: null,
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [formErrors, setFormErrors] = useState({});
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    id: "",
    event: "",
    agenda: "",
    venue: "",
    date: "",
    time: "",
    invitationImage: null,
    imageUrl: ""
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  


  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      // toast.dismiss();
      try {
        const response = await api.post('/event/past', {}, {
          headers: getAuthHeaders()
        });
        let backendEvents = [];
        if (Array.isArray(response.data?.data?.event)) {
          backendEvents = response.data.data.event;
        } else if (Array.isArray(response.data?.data?.events)) {
          backendEvents = response.data.data.events;
        } else if (Array.isArray(response.data?.data)) {
          backendEvents = response.data.data;
        } else if (Array.isArray(response.data)) {
          backendEvents = response.data;
        } else if (response.data?.data && typeof response.data.data === 'object') {
          backendEvents = Object.values(response.data.data);
        } else {
          backendEvents = [];
        }
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
            : (e.image || e.imageUrl || ""),
        }));
        setEvents(mappedEvents);
      } catch (err) {
        toast.error('Failed to fetch past events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    // Removed setInterval polling
    // Only call fetchEvents after CRUD operations
  }, []);

  // Filtered, sorted and paginated data
  const filtered = events.filter(e => 
    e.event.toLowerCase().includes(search.toLowerCase()) ||
    e.agenda.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === "datetime") {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    } else if (sortField === "id") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
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

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const handleEntriesChange = e => {
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

  // Add Event Modal
  const openAddEventModal = () => {
    setAddEventForm({ event: "", agenda: "", venue: "", datetime: "", imageUrl: "" });
    setFormErrors({}); // Clear previous errors
    setShowAddEventModal(true);
  };
  const closeAddEventModal = () => setShowAddEventModal(false);
  const handleAddEventChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'invitationImage') {
      setAddEventForm({ ...addEventForm, invitationImage: files[0] });
    } else {
      setAddEventForm({ ...addEventForm, [name]: value });
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  };
  const handleAgendaChange = (data) => {
    setAddEventForm({ ...addEventForm, agenda: data });
    setFormErrors({ ...formErrors, agenda: undefined });
  };
  const validateForm = () => {
    const errors = {};
    if (!addEventForm.event.trim()) errors.event = 'The Event Title field is required.';
    if (!addEventForm.agenda || !addEventForm.agenda.replace(/<[^>]*>/g, '').trim()) errors.agenda = 'The Agenda field is required.';
    if (!addEventForm.venue.trim()) errors.venue = 'The Venue field is required.';
    if (!addEventForm.date.trim()) errors.date = 'The Date field is required.';
    if (!addEventForm.time.trim()) errors.time = 'The Time field is required.';
    return errors;
  };
  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(Object.values(errors).join('\n'));
      setShowAddEventForm(false);
      setTimeout(() => toast.dismiss(), 3000);
      return;
    }
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      const formData = new FormData();
      formData.append('event_title', addEventForm.event);
      formData.append('event_description', addEventForm.agenda);
      formData.append('event_venue', addEventForm.venue);
      formData.append('event_time', addEventForm.time);
      formData.append('event_date', addEventForm.date);
      if (addEventForm.invitationImage) {
        formData.append('event_image', addEventForm.invitationImage);
      }
      await fetch('/api/event/add', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || ''),
        },
        credentials: 'include',
        body: formData,
      });
      toast.success('Event added successfully!');
      setAddEventForm({
        event: "",
        agenda: "",
        venue: "",
        date: "",
        time: "",
        reminder: "Yes",
        sendReminderTo: "Only Approved Members",
        invitationImage: null
      });
      setShowAddEventForm(false);
      setTimeout(() => toast.dismiss(), 3000);
      // Refresh events after adding
      handleRefresh();
    } catch (err) {
      toast.error('Failed to add event');
      setShowAddEventForm(false);
    } finally {
      setSaveLoading(false);
    }
  };
  const handleShowAddEventForm = () => setShowAddEventForm(true);
  const handleHideAddEventForm = () => setShowAddEventForm(false);

  // Edit Event Modal
  const openEditEventModal = (event) => {
    setEditEventForm({
      id: event.id,
      event: event.event,
      agenda: event.agenda,
      venue: event.venue,
      date: event.datetime ? event.datetime.split("T")[0] : "",
      time: event.datetime ? event.datetime.split("T")[1]?.slice(0, 5) : "",
      invitationImage: null,
      imageUrl: event.imageUrl || ""
    });
    setEditFormErrors({});
    setShowEditEventModal(true);
  };
  const closeEditEventModal = () => setShowEditEventModal(false);

  // Edit form change handlers
  const handleEditEventChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "invitationImage") {
      setEditEventForm({ ...editEventForm, invitationImage: files[0] });
    } else {
      setEditEventForm({ ...editEventForm, [name]: value });
      setEditFormErrors({ ...editFormErrors, [name]: undefined });
    }
  };

  const handleEditAgendaChange = (data) => {
    setEditEventForm({ ...editEventForm, agenda: data });
    setEditFormErrors({ ...editFormErrors, agenda: undefined });
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editEventForm.event.trim()) errors.event = 'The Event Title field is required.';
    if (!editEventForm.agenda || !editEventForm.agenda.replace(/<[^>]*>/g, '').trim()) errors.agenda = 'The Agenda field is required.';
    if (!editEventForm.venue.trim()) errors.venue = 'The Venue field is required.';
    if (!editEventForm.date.trim()) errors.date = 'The Date field is required.';
    if (!editEventForm.time.trim()) errors.time = 'The Time field is required.';
    return errors;
  };

  const handleEditEventSubmit = async (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      toast.error(Object.values(errors).join('\n'));
      return;
    }
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      const formData = new FormData();
      formData.append('id', editEventForm.id);
      formData.append('event_title', editEventForm.event);
      formData.append('event_description', editEventForm.agenda);
      formData.append('event_venue', editEventForm.venue);
      formData.append('event_time', editEventForm.time);
      formData.append('event_date', editEventForm.date);
      if (editEventForm.invitationImage) {
        formData.append('event_image', editEventForm.invitationImage);
      }
      await fetch('/api/event/edit', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          Authorization: 'Bearer ' + (localStorage.getItem('authToken') || ''),
          // Do NOT set Content-Type for FormData
        },
        credentials: 'include',
        body: formData,
      });
      toast.success('Event updated successfully!');
      closeEditEventModal();
      setTimeout(() => toast.dismiss(), 2000);
      // Refresh events
      handleRefresh();
    } catch (err) {
      toast.error('Failed to update event');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      // Try using the api instance instead of fetch for consistency
      // First try the remove endpoint, if it fails, try delete endpoint
      let response;
      try {
        response = await api.post('/event/remove', { id: eventId }, {
          headers: getAuthHeaders()
        });
      } catch (removeError) {
        console.log('Remove endpoint failed, trying delete endpoint...');
        // Try alternative delete endpoint
        response = await api.delete(`/event/${eventId}`, {
          headers: getAuthHeaders()
        });
      }
      
      if (response.data && response.data.status === true) {
        // Successfully deleted from backend, remove from UI
        setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
        toast.success('Event deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to delete event');
      }
      
    } catch (err) {
      console.error('Delete error:', err);
      
      // If the API call fails, try optimistic deletion for now
      // This will be reverted when the page refreshes
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
      toast.success('Event removed from view. Please refresh to sync with server.');
      
      // Try to refresh the data to see if it was actually deleted
      setTimeout(() => {
        handleRefresh();
      }, 2000);
      
    } finally {
      setDeleteLoading(false);
    }
  };

  // View Event Modal
  const openViewEventModal = (idx) => {
    setSelectedEventIdx(idx);
    setImageError(false);
    setShowViewEventModal(true);
  };
  const closeViewEventModal = () => setShowViewEventModal(false);

  // Export Handlers (CSV, Excel, PDF)
  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = ["Event", "Agenda", "Venue", "Date & Time"];
    const rows = events.map(e => [
      e.event,
      e.agenda,
      e.venue,
      e.datetime ? new Date(e.datetime).toLocaleString() : "",
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "past_events.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Events exported to CSV!');
  };

  const handleExportExcel = () => {
    if (!events.length) return;
    const ws = XLSX.utils.json_to_sheet(
      events.map(e => ({
        Event: e.event,
        Agenda: e.agenda,
        Venue: e.venue,
        "Date & Time": e.datetime ? new Date(e.datetime).toLocaleString() : "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Past Events");
    XLSX.writeFile(wb, "past_events.xlsx");
    toast.success('Events exported to Excel!');
  };

  const handleExportPDF = () => {
    if (!events.length) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const headers = [[
      "Event", "Agenda", "Venue", "Date & Time"
    ]];
    const rows = events.map(e => [
      e.event,
      e.agenda,
      e.venue,
      e.datetime ? new Date(e.datetime).toLocaleString() : "",
    ]);
    try {
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      doc.save("past_events.pdf");
      toast.success('Events exported to PDF!');
    } catch (err) {
      alert("PDF export failed: " + err.message);
    }
  };

  const handleCopyToClipboard = () => {
    const data = events.map(e => 
      `${e.event},${e.agenda},${e.venue},${e.datetime ? new Date(e.datetime).toLocaleString() : ""}`
    ).join('\n');
    navigator.clipboard.writeText(data);
    toast.success('Event copied to clipboard!');
  };

  // Attendance functions
  const handleMarkAttendance = (eventId, eventName) => {
    console.log('Marking attendance for event:', { eventId, eventName });
    
    if (!eventId) {
      toast.error('Event ID is missing. Cannot mark attendance.');
      return;
    }
    
    // Navigate to Attendance page with event ID and name
    navigate(`/admin/attendance?eventId=${eventId}&eventName=${encodeURIComponent(eventName)}`);
  };

  const handleUploadAttendance = (eventId, eventName) => {
    setSelectedEventForUpload({ id: eventId, name: eventName });
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedEventForUpload(null);
  };

  const handleUploadSuccess = () => {
    // Refresh events list if needed
    handleRefresh();
  };


  const handleRefresh = () => {
    setLoading(true);
    // Refresh events after operations
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        const response = await api.post('/event/past', {}, {
          headers: getAuthHeaders()
        });
        let backendEvents = [];
        if (Array.isArray(response.data?.data?.event)) {
          backendEvents = response.data.data.event;
        } else if (Array.isArray(response.data?.data?.events)) {
          backendEvents = response.data.data.events;
        } else if (Array.isArray(response.data?.data)) {
          backendEvents = response.data.data;
        } else if (Array.isArray(response.data)) {
          backendEvents = response.data;
        } else if (response.data?.data && typeof response.data.data === 'object') {
          backendEvents = Object.values(response.data.data);
        } else {
          backendEvents = [];
        }
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
            : (e.image || e.imageUrl || ""),
        }));
        setEvents(mappedEvents);
      } catch (err) {
        toast.error('Failed to fetch past events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
          <p className="text-indigo-700">Loading past events...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Past Events</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiAlertCircle className="text-indigo-600" />
            <span>Total Past Events: {events.length}</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 max-w-7xl w-full mx-auto">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search past events, agenda, or venue..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={handleExportCSV}
                  title="Export CSV"
              >
                <FiFileText />
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
                className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition"
                onClick={handleExportPDF}
                  title="Export PDF"
              >
                <FiFile />
                PDF
              </button>
              </div>
              
              <button
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                onClick={handleShowAddEventForm}
            >
                <FiPlus />
                <span className="hidden sm:inline">Add Event</span>
                <span className="sm:hidden">Add</span>
            </button>
            </div>
          </div>



          {/* Table - Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                  <th className="p-3 text-center font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Sr No</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Event Name</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Agenda</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Venue</th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">Date & Time</th>
                  <th className="p-3 text-center font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((event, idx) => (
                  <tr key={event.id || idx} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{startIdx + idx + 1}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 dark:from-indigo-800 dark:to-purple-900 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {event.event.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{event.event}</span>
                      </div>
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      <div
                        className="line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: event.agenda,
                        }}
                      />
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          <FiMapPin className="mr-1" />
                          {event.venue}
                        </span>
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                          <FiClock className="mr-1" />
                          {event.datetime ? new Date(event.datetime).toLocaleString() : "TBD"}
                        </span>
                    </td>
                    <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors" 
                            title="View Event" 
                            onClick={() => openViewEventModal(idx)}
                          >
                        <FiEye size={18} />
                      </button>
                          <button 
                            className="text-green-600 dark:text-green-300 hover:text-green-900 dark:hover:text-green-400 p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700 transition-colors" 
                            title="Mark Attendance" 
                            onClick={() => handleMarkAttendance(event.id, event.event)}
                          >
                            <FiCheckCircle size={18} />
                          </button>
                          <button 
                            className="text-purple-600 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-400 p-2 rounded-full hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors" 
                            title="Upload Attendance" 
                            onClick={() => handleUploadAttendance(event.id, event.event)}
                          >
                            <FiUpload size={18} />
                          </button>
                          {/* <button
                            className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
                            title="Edit Event"
                            onClick={() => openEditEventModal(event)}
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            className="text-red-600 dark:text-red-300 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                            title="Delete Event"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleteLoading}
                          >
                            <FiTrash2 size={18} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {paginated.map((event, idx) => (
              <div key={event.id || idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {event.event.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{event.event}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">#{startIdx + idx + 1}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Agenda:</span>
                    <div className="text-gray-800 dark:text-gray-100 max-w-xs truncate" title={stripHtml(event.agenda)}>
                      <div
                        className="line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: event.agenda,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Venue:</span>
                    <span className="text-gray-800 dark:text-gray-100">{event.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Date & Time:</span>
                    <span className="text-gray-800 dark:text-gray-100">
                      {event.datetime ? new Date(event.datetime).toLocaleString() : "TBD"}
                    </span>
                  </div>
                </div>
                
                                                                   <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                      onClick={() => openViewEventModal(idx)}
                                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700"
                                    >
                                      <FiEye size={14} />
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleMarkAttendance(event.id, event.event)}
                                      className="flex items-center gap-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700"
                                    >
                                      <FiCheckCircle size={14} />
                                      Mark
                                    </button>
                                    <button
                                      onClick={() => handleUploadAttendance(event.id, event.event)}
                                      className="flex items-center gap-1 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700"
                                    >
                                      <FiUpload size={14} />
                                      Upload
                                    </button>
                    {/* <button 
                      onClick={() => openEditEventModal(event)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deleteLoading}
                      className="flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors text-sm"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button> */}
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

        {/* Add Event Modal */}
        {showAddEventForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={handleHideAddEventForm}
                title="Close"
              >
                <FiX size={24} />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                  <FiPlus className="text-indigo-600" />
                  Add New Event
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Create a new past event with details, venue, and schedule</p>
              </div>
              
              <form className="space-y-6" onSubmit={handleAddEventSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="event"
                      value={addEventForm.event}
                      onChange={handleAddEventChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors ${formErrors.event ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                      placeholder="Enter event name"
                    />
                    {formErrors.event && (
                      <div className="text-red-600 text-xs mt-1">{formErrors.event}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={addEventForm.venue}
                      onChange={handleAddEventChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors ${formErrors.venue ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                      placeholder="Enter venue"
                    />
                    {formErrors.venue && (
                      <div className="text-red-600 text-xs mt-1">{formErrors.venue}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={addEventForm.date}
                      onChange={handleAddEventChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors ${formErrors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                      placeholder="Select date"
                    />
                    {formErrors.date && (
                      <div className="text-red-600 text-xs mt-1">{formErrors.date}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={addEventForm.time}
                      onChange={handleAddEventChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors ${formErrors.time ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                      placeholder="Select time"
                    />
                    {formErrors.time && (
                      <div className="text-red-600 text-xs mt-1">{formErrors.time}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image URL
                    </label>
                    <input
                      type="file"
                      name="invitationImage"
                      onChange={handleAddEventChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
                      accept="image/*"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agenda <span className="text-red-500">*</span>
                    </label>
                    <div className={`rounded-lg p-1 bg-white dark:bg-gray-700 ${formErrors.agenda ? 'border border-red-500' : ''}`}>
                      <RichTextEditor
                        data={addEventForm.agenda}
                        onChange={handleAgendaChange}
                        placeholder="Describe the event agenda and details"
                      />
                    </div>
                    {formErrors.agenda && (
                      <div className="text-red-600 text-xs mt-1">{formErrors.agenda}</div>
                    )}
                  </div>
                </div>
                
                {/* Removed saveError and saveSuccess messages */}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    onClick={handleHideAddEventForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      saveLoading 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {saveLoading ? (
                      <>
                        <FiRefreshCw className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FiPlus />
                        Add Event
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

                 {/* Edit Event Modal */}
         {showEditEventModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
               <button
                 type="button"
                 className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                 onClick={closeEditEventModal}
                 title="Close"
               >
                 <FiX size={24} />
               </button>
               <div className="mb-6">
                 <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                   <FiEdit2 className="text-blue-600 dark:text-blue-300" />
                   Edit Event
                 </h2>
                 <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                   Update event details, venue, and schedule
                 </p>
               </div>
               <form className="space-y-6" onSubmit={handleEditEventSubmit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Event Name <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="text"
                       name="event"
                       value={editEventForm.event}
                       onChange={handleEditEventChange}
                       className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:border-transparent transition-colors ${
                         editFormErrors.event
                           ? "border-red-500"
                           : "border-gray-200 dark:border-gray-600"
                       }`}
                       placeholder="Enter event name"
                     />
                     {editFormErrors.event && (
                       <div className="text-red-600 text-xs mt-1">
                         {editFormErrors.event}
                       </div>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Venue <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="text"
                       name="venue"
                       value={editEventForm.venue}
                       onChange={handleEditEventChange}
                       className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:border-transparent transition-colors ${
                         editFormErrors.venue
                           ? "border-red-500"
                           : "border-gray-200 dark:border-gray-600"
                       }`}
                       placeholder="Enter venue"
                     />
                     {editFormErrors.venue && (
                       <div className="text-red-600 text-xs mt-1">
                         {editFormErrors.venue}
                       </div>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Date <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="date"
                       name="date"
                       value={editEventForm.date}
                       onChange={handleEditEventChange}
                       className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:border-transparent transition-colors ${
                         editFormErrors.date
                           ? "border-red-500"
                           : "border-gray-200 dark:border-gray-600"
                       }`}
                       placeholder="Select date"
                     />
                     {editFormErrors.date && (
                       <div className="text-red-600 text-xs mt-1">
                         {editFormErrors.date}
                       </div>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Time <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="time"
                       name="time"
                       value={editEventForm.time}
                       onChange={handleEditEventChange}
                       className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:border-transparent transition-colors ${
                         editFormErrors.time
                           ? "border-red-500"
                           : "border-gray-200 dark:border-gray-600"
                       }`}
                       placeholder="Select time"
                     />
                     {editFormErrors.time && (
                       <div className="text-red-600 text-xs mt-1">
                         {editFormErrors.time}
                       </div>
                     )}
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Agenda <span className="text-red-500">*</span>
                     </label>
                     <div
                       className={`rounded-lg p-1 bg-white dark:bg-gray-700 ${
                         editFormErrors.agenda ? "border border-red-500" : ""
                       }`}
                     >
                       <RichTextEditor
                         data={editEventForm.agenda}
                         onChange={handleEditAgendaChange}
                         placeholder="Describe the event agenda and details"
                       />
                     </div>
                     {editFormErrors.agenda && (
                       <div className="text-red-600 text-xs mt-1">
                         {editFormErrors.agenda}
                       </div>
                     )}
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Invitation Image
                     </label>
                     <input
                       type="file"
                       name="invitationImage"
                       accept="image/*"
                       onChange={handleEditEventChange}
                       className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                     />
                     {editEventForm.imageUrl && (
                       <div className="mt-2">
                         <img
                           src={editEventForm.imageUrl}
                           alt="Current"
                           className="h-20 rounded-lg border dark:border-gray-600"
                         />
                         <span className="block text-xs text-gray-500 dark:text-gray-400">
                           Current image
                         </span>
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="flex gap-4 mt-4">
                   <button
                     type="button"
                     className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                     onClick={closeEditEventModal}
                     disabled={saveLoading}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={saveLoading}
                     className={`flex items-center gap-2 px-8 py-2 rounded-lg font-medium transition-colors text-white ${
                       saveLoading
                         ? "bg-gray-400 cursor-not-allowed"
                         : "bg-blue-600 hover:bg-blue-700"
                     }`}
                   >
                     {saveLoading ? (
                       <>
                         <FiRefreshCw className="animate-spin" />
                         Saving...
                       </>
                     ) : (
                       <>
                         <span className="text-lg">✔</span>
                         Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Event Modal */}
        {showViewEventModal && selectedEventIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4 relative">
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={closeViewEventModal}
                title="Close"
                aria-label="Close modal"
              >
                <FiX size={24} />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
                  <FiEye className="text-indigo-600" />
                  Past Event Details
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">View complete past event information</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <FiCalendar className="text-indigo-600" />
                    Event Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div><span className="font-medium text-gray-800 dark:text-gray-100">Event:</span> {paginated[selectedEventIdx]?.event}</div>
                    <div><span className="font-medium text-gray-800 dark:text-gray-100">Venue:</span> {paginated[selectedEventIdx]?.venue}</div>
                    <div><span className="font-medium text-gray-800 dark:text-gray-100">Date & Time:</span> {paginated[selectedEventIdx]?.datetime && new Date(paginated[selectedEventIdx]?.datetime).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Agenda</h3>
                  <div 
                    className="text-sm text-gray-600 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: decodeHtml(paginated[selectedEventIdx]?.agenda || ""),
                    }}
                  />
                </div>
                
                {paginated[selectedEventIdx]?.imageUrl && paginated[selectedEventIdx]?.imageUrl.trim() !== "" && !imageError ? (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <FiImage className="text-indigo-600" />
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
                      <FiImage className="text-gray-400" />
                      Event Image
                    </h3>
                    <div className="text-gray-400 dark:text-gray-300 italic text-sm">No image available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Attendance Modal */}
        <UploadAttendanceModal
          isOpen={showUploadModal}
          onClose={closeUploadModal}
          eventId={selectedEventForUpload?.id}
          eventName={selectedEventForUpload?.name}
          onSuccess={handleUploadSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
