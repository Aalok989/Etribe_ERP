import React, { useState, useEffect } from "react";
import { FiCalendar, FiMapPin, FiClock, FiUsers } from "react-icons/fi";
import { useDashboard } from '../../../context/DashboardContext';

// Utility function to strip HTML tags
function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '');
}

export default function UpcomingEvents() {
  const { data: dashboardData, loading: dashboardLoading, errors } = useDashboard();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  // Use data from dashboard context
  const loading = dashboardLoading.events || dashboardLoading.initial;
  const rawEvents = dashboardData.events.future || [];

  useEffect(() => {
    if (rawEvents.length > 0) {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const mappedEvents = rawEvents.map((e, idx) => {
        const eventDate = e.event_date && e.event_time
          ? new Date(`${e.event_date}T${e.event_time}`)
          : e.datetime ? new Date(e.datetime) : new Date();
        
        return {
          id: e.id || idx,
          day: eventDate.toLocaleDateString('en-US', { weekday: 'short' }),
          date: eventDate.getDate().toString(),
          month: eventDate.toLocaleDateString('en-US', { month: 'short' }),
          year: eventDate.getFullYear().toString(),
          title: e.event_title || e.event || e.title || e.name || `Event ${idx + 1}`,
          time: e.event_time || '12:00 PM',
          venue: e.event_venue || e.venue || e.location || 'TBD',
          description: e.event_description || e.agenda || e.description || 'No description available.',
          imageUrl: e.event_image
            ? (e.event_image.startsWith("http") ? e.event_image : BASE_URL + e.event_image)
            : (e.image || e.imageUrl || ""),
        };
      });

      setEvents(mappedEvents);
      if (mappedEvents.length > 0 && !selected) {
        setSelected(mappedEvents[0]);
      }
    } else {
      setEvents([]);
      setSelected(null);
    }
  }, [rawEvents, selected]);

  // If no events, show a message
  if (loading) {
    return (
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 h-full w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="relative rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white dark:bg-gray-800" />
          <h2 className="relative z-10 text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            Upcoming Events
          </h2>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 h-full w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="relative rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white dark:bg-gray-800" />
          <h2 className="relative z-10 text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            Upcoming Events
          </h2>
        </div>
        <div className="p-5 flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>No upcoming events</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 h-full w-full flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="relative rounded-t-2xl overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-gray-800" />
        <h2 className="relative z-10 text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          Upcoming Events
        </h2>
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex space-x-3 overflow-x-auto whitespace-nowrap pb-2 mb-3 custom-scroll">
            {events.map((event) => (
              <button
                key={event.id}
                className={`relative flex flex-col items-center px-3 py-2 mt-1 rounded-lg border-2 transition-colors duration-150 min-w-[65px] shadow-sm font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60 mx-1 overflow-hidden ${
                  selected?.id === event.id
                    ? "bg-gradient-to-br from-indigo-100 via-blue-50 to-blue-100 dark:from-indigo-900 dark:via-blue-900 dark:to-gray-900 border-indigo-400 scale-105 z-10"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-indigo-100 dark:hover:bg-gray-700 hover:border-indigo-400"
                }`}
                onClick={() => setSelected(event)}
              >
                {selected?.id === event.id ? (
                  <>
                    <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-lg pointer-events-none" />
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {event.day}
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {event.date}
                      </span>
                      <span className="text-xs text-gray-900 dark:text-gray-100">
                        {event.month}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-100">{event.day}</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{event.date}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-100">{event.month}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {selected && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 dark:border-blue-400 shadow-sm overflow-y-auto custom-scroll max-h-72 mt-2 mb-3">
              <h3 className="text-base font-bold mb-1 text-indigo-700 dark:text-indigo-200">
                {selected.title}
              </h3>
              <div className="text-xs mb-1 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Date:</span> {selected.day},{" "}
                {selected.date} {selected.month} {selected.year}
              </div>
              <div className="text-xs mb-1 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Time:</span> {selected.time}
              </div>
              <div className="text-xs mb-1 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Venue:</span> {selected.venue}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line">
                <span className="font-semibold">Description:</span>{" "}
                {stripHtmlTags(selected.description)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
