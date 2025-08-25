import React, { useEffect, useState, useRef } from "react";
import { FiSun, FiMoon, FiUser, FiBell, FiClock, FiCalendar, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../../api/axiosConfig";
import { getAuthHeaders } from "../../../utils/apiHeaders";

export default function TopBar() {
  const [profile, setProfile] = useState({ 
    name: "", 
    email: "", 
    photo: null,
    company_name: "",
    phone: ""
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef(null);
  
  // No more hardcoded groupData - we fetch real user data from API

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Helper: Format event time string for past and future dates
  function formatEventTime(dateString) {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    const now = new Date();
    const diffSeconds = Math.round((date - now) / 1000);

    if (diffSeconds < 0) { // Event is in the past
        const absSeconds = Math.abs(diffSeconds);
        if (absSeconds < 60) return `${absSeconds} seconds ago`;
        if (absSeconds < 3600) return `${Math.floor(absSeconds / 60)} minutes ago`;
        if (absSeconds < 86400) return `${Math.floor(absSeconds / 3600)} hours ago`;
        return `${Math.floor(absSeconds / 86400)} days ago`;
    } else { // Event is in the future
        if (diffSeconds < 60) return `in a few seconds`;
        if (diffSeconds < 3600) return `in ${Math.floor(diffSeconds / 60)} minutes`;
        if (diffSeconds < 86400) return `in ${Math.floor(diffSeconds / 3600)} hours`;
        const diffDays = Math.ceil(diffSeconds / 86400);
        if (diffDays === 1) return `in 1 day`;
        if (diffDays <= 30) return `in ${diffDays} days`;
        // For dates far in the future, just show the date
        return `on ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      if (!token || !uid) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const { data } = await api.post('/event/future', {}, {
        headers: getAuthHeaders()
      });
      let backendEvents = [];
      if (data && data.events) {
        backendEvents = data.events;
      } else if (data && data.data && Array.isArray(data.data.events)) {
        backendEvents = data.data.events;
      } else if (data && data.data && Array.isArray(data.data.event)) {
        backendEvents = data.data.event;
      } else if (data && Array.isArray(data.data)) {
        backendEvents = data.data;
      }
      
      const readNotificationIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');

      // Map events to notification objects, preserve read state if possible
      setNotifications(prev => {
        const mapped = backendEvents.map((e, idx) => {
          const id = e.id || `event-${idx}`;
          return {
            id,
            name: e.event_title || e.event || e.title || e.name || "Untitled Event",
            date: e.event_date && e.event_time ? `${e.event_date}T${e.event_time}` : e.event_date || e.datetime || e.date_time || e.date,
            read: readNotificationIds.includes(id),
          };
        });
        setUnreadCount(mapped.filter(n => !n.read).length);
        return mapped;
      });
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsRef]);

  // Mark as read handler
  const markAsRead = (id) => {
    // Add to localStorage
    const readNotificationIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotificationIds.includes(id)) {
      readNotificationIds.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotificationIds));
    }

    setNotifications(notifications => {
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  // Fetch current user's profile data using the same API as MemberDetail
  const fetchUserProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (!token || !uid) {
        setError('Authentication required');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let foundUser = null;

      // First try to fetch from active_members endpoint (same as MemberDetail)
      try {
        const activeResponse = await api.post('/userDetail/active_members', {}, {
          headers: getAuthHeaders(),
          timeout: 10000
        });

        if (activeResponse.data.success || activeResponse.data) {
          const activeMembers = Array.isArray(activeResponse.data) ? activeResponse.data : activeResponse.data.data || [];
          foundUser = activeMembers.find(m => m.id === uid || m.company_detail_id === uid || m.user_detail_id === uid);
        }
      } catch (err) {
        console.error('Error fetching from active members:', err);
      }

      // If not found in active members, try not_members endpoint (same as MemberDetail)
      if (!foundUser) {
        try {
          const pendingResponse = await api.post('/userDetail/not_members', { uid }, {
            headers: getAuthHeaders(),
            timeout: 10000
          });
          
          const pendingMembers = Array.isArray(pendingResponse.data) ? pendingResponse.data : pendingResponse.data.data || [];
          foundUser = pendingMembers.find(m => m.id === uid || m.company_detail_id === uid || m.user_detail_id === uid);
        } catch (err) {
          console.error('Error fetching from not members:', err);
        }
      }

              if (foundUser) {
          // Debug: Log the user data to see what fields are available
          console.log('Found user data:', foundUser);
          console.log('Photo fields:', {
            profile_image: foundUser.profile_image,
            user_image: foundUser.user_image,
            avatar: foundUser.avatar,
            logo: foundUser.logo,
            company_logo: foundUser.company_logo,
            business_logo: foundUser.business_logo
          });
          
          setProfile({
            name: foundUser.name || foundUser.full_name || foundUser.company_name || 'User',
            email: foundUser.email || foundUser.email_id || foundUser.company_email || 'No email',
            photo: foundUser.profile_image || foundUser.user_image || foundUser.avatar || foundUser.logo || foundUser.company_logo || foundUser.business_logo || null,
            company_name: foundUser.company_name || foundUser.company || '',
            phone: foundUser.phone || foundUser.phone_num || foundUser.contact || foundUser.company_phone || ''
          });
          setError(null);
        } else {
          setError('User profile not found');
        }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Remove fallback to groupData - we want real user data only

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow px-3 sm:px-6 py-3 mb-8 rounded-xl min-h-[60px]">
      <div className="font-bold text-lg sm:text-xl text-gray-800 dark:text-gray-100 truncate">Dashboard Overview</div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none flex items-center justify-center"
          title="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>
        {/* Notification Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none relative flex items-center justify-center"
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 md:w-80 lg:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20">
              {/* Header */}
              <div className="px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="font-bold text-lg text-gray-900 dark:text-gray-100">Notification</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</div>
              </div>
              {/* Notification List */}
              <div className="max-h-64 sm:max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.filter(n => !n.read).length > 0 ? (
                  notifications.filter(n => !n.read).map((event) => (
                    <div key={event.id} className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4 group bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <FiCalendar className="text-blue-500 dark:text-blue-300 text-sm sm:text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                          {event.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <FiClock />
                          {formatEventTime(event.date)}
                        </div>
                      </div>
                      <button
                        onClick={() => markAsRead(event.id)}
                        className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800 transition flex-shrink-0"
                      >
                        Mark as read
        </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4 md:px-6 text-center">
                    <FiCheckCircle className="text-4xl text-green-400 mb-2" />
                    <div className="text-gray-500 dark:text-gray-400 font-medium">You're all caught up!</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">No new notifications.</div>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                <Link
                                     to="/user/all-events"
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-block px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow transition text-sm"
                >
                  View All Events
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="h-6 sm:h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
        <div 
          className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => fetchUserProfile(true)}
          title="Click to refresh profile"
        >
                     <div className="flex-shrink-0 flex items-center justify-center">
             {profile.photo ? (
               <img 
                 src={`${import.meta.env.VITE_API_BASE_URL}/${profile.photo}`}
                 alt="Profile Photo" 
                 className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-gray-300 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow"
                 onError={(e) => {
                   e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                 }}
               />
             ) : null}
             <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border border-gray-300 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow ${profile.photo ? 'hidden' : ''}`}>
               <FiUser className="text-blue-500 dark:text-blue-300" size={16} />
             </div>
           </div>
          <div className="hidden sm:block text-right min-w-0">
            {loading ? (
              <div className="text-xs text-gray-400 dark:text-gray-500">Loading...</div>
            ) : refreshing ? (
              <div className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <FiRefreshCw className="animate-spin" size={12} />
                Refreshing...
              </div>
            ) : error ? (
              <div className="text-xs text-red-500">{error}</div>
            ) : (
              <>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {profile.name}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-400 truncate group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                  {profile.email}
                </div>
                {profile.company_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                    {profile.company_name}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 