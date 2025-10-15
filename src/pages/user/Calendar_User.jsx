import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/Layout/DashboardLayout";
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiSearch, FiFilter, FiRefreshCw, FiEye, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from 'react-toastify';

// Helper functions
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
function getEventDotColor(events) {
  if (events.some((ev) => ev.type === "past")) return "bg-red-500";
  if (events.some((ev) => ev.type === "today")) return "bg-green-400";
  if (events.some((ev) => ev.type === "upcoming")) return "bg-blue-400";
  return "bg-pink-400";
}



// SimpleCalendar component
// Helper functions remain unchanged...

const SimpleCalendar = ({ selectedDate, onDateSelect, events }) => {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) days.push(day);

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth + direction);
    onDateSelect(newDate);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          title="Previous Month"
        >
          <FiChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          title="Next Month"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-white py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 dark:bg-gray-700 rounded-xl p-2 flex-1 overflow-hidden">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-12 w-full"></div>;
          }
          const dayDate = new Date(currentYear, currentMonth, day);
          const eventsForDay = events.filter(event => isSameDay(new Date(event.date), dayDate));
          const isSelected = isSameDay(dayDate, selectedDate);
          const isToday = isSameDay(dayDate, today);
          const dotColor = getEventDotColor(eventsForDay);

          // --- CORRECTED CLASSES ---
          let cellClass = "h-12 w-full cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg relative group flex items-center justify-center ";
          // Selected date - circular shape
          if (isSelected) {
            cellClass +=
              "ring-2 ring-emerald-400 bg-emerald-100 text-black dark:bg-emerald-700 dark:text-white shadow-md rounded-full w-10 h-10 mx-auto ";
          } else {
            cellClass +=
              "hover:bg-gradient-to-br hover:from-emerald-50 hover:to-blue-50 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-lg ";
          }
          // TODAY - only if not selected date
          if (isToday && !isSelected) {
            cellClass +=
              "bg-yellow-300 dark:bg-yellow-500 text-black dark:text-white ring-1 ring-yellow-400 rounded-lg ";
          }
          return (
            <div
              key={index}
              onClick={() => onDateSelect(dayDate)}
              className={cellClass}
            >
              <div className="text-sm font-bold text-gray-800 dark:text-white flex items-center justify-center w-full h-full">
                {day}
              </div>
              {eventsForDay.length > 0 && (
                <>
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm ${dotColor} ${eventsForDay.some(ev => ev.type === 'past') ? '' : 'animate-pulse'}`} />
                  {eventsForDay.length > 1 && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {eventsForDay.length}
                    </div>
                  )}
                  <div className="pointer-events-none absolute -top-12 left-1/2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white group-hover:block z-50 shadow-xl">
                    <div className="font-semibold mb-1">Events:</div>
                    {eventsForDay.slice(0, 3).map((ev, idx) => (
                      <div key={idx} className="truncate">{ev.name}</div>
                    ))}
                    {eventsForDay.length > 3 && (
                      <div className="text-gray-300">+{eventsForDay.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Stats for pills (use backend endpoints for counts to match Dashboard)
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [showEditEventModal, setShowEditEventModal] = useState(false);


  // Fetch event counts from backend endpoints
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        // Upcoming events count
        const futureRes = await api.post('/event/future', {}, {
          headers: getAuthHeaders()
        });
        let futureEvents = [];
        if (Array.isArray(futureRes.data?.data?.event)) {
          futureEvents = futureRes.data.data.event;
        } else if (Array.isArray(futureRes.data?.data?.events)) {
          futureEvents = futureRes.data.data.events;
        } else if (Array.isArray(futureRes.data?.data)) {
          futureEvents = futureRes.data.data;
        } else if (Array.isArray(futureRes.data)) {
          futureEvents = futureRes.data;
        } else if (futureRes.data?.data && typeof futureRes.data.data === 'object') {
          futureEvents = Object.values(futureRes.data.data);
        } else {
          futureEvents = [];
        }
        setUpcomingCount(futureEvents.length);

        // Past events count
        const pastRes = await api.post('/event/past', {}, {
          headers: getAuthHeaders()
        });
        let pastEvents = [];
        if (Array.isArray(pastRes.data?.data?.event)) {
          pastEvents = pastRes.data.data.event;
        } else if (Array.isArray(pastRes.data?.data?.events)) {
          pastEvents = pastRes.data.data.events;
        } else if (Array.isArray(pastRes.data?.data)) {
          pastEvents = pastRes.data.data;
        } else if (Array.isArray(pastRes.data)) {
          pastEvents = pastRes.data;
        } else if (pastRes.data?.data && typeof pastRes.data.data === 'object') {
          pastEvents = Object.values(pastRes.data.data);
        } else {
          pastEvents = [];
        }
        setPastCount(pastEvents.length);

        // Today events count (from all events, filter for today)
        const today = new Date();
        today.setHours(0,0,0,0);
        const allToday = [...futureEvents, ...pastEvents].filter(e => {
          let eventDate;
          if (e.event_date && e.event_time) {
            eventDate = new Date(`${e.event_date}T${e.event_time}`);
          } else if (e.datetime) {
            eventDate = new Date(e.datetime);
          } else if (e.date_time) {
            eventDate = new Date(e.date_time);
          } else if (e.date) {
            eventDate = new Date(e.date);
          } else {
            eventDate = new Date();
          }
          eventDate.setHours(0,0,0,0);
          return eventDate.getTime() === today.getTime();
        });
        setTodayCount(allToday.length);
      } catch (err) {
        setUpcomingCount(0);
        setPastCount(0);
        setTodayCount(0);
      }
    };
    fetchCounts();
    // Removed setInterval polling
    // Only call fetchCounts after CRUD operations
    return () => {};
  }, []);

  // Fetch events from backend and poll every 10 seconds
  useEffect(() => {
    let interval;
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const uid = localStorage.getItem('uid');
        const response = await api.post('/event/index', {}, {
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
        // Map backend fields to calendar event structure
        const mappedEvents = backendEvents.map((e, idx) => {
          // Always parse date as a JS Date object
          let eventDate = null;
          if (e.event_date && e.event_time) {
            eventDate = new Date(`${e.event_date}T${e.event_time}`);
          } else if (e.event_date) {
            eventDate = new Date(e.event_date);
          } else if (e.datetime) {
            eventDate = new Date(e.datetime);
          } else if (e.date_time) {
            eventDate = new Date(e.date_time);
          } else if (e.date) {
            eventDate = new Date(e.date);
          } else {
            eventDate = new Date();
          }
          // Defensive: if eventDate is a string, convert to Date
          if (!(eventDate instanceof Date) || isNaN(eventDate)) {
            eventDate = new Date(eventDate);
          }
          // Determine type
          const today = new Date();
          today.setHours(0,0,0,0);
          const eventDay = new Date(eventDate);
          eventDay.setHours(0,0,0,0);
          let type = 'upcoming';
          if (eventDay < today) type = 'past';
          else if (eventDay.getTime() === today.getTime()) type = 'today';
          return {
            id: e.id || idx, // Assuming 'id' is available in backend
            name: e.event_title || e.event || e.title || e.name || '',
            date: eventDate,
            attendees: e.attendees || e.attendee_count || e.count || 0,
            description: e.event_description || e.agenda || e.description || '',
            type,
            imageUrl: e.event_image || '', // Assuming 'event_image' is available
          };
        });
        setEvents(mappedEvents);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    return () => {};
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Events for selected date
  const eventsForDate = events.filter(ev => isSameDay(ev.date, selectedDate));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-orange-600">Event Calendar</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar className="text-indigo-600" />
            <span>Total Events: {events.length}</span>
                </div>
                </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 w-full">
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-indigo-600 text-xl" />
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Calendar Management</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiClock className="text-indigo-600" />
                <span>Manage events and schedules</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">{events.filter(ev => isSameDay(new Date(ev.date), new Date())).length} Today</span>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">{upcomingCount} Upcoming</span>
                <span className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-semibold">{pastCount} Past</span>
                <span className="text-gray-700 dark:text-gray-200 font-semibold ml-2">{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{time.toLocaleTimeString([], { hour12: false })}</span>
              </div>

            </div>
          </div>

          {/* Main Content: Two Columns */}
          <div className="flex flex-col xl:flex-row gap-6 p-6 h-[800px]">
            {/* Left: Calendar Card */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
                <div className="bg-transparent rounded-2xl border border-gray-200 dark:border-gray-700 relative h-full flex flex-col overflow-hidden">
                 <div className="p-4 flex-1 flex flex-col justify-start overflow-hidden">
                  <SimpleCalendar 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    events={events}
                  />
                </div>
              </div>
            </div>
            
            {/* Right: Event Details Card */}
            <div className="w-full xl:w-96 flex-shrink-0 h-full flex flex-col">
              <div className="bg-transparent rounded-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FiEye className="text-indigo-600" />
                    Event Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    Events for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  </div>
                {/* Event cards for selected date */}
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {eventsForDate.length === 0 ? (
                    <div className="text-center py-8">
                      <FiCalendar className="text-gray-300 dark:text-gray-600 text-4xl mx-auto mb-3" />
                      <p className="text-gray-400 dark:text-gray-300 text-sm">No events scheduled for this date</p>
                    </div>
                  ) : (
                    eventsForDate.map((ev, idx) => (
                      <div key={idx} className={`rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
                        ev.type === 'today' 
                          ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700' 
                          : ev.type === 'upcoming' 
                            ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700' 
                            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              ev.type === 'today' 
                                ? 'bg-green-500' 
                                : ev.type === 'upcoming' 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-500'
                            }`}></div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ev.name}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ev.type === 'today' 
                              ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200' 
                              : ev.type === 'upcoming' 
                                ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200' 
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                          }`}>
                                {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                              </span>
                            </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-2">
                            <FiCalendar className="text-gray-400" size={14} />
                            <span>{ev.date.toLocaleDateString()}</span>
                              </div>
                         {ev.description && (
                           <div className="overflow-x-auto whitespace-nowrap"><span className="font-medium text-gray-800 dark:text-gray-100">Agenda:</span> {ev.description.replace(/<[^>]*>/g, '')}</div>
                         )}
                        </div>
                        

                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="px-6 pb-4">
            <div className="bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FiCalendar className="text-indigo-600" size={16} />
                Event Color Legend
              </h3>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Past Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Today's Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm"></div>
                  <span className="text-gray-600 dark:text-gray-400">Upcoming Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>






        {/* Edit Event Modal */}
        {showEditEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                onClick={closeEditEventModal}
                title="Close"
              >
                <FiX size={24} />
              </button>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <FiEdit2 className="text-indigo-600 dark:text-indigo-300" />
                  Edit Event
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Modify the details of the event</p>
      </div>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="event"
                      value=""
                      onChange={() => {}}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                      placeholder="Enter event name"
                    />
                    
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value=""
                      onChange={() => {}}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                      placeholder="Enter venue"
                    />
                    
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value=""
                      onChange={() => {}}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                      placeholder="Select date"
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      value=""
                      onChange={() => {}}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                      placeholder="Select time"
                    />

                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agenda <span className="text-red-500">*</span>
                    </label>
                                          <textarea
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                        placeholder="Describe the event agenda and details"
                        rows={4}
                      />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invitation Image
                    </label>
                    <input
                      type="file"
                      name="invitationImage"
                      accept="image/*"
                      onChange={() => {}}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-300 focus:border-transparent transition-colors border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>


                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {}}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                      className="flex items-center gap-2 px-8 py-2 rounded-lg font-medium transition-colors text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <span className="text-lg">✔</span>
                        Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Removed custom notification UI */}
    </DashboardLayout>
  );
} 