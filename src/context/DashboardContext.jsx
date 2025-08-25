import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { getAuthHeaders } from '../utils/apiHeaders';
import { toast } from 'react-toastify';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// Cache duration in milliseconds (5 minutes for faster refresh)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache utility functions
const isDataFresh = (timestamp) => {
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
};

const createCacheEntry = (data) => ({
  data,
  timestamp: Date.now()
});

export const DashboardProvider = ({ children }) => {
  // Cache states
  const [cache, setCache] = useState({
    members: { active: null, inactive: null, expired: null },
    events: { all: null, past: null, future: null },
    contacts: null,
    analytics: null,
    enquiries: { received: null, done: null },
    groupData: null
  });

  // Loading states
  const [loading, setLoading] = useState({
    members: false,
    events: false,
    contacts: false,
    analytics: false,
    groupData: false,
    enquiries: false,
    initial: false // Start with false for instant display
  });

  // Fast loading state for immediate feedback
  const [fastLoading, setFastLoading] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    members: null,
    events: null,
    contacts: null,
    analytics: null,
    groupData: null,
    enquiries: null
  });

  // Data states (computed from cache)
  const [data, setData] = useState({
    members: { active: [], inactive: [], expired: [] },
    events: { all: [], past: [], future: [] },
    contacts: [],
    analytics: [],
    enquiries: { received: [], done: [] },
    groupData: {
      name: '',
      email: '',
      logo: '',
      signature: '',
      address: '',
      contact: '',
      website: ''
    },
    stats: {
      activeCount: 0,
      inactiveCount: 0,
      expiredCount: 0,
      enquiryReceivedCount: 0,
      enquiryDoneCount: 0,
      totalEventsCount: 0,
      pastEventsCount: 0,
      upcomingEventsCount: 0
    }
  });

  // Generic error handler
  const handleError = useCallback((error, type) => {
    console.error(`Dashboard ${type} error:`, error);
    
    let errorMessage = `Failed to load ${type}`;
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = `${type} request timed out. Please check your connection.`;
    } else if (error.response?.status === 401) {
      errorMessage = `Authentication failed. Please login again.`;
    } else if (error.response?.status === 403) {
      errorMessage = `Access denied for ${type}.`;
    } else if (error.response?.status >= 500) {
      errorMessage = `Server error while loading ${type}. Please try again later.`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setErrors(prev => ({ ...prev, [type]: errorMessage }));
    
    // Don't show toast for initial loads to avoid spam
    if (!loading.initial) {
      toast.error(errorMessage);
    }
  }, [loading.initial]);

  // Fetch members data (active, inactive, expired) - Optimized for speed
  const fetchMembers = useCallback(async (force = false) => {
    const membersCache = cache.members;
    
    // Check if we have fresh cached data
    if (!force && 
        isDataFresh(membersCache.active?.timestamp) && 
        isDataFresh(membersCache.inactive?.timestamp) && 
        isDataFresh(membersCache.expired?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, members: true }));
    setErrors(prev => ({ ...prev, members: false }));

    try {
      const uid = localStorage.getItem('uid') || '1';
      const headers = { ...getAuthHeaders() };

      // Use Promise.allSettled for better error handling and speed
      const results = await Promise.allSettled([
        api.post('/userDetail/active_members', { uid }, { headers }),
        api.post('/userDetail/not_members', { uid }, { headers }),
        api.post('/userDetail/membership_expired', { uid }, { headers })
      ]);

      const activeMembers = results[0].status === 'fulfilled' ? 
        (Array.isArray(results[0].value.data) ? results[0].value.data : results[0].value.data?.data || []) : [];
      const inactiveMembers = results[1].status === 'fulfilled' ? 
        (Array.isArray(results[1].value.data) ? results[1].value.data : results[1].value.data?.data || []) : [];
      const expiredMembers = results[2].status === 'fulfilled' ? 
        (Array.isArray(results[2].value.data) ? results[2].value.data : results[2].value.data?.data || []) : [];

      // Update cache immediately
      setCache(prev => ({
        ...prev,
        members: {
          active: createCacheEntry(activeMembers),
          inactive: createCacheEntry(inactiveMembers),
          expired: createCacheEntry(expiredMembers)
        }
      }));

      // Update data state
      setData(prev => ({
        ...prev,
        members: {
          active: activeMembers,
          inactive: inactiveMembers,
          expired: expiredMembers
        },
        stats: {
          ...prev.stats,
          activeCount: activeMembers.length,
          inactiveCount: inactiveMembers.length,
          expiredCount: expiredMembers.length
        }
      }));

    } catch (error) {
      handleError(error, 'members');
    } finally {
      setLoading(prev => ({ ...prev, members: false }));
    }
  }, [cache.members, handleError]);

  // Fetch enquiries data (received and done)
  const fetchEnquiries = useCallback(async (force = false) => {
    const enquiriesCache = cache.enquiries;
    
    // Check if we have fresh cached data
    if (!force && 
        isDataFresh(enquiriesCache.received?.timestamp) && 
        isDataFresh(enquiriesCache.done?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, enquiries: true }));
    setErrors(prev => ({ ...prev, enquiries: null }));

    try {
      const headers = { ...getAuthHeaders() };
      console.log('Fetching enquiries with headers:', headers);

      const [receivedRes, doneRes] = await Promise.all([
        api.post('/product/view_enquiry', {}, { headers }),
        api.post('/product/enquiry_index', {}, { headers })
      ]);

      console.log('Enquiry responses:', { receivedRes, doneRes });

      // Helper function to extract enquiries from various response formats
      const extractEnquiries = (response) => {
        if (response.data?.data?.view_enquiry) return response.data.data.view_enquiry;
        if (response.data?.data?.enquiry) return response.data.data.enquiry;
        if (Array.isArray(response.data?.data)) return response.data.data;
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.data && typeof response.data.data === 'object') return Object.values(response.data.data);
        return [];
      };

      const receivedEnquiries = extractEnquiries(receivedRes);
      const doneEnquiries = extractEnquiries(doneRes);

      console.log('Extracted enquiries:', { receivedEnquiries, doneEnquiries });

      // Update cache
      setCache(prev => ({
        ...prev,
        enquiries: {
          received: createCacheEntry(receivedEnquiries),
          done: createCacheEntry(doneEnquiries)
        }
      }));

      // Update data state
      setData(prev => ({
        ...prev,
        enquiries: {
          received: receivedEnquiries,
          done: doneEnquiries
        },
        stats: {
          ...prev.stats,
          enquiryReceivedCount: receivedEnquiries.length,
          enquiryDoneCount: doneEnquiries.length
        }
      }));

    } catch (error) {
      console.error('Error fetching enquiries:', error);
      // Set default values to prevent loading from being stuck
      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          enquiryReceivedCount: 0,
          enquiryDoneCount: 0
        }
      }));
      handleError(error, 'enquiries');
    } finally {
      setLoading(prev => ({ ...prev, enquiries: false }));
    }
  }, [cache.enquiries, handleError]);

  // Fetch events data (all, past, future)
  const fetchEvents = useCallback(async (force = false) => {
    const eventsCache = cache.events;
    
    // Check if we have fresh cached data
    if (!force && 
        isDataFresh(eventsCache.all?.timestamp) && 
        isDataFresh(eventsCache.past?.timestamp) && 
        isDataFresh(eventsCache.future?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, events: true }));
    setErrors(prev => ({ ...prev, events: null }));

    try {
      const headers = { ...getAuthHeaders() };

      const [allRes, pastRes, futureRes] = await Promise.all([
        api.post('/event/index', {}, { headers }),
        api.post('/event/past', {}, { headers }),
        api.post('/event/future', {}, { headers })
      ]);

      // Helper function to extract events from various response formats
      const extractEvents = (response) => {
        if (Array.isArray(response.data?.data?.event)) return response.data.data.event;
        if (Array.isArray(response.data?.data?.events)) return response.data.data.events;
        if (Array.isArray(response.data?.data)) return response.data.data;
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.data && typeof response.data.data === 'object') return Object.values(response.data.data);
        return [];
      };

      const allEvents = extractEvents(allRes);
      const pastEvents = extractEvents(pastRes);
      const futureEvents = extractEvents(futureRes);

      // Update cache
      setCache(prev => ({
        ...prev,
        events: {
          all: createCacheEntry(allEvents),
          past: createCacheEntry(pastEvents),
          future: createCacheEntry(futureEvents)
        }
      }));

      // Update data state
      setData(prev => ({
        ...prev,
        events: {
          all: allEvents,
          past: pastEvents,
          future: futureEvents
        },
        stats: {
          ...prev.stats,
          totalEventsCount: allEvents.length,
          pastEventsCount: pastEvents.length,
          upcomingEventsCount: futureEvents.length
        }
      }));

    } catch (error) {
      handleError(error, 'events');
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [cache.events, handleError]);

  // Fetch contacts data
  const fetchContacts = useCallback(async (force = false) => {
    // Check if we have fresh cached data
    if (!force && isDataFresh(cache.contacts?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, contacts: true }));
    setErrors(prev => ({ ...prev, contacts: null }));

    try {
      const headers = { ...getAuthHeaders() };
      const response = await api.get('/contact', { headers });
      
      let contacts = [];
      if (response.data?.data?.contact && Array.isArray(response.data.data.contact)) {
        contacts = response.data.data.contact;
      } else if (Array.isArray(response.data?.data)) {
        contacts = response.data.data;
      } else if (Array.isArray(response.data)) {
        contacts = response.data;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        contacts = Object.values(response.data.data);
      } else if (response.data?.contacts && Array.isArray(response.data.contacts)) {
        contacts = response.data.contacts;
      } else if (response.data?.contact && Array.isArray(response.data.contact)) {
        contacts = response.data.contact;
      }

      // Map contacts to consistent format
      const mappedContacts = contacts.map((contact, index) => ({
        id: contact.id || contact.contact_id || contact.contactId || index + 1,
        dept: contact.department || contact.dept || contact.role || contact.contact_department || 'General',
        name: contact.name || contact.person_name || contact.contact_name || contact.contactName || `Contact ${index + 1}`,
        contact: contact.contact || contact.phone || contact.phone_number || contact.mobile || contact.contact_number || contact.contact_no || '',
        email: contact.email || contact.email_address || contact.contact_email || contact.email_id || '',
        address: contact.address || contact.location || contact.contact_address || contact.address_line || '',
      }));

      // Update cache
      setCache(prev => ({
        ...prev,
        contacts: createCacheEntry(mappedContacts)
      }));

      // Update data state
      setData(prev => ({
        ...prev,
        contacts: mappedContacts
      }));

    } catch (error) {
      handleError(error, 'contacts');
    } finally {
      setLoading(prev => ({ ...prev, contacts: false }));
    }
  }, [cache.contacts, handleError]);

  // Fetch group data
  const fetchGroupData = useCallback(async (force = false) => {
    // Check if we have fresh cached data
    if (!force && isDataFresh(cache.groupData?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, groupData: true }));
    setErrors(prev => ({ ...prev, groupData: null }));

    try {
      const headers = { ...getAuthHeaders() };
      const response = await api.post('/groupSettings', {}, { headers });

      const backendData = response.data?.data || response.data || {};
      
      // Get API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.etribes.ezcrm.site';
      
      // Process logo and signature URLs with correct API base URL
      const processedData = {
        name: backendData.name || '',
        email: backendData.email || '',
        logo: backendData.logo ? (backendData.logo.startsWith('http') ? backendData.logo : `${API_BASE_URL}/${backendData.logo}`) : '',
        signature: backendData.signature ? (backendData.signature.startsWith('http') ? backendData.signature : `${API_BASE_URL}/${backendData.signature}`) : '',
        address: backendData.address || '',
        contact: backendData.contact || '',
        website: backendData.website || ''
      };

      // Update cache
      setCache(prev => ({
        ...prev,
        groupData: createCacheEntry(processedData)
      }));

      // Update data state
      setData(prev => ({
        ...prev,
        groupData: processedData
      }));

    } catch (error) {
      handleError(error, 'groupData');
    } finally {
      setLoading(prev => ({ ...prev, groupData: false }));
    }
  }, [cache.groupData, handleError]);

  // Generate analytics data from both members and enquiries cache
  const generateAnalytics = useCallback(() => {
    const membersData = data.members;
    const enquiriesData = data.enquiries;
    
    // Check if we have any data to work with
    const hasMembersData = membersData.active.length || membersData.inactive.length || membersData.expired.length;
    const hasReceivedEnquiries = enquiriesData.received && Array.isArray(enquiriesData.received) && enquiriesData.received.length > 0;
    const hasDoneEnquiries = enquiriesData.done && Array.isArray(enquiriesData.done) && enquiriesData.done.length > 0;
    
    if (!hasMembersData && !hasReceivedEnquiries && !hasDoneEnquiries) {
      return;
    }

    try {
      // Group by month using month index for accurate mapping
      const groupByMonth = (data, dateField = 'lct') => {
        if (!data || !Array.isArray(data)) {
          return {};
        }
        
        const monthMap = {};
        data.forEach(item => {
          if (item && item[dateField]) {
            const date = new Date(item[dateField]);
            if (!isNaN(date.getTime())) {
              const monthIdx = date.getMonth();
              if (!monthMap[monthIdx]) monthMap[monthIdx] = 0;
              monthMap[monthIdx]++;
            }
          }
        });
        return monthMap;
      };

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Process members data
      const activeByMonth = groupByMonth(membersData.active, 'lct');
      const inactiveByMonth = groupByMonth(membersData.inactive, 'lct');
      const expiredByMonth = groupByMonth(membersData.expired, 'lct');
      
      // Process enquiries data
      const receivedByMonth = groupByMonth(enquiriesData.received || [], 'dtime');
      const doneByMonth = groupByMonth(enquiriesData.done || [], 'dtime');

      // Create comprehensive chart data with all metrics
      const analyticsData = [
        { 
          month: '0', 
          'Members Activated': 0, 
          'Pending Approval': 0, 
          'Membership Expired': 0,
          'Enquiry Received': 0, 
          'Enquiry Done': 0
        },
        ...months.map((month, idx) => ({
          month,
          'Members Activated': activeByMonth[idx] || 0,
          'Pending Approval': inactiveByMonth[idx] || 0,
          'Membership Expired': expiredByMonth[idx] || 0,
          'Enquiry Received': receivedByMonth[idx] || 0,
          'Enquiry Done': doneByMonth[idx] || 0,
        }))
      ];

      console.log('Generated comprehensive analytics data:', analyticsData);

      // Update cache and data
      setCache(prev => ({
        ...prev,
        analytics: createCacheEntry(analyticsData)
      }));

      setData(prev => ({
        ...prev,
        analytics: analyticsData
      }));

    } catch (error) {
      console.error('Analytics generation error:', error);
    }
  }, [data.members, data.enquiries]);

  // Update analytics when enquiries or members data changes
  useEffect(() => {
    const hasReceivedEnquiries = data.enquiries.received && Array.isArray(data.enquiries.received) && data.enquiries.received.length > 0;
    const hasDoneEnquiries = data.enquiries.done && Array.isArray(data.enquiries.done) && data.enquiries.done.length > 0;
    const hasMembersData = data.members.active.length || data.members.inactive.length || data.members.expired.length;
    
    if (hasReceivedEnquiries || hasDoneEnquiries || hasMembersData) {
      generateAnalytics();
    }
  }, [data.enquiries, data.members, generateAnalytics]);

  // Debug loading states
  useEffect(() => {
    console.log('Loading states changed:', loading);
  }, [loading]);

  // Clear cache function
  const clearCache = useCallback(() => {
    setCache({
      members: { active: null, inactive: null, expired: null },
      events: { all: null, past: null, future: null },
      contacts: null,
      analytics: null,
      enquiries: { received: null, done: null },
      groupData: null
    });
  }, []);

  // Clear all data and cache - useful for logout
  const clearAllData = useCallback(() => {
    setCache({
      members: { active: null, inactive: null, expired: null },
      events: { active: null, inactive: null, expired: null },
      contacts: null,
      analytics: null,
      enquiries: { received: null, done: null },
      groupData: null
    });
    
    setData({
      members: { active: [], inactive: [], expired: [] },
      events: { all: [], past: [], future: [] },
      contacts: [],
      analytics: [],
      enquiries: { received: [], done: [] },
      groupData: {
        name: '',
        email: '',
        logo: '',
        signature: '',
        address: '',
        contact: '',
        website: ''
      },
      stats: {
        activeCount: 0,
        inactiveCount: 0,
        expiredCount: 0,
        enquiryReceivedCount: 0,
        enquiryDoneCount: 0,
        totalEventsCount: 0,
        pastEventsCount: 0,
        upcomingEventsCount: 0
      }
    });
    
    setLoading({
      members: false,
      events: false,
      contacts: false,
      analytics: false,
      groupData: false,
      enquiries: false,
      initial: false
    });
    
    setErrors({
      members: null,
      events: null,
      contacts: null,
      analytics: null,
      groupData: null,
      enquiries: null
    });
  }, []);

  // Listen for logout events to clear data
  useEffect(() => {
    const handleLogout = () => {
      clearAllData();
    };
    
    const handleLogin = () => {
      // Refetch data when user logs in - optimized for speed
      console.log('Login event received, loading data instantly...');
      setFastLoading(true); // Show fast loader immediately
      
      // Load all data simultaneously for fastest loading
      Promise.allSettled([
        fetchMembers(),
        fetchEnquiries(),
        fetchGroupData(),
        fetchEvents(),
        fetchContacts()
      ]).then(() => {
        setFastLoading(false);
        setLoading(prev => ({ ...prev, initial: false }));
        console.log('Login data loaded successfully');
      });
    };
    
    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, [clearAllData, fetchMembers, fetchEnquiries, fetchGroupData, fetchEvents, fetchContacts]);

  // Check if data needs to be loaded when component mounts or token changes
  useEffect(() => {
    const checkAndLoadData = () => {
      const token = localStorage.getItem('token');
      const hasData = data.members.active.length > 0 || data.members.inactive.length > 0 || data.members.expired.length > 0;
      
      if (token && !hasData && !loading.initial) {
        console.log('Token exists but no data, loading data instantly...');
        setLoading(prev => ({ ...prev, initial: true }));
        
        // Load all data simultaneously for fastest loading
        Promise.allSettled([
          fetchMembers(),
          fetchEnquiries(),
          fetchGroupData(),
          fetchEvents(),
          fetchContacts()
        ]).then(() => {
          setLoading(prev => ({ ...prev, initial: false }));
          console.log('Auto-load data completed');
        });
      }
    };

    // Check immediately
    checkAndLoadData();
    
    // Also check when token changes
    const handleStorageChange = () => {
      checkAndLoadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [data.members.active.length, data.members.inactive.length, data.members.expired.length, loading.initial, fetchMembers, fetchEnquiries, fetchGroupData, fetchEvents, fetchContacts]);

  // Initial data load - Optimized for instant display
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(prev => ({ ...prev, initial: true }));
      console.log('Starting instant data load...');
      
      try {
        // Load all data simultaneously for fastest possible loading
        const loadPromises = [
          fetchMembers(),
          fetchEnquiries(),
          fetchGroupData(),
          fetchEvents(),
          fetchContacts()
        ];
        
        // Wait for all data to load
        await Promise.allSettled(loadPromises);
        
        // Set loading to false immediately after all data is loaded
        setLoading(prev => ({ ...prev, initial: false }));
        console.log('All data loaded successfully');
        
      } catch (error) {
        console.error('Error in initial data load:', error);
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    // Check if we have a token and need to load data
    const token = localStorage.getItem('token');
    if (token) {
      loadInitialData();
    } else {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  }, []); // Run only once on mount

  // Refresh functions
  const refreshMembers = useCallback(() => fetchMembers(true), [fetchMembers]);
  const refreshEvents = useCallback(() => fetchEvents(true), [fetchEvents]);
  const refreshContacts = useCallback(() => fetchContacts(true), [fetchContacts]);
  const refreshEnquiries = useCallback(() => fetchEnquiries(true), [fetchEnquiries]);
  const refreshGroupData = useCallback(() => fetchGroupData(true), [fetchGroupData]);
  
  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshMembers(),
      refreshEvents(),
      refreshContacts(),
      refreshEnquiries(),
      refreshGroupData()
    ]);
    toast.success('Dashboard data refreshed!');
  }, [refreshMembers, refreshEvents, refreshContacts, refreshEnquiries, refreshGroupData]);

  // Context value
  const value = {
    // Data
    data,
    loading,
    errors,
    fastLoading,
    
    // Cache status
    isCacheValid: {
      members: isDataFresh(cache.members.active?.timestamp) && 
               isDataFresh(cache.members.inactive?.timestamp) && 
               isDataFresh(cache.members.expired?.timestamp),
      events: isDataFresh(cache.events.all?.timestamp) && 
              isDataFresh(cache.events.past?.timestamp) && 
              isDataFresh(cache.events.future?.timestamp),
      contacts: isDataFresh(cache.contacts?.timestamp),
      analytics: isDataFresh(cache.analytics?.timestamp),
      enquiries: isDataFresh(cache.enquiries.received?.timestamp) && 
                 isDataFresh(cache.enquiries.done?.timestamp),
      groupData: isDataFresh(cache.groupData?.timestamp)
    },
    
    // Refresh functions
    refreshMembers,
    refreshEvents,
    refreshContacts,
    refreshEnquiries,
    refreshGroupData,
    refreshAll,
    clearCache,
    clearAllData,
    
    // Quick access to stats
    stats: data.stats
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};