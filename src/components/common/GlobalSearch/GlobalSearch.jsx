import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiUsers, FiCalendar, FiFileText, FiMessageSquare, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosConfig";
import { getAuthHeaders } from "../../../utils/apiHeaders";

/**
 * GlobalSearch Component
 * A reusable search component that searches across members, events, circulars, and feedbacks
 * @param {string} userType - "admin" or "user" to determine navigation paths
 */
export default function GlobalSearch({ userType = "admin" }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Global Search Function
  const performGlobalSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Searching for:', query);
    
    try {
      const headers = getAuthHeaders();
      const searchTerm = query.toLowerCase().trim();
      const results = [];
      const seenIds = new Set(); // Prevent duplicates

      // Search Members
      try {
        let allMembers = [];
        
        if (userType === "admin") {
          // Admin can search all members (active, inactive, expired)
          const [activeRes, inactiveRes, expiredRes] = await Promise.all([
            api.post('/userDetail/active_members', {}, { headers }),
            api.post('/userDetail/not_members', { uid: localStorage.getItem('uid') }, { headers }),
            api.post('/userDetail/membership_expired', { uid: localStorage.getItem('uid') }, { headers })
          ]);

          const activeMembers = Array.isArray(activeRes.data) ? activeRes.data : activeRes.data?.data || [];
          const inactiveMembers = Array.isArray(inactiveRes.data) ? inactiveRes.data : inactiveRes.data?.data || [];
          const expiredMembers = Array.isArray(expiredRes.data) ? expiredRes.data : expiredRes.data?.data || [];
          
          allMembers = [...activeMembers, ...inactiveMembers, ...expiredMembers];
        } else {
          // User can only search active members
          const activeRes = await api.post('/userDetail/active_members', {}, { headers });
          allMembers = Array.isArray(activeRes.data) ? activeRes.data : activeRes.data?.data || [];
        }

        console.log('📊 Total members to search:', allMembers.length);
        
        allMembers.forEach(member => {
          const memberId = member.id || member.company_detail_id || member.user_detail_id;
          
          if (seenIds.has(`member-${memberId}`)) return;
          
          const name = (member.name || member.company_name || '').toLowerCase();
          const email = (member.email || '').toLowerCase();
          const phone = (member.phone || member.mobile || '').toLowerCase();
          const company = (member.company_name || member.name || '').toLowerCase();
          
          if (name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || company.includes(searchTerm)) {
            seenIds.add(`member-${memberId}`);
            results.push({
              id: memberId,
              title: member.name || member.company_name || 'Unnamed Member',
              subtitle: member.email || member.phone || member.mobile || '',
              type: 'member',
              icon: FiUsers,
              path: `/${userType}/member-detail/${memberId}`
            });
            console.log('✅ Found member:', member.name || member.company_name);
          }
        });
      } catch (err) {
        console.error('❌ Error searching members:', err);
      }

      // Search Events
      try {
        const eventsRes = await api.post('/event/index', {}, { headers });
        const events = Array.isArray(eventsRes.data?.data?.event) ? eventsRes.data.data.event :
                      Array.isArray(eventsRes.data?.data?.events) ? eventsRes.data.data.events :
                      Array.isArray(eventsRes.data?.data) ? eventsRes.data.data :
                      Array.isArray(eventsRes.data) ? eventsRes.data : [];

        console.log('📅 Total events to search:', events.length);

        events.forEach(event => {
          const eventId = event.id;
          
          if (seenIds.has(`event-${eventId}`)) return;
          
          const title = (event.event_title || event.title || event.name || '').toLowerCase();
          const venue = (event.event_venue || event.venue || '').toLowerCase();
          const description = (event.event_description || event.description || '').toLowerCase();
          
          if (title.includes(searchTerm) || venue.includes(searchTerm) || description.includes(searchTerm)) {
            seenIds.add(`event-${eventId}`);
            results.push({
              id: eventId,
              title: event.event_title || event.title || event.name || 'Untitled Event',
              subtitle: `${event.event_venue || event.venue || ''} - ${event.event_date || event.date || ''}`,
              type: 'event',
              icon: FiCalendar,
              path: `/${userType}/all-events`
            });
            console.log('✅ Found event:', event.event_title || event.title);
          }
        });
      } catch (err) {
        console.error('❌ Error searching events:', err);
      }

      // Search Circulars
      try {
        const circularsRes = await api.post('/circular/index', {}, { headers });
        const circulars = Array.isArray(circularsRes.data?.data) ? circularsRes.data.data :
                         Array.isArray(circularsRes.data) ? circularsRes.data : [];

        console.log('📄 Total circulars to search:', circulars.length);

        circulars.forEach(circular => {
          const circularId = circular.id;
          
          if (seenIds.has(`circular-${circularId}`)) return;
          
          const title = (circular.title || circular.circular_title || '').toLowerCase();
          const description = (circular.description || circular.circular_description || '').toLowerCase();
          
          if (title.includes(searchTerm) || description.includes(searchTerm)) {
            seenIds.add(`circular-${circularId}`);
            results.push({
              id: circularId,
              title: circular.title || circular.circular_title || 'Untitled Circular',
              subtitle: circular.date || circular.created_at || '',
              type: 'circular',
              icon: FiFileText,
              path: `/${userType}/circulars`
            });
            console.log('✅ Found circular:', circular.title);
          }
        });
      } catch (err) {
        console.error('❌ Error searching circulars:', err);
      }

      // Search Feedbacks (Admin only)
      if (userType === "admin") {
        try {
          const feedbacksRes = await api.post('/feedback/index', {}, { headers });
          const feedbacks = Array.isArray(feedbacksRes.data?.data) ? feedbacksRes.data.data :
                           Array.isArray(feedbacksRes.data) ? feedbacksRes.data : [];

          console.log('💬 Total feedbacks to search:', feedbacks.length);

          feedbacks.forEach(feedback => {
            const feedbackId = feedback.id;
            
            if (seenIds.has(`feedback-${feedbackId}`)) return;
            
            const name = (feedback.name || feedback.user_name || '').toLowerCase();
            const message = (feedback.message || feedback.feedback || '').toLowerCase();
            const subject = (feedback.subject || '').toLowerCase();
            
            if (name.includes(searchTerm) || message.includes(searchTerm) || subject.includes(searchTerm)) {
              seenIds.add(`feedback-${feedbackId}`);
              results.push({
                id: feedbackId,
                title: feedback.subject || 'Feedback',
                subtitle: `From: ${feedback.name || feedback.user_name || 'Unknown'}`,
                type: 'feedback',
                icon: FiMessageSquare,
                path: `/${userType}/feedbacks`
              });
              console.log('✅ Found feedback:', feedback.subject);
            }
          });
        } catch (err) {
          console.error('❌ Error searching feedbacks:', err);
        }
      }

      console.log('🎯 Total results found:', results.length);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Global search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [userType]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performGlobalSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performGlobalSearch]);

  const handleSearchResultClick = (result) => {
    navigate(result.path);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          placeholder="Search anything..."
          className="w-48 sm:w-64 md:w-80 px-4 py-2 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
        />
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
        
        {/* Clear button or loading spinner */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          ) : searchQuery ? (
            <button
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              <FiX size={18} />
            </button>
          ) : null}
        </div>
      </div>
      
      {/* Search Results Dropdown */}
      {showSearchResults && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result) => {
                const IconComponent = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <IconComponent className="text-indigo-600 dark:text-indigo-400" size={16} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">
                        {result.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {isSearching ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FiSearch size={32} className="text-gray-300 dark:text-gray-600" />
                  <span>No results found</span>
                  <span className="text-xs">Try different keywords</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

