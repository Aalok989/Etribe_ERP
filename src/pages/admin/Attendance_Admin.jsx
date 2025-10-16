import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from "react-toastify";

export default function Attendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showAddAttendanceModal, setShowAddAttendanceModal] = useState(false);
  const [showViewAttendanceModal, setShowViewAttendanceModal] = useState(false);
  const [selectedAttendanceIdx, setSelectedAttendanceIdx] = useState(null);
  const [addAttendanceForm, setAddAttendanceForm] = useState({
    event: "",
    member: "",
    status: "Present",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortField, setSortField] = useState("event");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchAttendanceRecords();
    fetchEvents();
    fetchMembers();
  }, []);

  // Handle URL parameters and fetch data in a single useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    const eventName = searchParams.get('eventName');
    
    console.log('URL eventId:', eventId);
    console.log('URL eventName:', eventName);
    
    if (eventId && eventName) {
      // Create event object from URL parameters
      const selectedEvent = {
        id: eventId,
        title: decodeURIComponent(eventName),
        event: decodeURIComponent(eventName),
        name: decodeURIComponent(eventName)
      };
      
      console.log('Created event from URL:', selectedEvent);
      setSelectedEvent(selectedEvent);
      setAddAttendanceForm(prev => ({
        ...prev,
        event: selectedEvent.title
      }));
      
      // Fetch members for this event in the same useEffect
      fetchMembers(eventId);
    }
  }, [location.search]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/attendance/records');
      // setAttendanceRecords(response.data.data || []);
      setAttendanceRecords([]);
    } catch (err) {
      toast.error("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/events');
      // setEvents(response.data.data || []);
      setEvents([]);
    } catch (err) {
      console.error("Failed to fetch events");
    }
  };

  const fetchMembers = async (eventId = null) => {
    try {
      console.log('Fetching all active members');
      setLoading(true); // Set loading state
      
      // Get auth headers from localStorage
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      // Fetch ALL active members from the API
      const response = await api.get('/attendance/get_active_members', {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response:', response);
      
      // Handle mixed response (PHP error + JSON data)
      let data = response.data;
      
      // If response.data is a string, try to extract JSON from it
      if (typeof response.data === 'string') {
        try {
          // Find the JSON part after the HTML error message
          const jsonStart = response.data.indexOf('{');
          if (jsonStart !== -1) {
            const jsonString = response.data.substring(jsonStart);
            data = JSON.parse(jsonString);
            console.log('Parsed JSON data:', data);
          }
        } catch (parseError) {
          console.error('Failed to parse JSON from response:', parseError);
          setMembers([]);
          return;
        }
      }
      
      if (data && data.data && Array.isArray(data.data)) {
        const mappedMembers = data.data.map(member => ({
          id: member.id,
          name: member.name,
          company: member.company_name,
          email: member.email,
          phone: member.phone_num,
          plan: member.plan_name,
          membership_plan_id: member.membership_plan_id,
          is_attended: false // Default to false, will be updated with attendance status
        }));
        // Don't set members yet - wait for attendance data
        console.log('Mapped members:', mappedMembers);
        
        // After fetching all members, get their attendance status for this specific event
        if (eventId) {
          await fetchEventAttendance(eventId, mappedMembers);
        } else {
          // If no eventId, just set the members without attendance data
          setMembers(mappedMembers);
        }
      } else {
        console.log('No valid data structure found:', data);
        setMembers([]);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
      console.log('Error details:', err.message);
      setMembers([]);
    } finally {
      setLoading(false); // Reset loading state
    }
  };


  // Fetch attendance status for specific event
  const fetchEventAttendance = async (eventId, mappedMembers) => {
    try {
      console.log('Fetching attendance for eventId:', eventId);
      
      // Get auth headers from localStorage
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      // Fetch attendance data for this specific event
      const response = await api.post('/attendance/get_active_members_by_event', {
        event_id: eventId
      }, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Event Attendance API Response:', response);
      
      if (response.data && response.data.status === true && response.data.data) {
        // Update members with real attendance status from backend
        const updatedMembers = mappedMembers.map(member => {
          // Check if this member is in the attendance data
          const attendanceRecord = response.data.data.find(record => 
            record.id === member.id || record.user_id === member.id
          );
          
          return {
            ...member,
            is_attended: attendanceRecord ? true : false
          };
        });
        
        // Set members with attendance status in one go
        setMembers(updatedMembers);
        console.log('Set members with attendance status:', updatedMembers);
      } else {
        // If no attendance data, just set the members as is
        setMembers(mappedMembers);
        console.log('Set members without attendance data:', mappedMembers);
      }
    } catch (err) {
      console.error("Failed to fetch event attendance:", err);
      // If attendance API fails, still show the members
      setMembers(mappedMembers);
      console.log('Set members after attendance API error:', mappedMembers);
    }
  };

  // Filtered, sorted and paginated data
  const filtered = members.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.company.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "checkInTime" || sortField === "checkOutTime") {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
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

  const handleAttendanceToggle = async (memberId) => {
    try {
      // Get eventId from URL parameters
      const searchParams = new URLSearchParams(location.search);
      const eventId = searchParams.get('eventId');
      
      if (!eventId) {
        toast.error("Event ID not found");
        return;
      }

      // Get current member state
      const currentMember = members.find(member => member.id === memberId);
      if (!currentMember) {
        toast.error("Member not found");
        return;
      }

      // Get auth headers from localStorage
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      if (!uid || !token) {
        toast.error("Authentication required");
        return;
      }

      // Call the attendance API using axios instance to avoid CORS issues
      const response = await api.post('/attendance/add_attendance', {
        event_id: eventId,
        user_id: memberId
      }, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Attendance API Response:', response);
      const data = response.data;

      if (data.status === true) {
        // Show success message
        const action = currentMember.is_attended ? "removed from" : "marked for";
        toast.success(`Attendance ${action} ${currentMember.name}`);
        
        // Update local state to reflect the change
        setMembers(prev => prev.map(member => 
          member.id === memberId 
            ? { ...member, is_attended: !member.is_attended }
            : member
        ));
      } else {
        toast.error(data.message || "Failed to update attendance");
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response?.data?.message) {
        toast.error(`API Error: ${error.response.data.message}`);
      } else if (error.response?.status) {
        toast.error(`HTTP Error: ${error.response.status}`);
      } else {
        toast.error("Failed to update attendance. Please try again.");
      }
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleRefresh = () => {
    setSearch("");
    // Get eventId from URL parameters to ensure consistency
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    
    if (eventId) {
      // Refresh both members and their attendance status
      fetchMembers(eventId);
      toast.info("Refreshing attendance data...");
    } else {
      fetchMembers();
      toast.info("Refreshing members...");
    }
  };

  // Mark all members as attended
  const handleMarkAllAttendance = async () => {
    try {
      // Get eventId from URL parameters
      const searchParams = new URLSearchParams(location.search);
      const eventId = searchParams.get('eventId');
      
      if (!eventId) {
        toast.error("Event ID not found");
        return;
      }

      // Get auth headers from localStorage
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      if (!uid || !token) {
        toast.error("Authentication required");
        return;
      }

      // Get all unmarked members
      const unmarkedMembers = members.filter(member => !member.is_attended);
      
      if (unmarkedMembers.length === 0) {
        toast.info("All members are already marked as attended!");
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to mark ${unmarkedMembers.length} members as attended for this event?`
      );

      if (!confirmed) {
        return;
      }

      setLoading(true);
      
      // Use the bulk attendance API endpoint
      const response = await api.post('/attendance/add_all_attendance', {
        event_id: eventId
      }, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Bulk Attendance API Response:', response);
      const data = response.data;

      if (data.status === true) {
        // Update local state to mark all members as attended
        setMembers(prev => prev.map(member => ({
          ...member,
          is_attended: true
        })));
        
        toast.success(`Successfully marked all ${unmarkedMembers.length} members as attended!`);
      } else {
        toast.error(data.message || "Failed to mark all attendance");
      }
    } catch (error) {
      console.error("Failed to mark all attendance:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response?.data?.message) {
        toast.error(`API Error: ${error.response.data.message}`);
      } else if (error.response?.status) {
        toast.error(`HTTP Error: ${error.response.status}`);
      } else {
        toast.error("Failed to mark all attendance. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add Attendance Modal
  const openAddAttendanceModal = () => {
    setAddAttendanceForm({
      event: "",
      member: "",
      status: "Present",
      checkInTime: "",
      checkOutTime: "",
      notes: "",
    });
    setFormErrors({});
    setShowAddAttendanceModal(true);
  };

  const closeAddAttendanceModal = () => setShowAddAttendanceModal(false);

  const handleAddAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAddAttendanceForm({ ...addAttendanceForm, [name]: value });
    setFormErrors({ ...formErrors, [name]: undefined });
  };

  const validateForm = () => {
    const errors = {};
    if (!addAttendanceForm.event.trim())
      errors.event = "The Event field is required.";
    if (!addAttendanceForm.member.trim())
      errors.member = "The Member field is required.";
    if (!addAttendanceForm.status.trim())
      errors.status = "The Status field is required.";
    return errors;
  };

  const handleAddAttendanceSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(Object.values(errors).join("\n"));
      return;
    }

    setSaveLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.post('/attendance/add', addAttendanceForm);
      // if (response.data.success) {
      //   toast.success("Attendance record added successfully!");
      //   closeAddAttendanceModal();
      //   fetchAttendanceRecords(); // Refresh the list
      // }
      
      // TODO: Replace with actual API call
      // const response = await api.post('/attendance/add', addAttendanceForm);
      // if (response.data.success) {
      //   toast.success("Attendance record added successfully!");
      //   closeAddAttendanceModal();
      //   fetchAttendanceRecords(); // Refresh the list
      // }
      
      toast.success("Attendance record added successfully!");
      closeAddAttendanceModal();
    } catch (error) {
      toast.error("Failed to add attendance record");
    } finally {
      setSaveLoading(false);
    }
  };

  const openViewAttendanceModal = (idx) => {
    setSelectedAttendanceIdx(idx);
    setShowViewAttendanceModal(true);
  };

  const closeViewAttendanceModal = () => setShowViewAttendanceModal(false);

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
              {selectedEvent 
                ? `Mark Attendance: ${selectedEvent.title || selectedEvent.event || selectedEvent.name}`
                : "Event Attendance Management"
              }
            </h1>
            {selectedEvent && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Managing attendance for specific event
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUsers className="text-indigo-600" />
            <span>Total Members: {members.length}</span>
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
                  placeholder="Search members, companies, emails..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {filtered.length} of {members.length} members</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">
              {/* Back to Events button when in specific event context */}
              {selectedEvent && (
                <button
                  onClick={() => navigate('/admin/all-events')}
                  className="flex items-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                  title="Back to Events"
                >
                  ← Back to Events
                </button>
              )}
              
              {/* Mark All Attendance Button */}
              {selectedEvent && (
                <button
                  onClick={handleMarkAllAttendance}
                  disabled={loading}
                  className="flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Mark All Members as Attended"
                >
                  <FiUserCheck />
                  <span>Mark All</span>
                </button>
              )}
              
              <button 
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={handleRefresh}
                title="Refresh Members"
              >
                <FiRefreshCw /> 
                <span>Refresh</span>
              </button>
              
              <button
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                onClick={() => {
                  if (selectedEvent && selectedEvent.id) {
                    navigate(`/admin/attendance-list?eventId=${selectedEvent.id}&eventName=${encodeURIComponent(selectedEvent.title || selectedEvent.event || selectedEvent.name)}`);
                  } else {
                    toast.error("Please select an event first");
                  }
                }}
              >
                <span className="hidden sm:inline">Attendance List</span>
                <span className="sm:hidden">List</span>
              </button>
            </div>
          </div>

          {/* Table - Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            {members.length > 0 ? (
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
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("phone")}>
                    Contact {getSortIcon("phone")}
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer" onClick={() => handleSort("email")}>
                    Email {getSortIcon("email")}
                  </th>
                  <th className="p-3 text-center font-semibold whitespace-nowrap">
                    Mark Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={member.id} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50 dark:bg-[#202123]/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{member.name}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{member.company || "N/A"}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{member.phone}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{member.email}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          {/* Working Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(member.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                              member.is_attended 
                                ? 'bg-purple-500' 
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                                member.is_attended ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          
                          {/* Text Label */}
                          <span className={`text-sm font-medium whitespace-nowrap min-w-[80px] text-left ${
                            member.is_attended 
                              ? 'text-purple-600' 
                              : 'text-gray-900 dark:text-gray-300'
                          }`}>
                            {member.is_attended ? 'Attended' : 'Mark'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
              <div className="text-center py-12">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No members available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No active members found for this event.</p>
              </div>
            )}
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {members.length > 0 ? (
              members.map((member, idx) => (
                <div key={member.id} className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{member.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">#{idx + 1}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{member.plan}</span>
                      <div className="flex items-center gap-2">
                        {/* Working Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(member.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            member.is_attended 
                              ? 'bg-purple-500' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                              member.is_attended ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        
                        {/* Text Label */}
                        <span className={`text-xs font-medium whitespace-nowrap min-w-[60px] text-left ${
                          member.is_attended 
                            ? 'text-purple-600' 
                            : 'text-gray-900 dark:text-gray-300'
                        }`}>
                          {member.is_attended ? 'Attended' : 'Mark'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Company:</span>
                      <span className="text-gray-800 dark:text-gray-100">{member.company || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                      <span className="text-gray-800 dark:text-gray-100">{member.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-800 dark:text-gray-100">{member.email}</span>
                    </div>
                  </div>
                </div>
            ))
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No members available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No active members found for this event.</p>
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
                className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-400 dark:hover:bg-gray-700 transition-colors ${
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

        {/* Add Attendance Modal */}
        {showAddAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={closeAddAttendanceModal}
                title="Close"
              >
                <FiX size={24} />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <FiPlus className="text-indigo-600 dark:text-indigo-300" />
                  Attendance List
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  View and manage attendance records
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleAddAttendanceSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="event"
                      value={addAttendanceForm.event}
                      onChange={handleAddAttendanceChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors ${
                        formErrors.event
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <option value="">Select Event</option>
                      {events.length > 0 ? (
                        events.map(event => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No events available</option>
                      )}
                    </select>
                    {formErrors.event && (
                      <div className="text-red-600 text-xs mt-1">
                        {formErrors.event}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="member"
                      value={addAttendanceForm.member}
                      onChange={handleAddAttendanceChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors ${
                        formErrors.member
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <option value="">Select Member</option>
                      {members.length > 0 ? (
                        members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} - {member.company} ({member.plan})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No members available</option>
                      )}
                    </select>
                    {formErrors.member && (
                      <div className="text-red-600 text-xs mt-1">
                        {formErrors.member}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={addAttendanceForm.status}
                      onChange={handleAddAttendanceChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Left Early">Left Early</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Check In Time
                    </label>
                    <input
                      type="datetime-local"
                      name="checkInTime"
                      value={addAttendanceForm.checkInTime}
                      onChange={handleAddAttendanceChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Check Out Time
                    </label>
                    <input
                      type="datetime-local"
                      name="checkOutTime"
                      value={addAttendanceForm.checkOutTime}
                      onChange={handleAddAttendanceChange}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={addAttendanceForm.notes}
                      onChange={handleAddAttendanceChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors"
                      placeholder="Additional notes about attendance..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    onClick={closeAddAttendanceModal}
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
                        : "bg-indigo-600 hover:bg-indigo-700"
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
                        Save Attendance
                      </>
                      )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Attendance Modal */}
        {showViewAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={closeViewAttendanceModal}
                title="Close"
              >
                <FiX size={24} />
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <FiEye className="text-indigo-600 dark:text-indigo-300" />
                  Attendance Details
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  View complete attendance information
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Event:
                    </span>{" "}
                    {paginated[selectedAttendanceIdx]?.event}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Member:
                    </span>{" "}
                    {paginated[selectedAttendanceIdx]?.member}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Company:
                    </span>{" "}
                    {paginated[selectedAttendanceIdx]?.company}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Status:
                    </span>{" "}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      paginated[selectedAttendanceIdx]?.status === "Present" 
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : paginated[selectedAttendanceIdx]?.status === "Absent"
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    }`}>
                      {paginated[selectedAttendanceIdx]?.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Check In:
                    </span>{" "}
                    {paginated[selectedAttendanceIdx]?.checkInTime
                      ? new Date(paginated[selectedAttendanceIdx]?.checkInTime).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      Check Out:
                    </span>{" "}
                    {paginated[selectedAttendanceIdx]?.checkOutTime
                      ? new Date(paginated[selectedAttendanceIdx]?.checkOutTime).toLocaleString()
                      : "N/A"}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Notes
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {paginated[selectedAttendanceIdx]?.notes || "No notes available"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
