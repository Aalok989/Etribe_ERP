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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_STORAGE_KEY = 'etribe_dashboard_cache';

const isDataFresh = (timestamp, forceRefresh = false) => {
  if (forceRefresh) return false;
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
};

const createCacheEntry = (data) => {
  const entry = {
    data,
    timestamp: Date.now(),
    version: 1
  };
  
  try {
    const cacheData = {
      timestamp: entry.timestamp,
      version: entry.version,
      dataSize: Array.isArray(data) ? data.length : 0
    };
    sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache storage failed:', e);
  }
  
  return entry;
};

const getCacheMetadata = () => {
  try {
    const stored = sessionStorage.getItem(CACHE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const hasCachedData = (cacheEntry) => {
  return cacheEntry && 
         cacheEntry.data && 
         (Array.isArray(cacheEntry.data) ? cacheEntry.data.length > 0 : true) &&
         cacheEntry.timestamp;
};

export const DashboardProvider = ({ children }) => {
  const [cache, setCache] = useState({
    members: { active: null, inactive: null, expired: null },
    events: { all: null, past: null, future: null },
    contacts: null,
    analytics: null,
    enquiries: { received: null, done: null },
    groupData: null
  });

  const [loading, setLoading] = useState({
    members: false,
    events: false,
    contacts: false,
    analytics: false,
    groupData: false,
    enquiries: false,
    initial: false
  });

  const [fastLoading, setFastLoading] = useState(false);

  const [errors, setErrors] = useState({
    members: null,
    events: null,
    contacts: null,
    analytics: null,
    groupData: null,
    enquiries: null
  });

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

  const handleError = useCallback((error, type) => {
    let errorMessage = `Failed to load ${type}`;
    
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
    
    if (!loading.initial) {
      toast.error(errorMessage);
    }
  }, [loading.initial]);

  const fetchMembers = useCallback(async (force = false) => {
    const membersCache = cache.members;
    
    if (!force && 
        hasCachedData(membersCache.active) && 
        hasCachedData(membersCache.inactive) && 
        hasCachedData(membersCache.expired) &&
        isDataFresh(membersCache.active?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, members: true }));
    setErrors(prev => ({ ...prev, members: false }));

    try {
      const uid = localStorage.getItem('uid') || '1';
      const headers = { ...getAuthHeaders() };

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

  const fetchEnquiries = useCallback(async (force = false) => {
    const enquiriesCache = cache.enquiries;
    
    if (!force && 
        hasCachedData(enquiriesCache.received) && 
        hasCachedData(enquiriesCache.done) &&
        isDataFresh(enquiriesCache.received?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, enquiries: true }));
    setErrors(prev => ({ ...prev, enquiries: null }));

    try {
      const headers = { ...getAuthHeaders() };
      const [receivedRes, doneRes] = await Promise.all([
        api.post('/product/view_enquiry', {}, { headers }),
        api.post('/product/enquiry_index', {}, { headers })
      ]);

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

  const fetchEvents = useCallback(async (force = false) => {
    const eventsCache = cache.events;
    
    if (!force && 
        hasCachedData(eventsCache.all) && 
        hasCachedData(eventsCache.past) && 
        hasCachedData(eventsCache.future) &&
        isDataFresh(eventsCache.all?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, events: true }));
    setErrors(prev => ({ ...prev, events: null }));

    try {
      const headers = { ...getAuthHeaders() };

      const results = await Promise.allSettled([
        api.post('/event/index', {}, { headers }),
        api.post('/event/past', {}, { headers }),
        api.post('/event/future', {}, { headers })
      ]);

      const extractEvents = (response) => {
        if (Array.isArray(response.data?.data?.event)) return response.data.data.event;
        if (Array.isArray(response.data?.data?.events)) return response.data.data.events;
        if (Array.isArray(response.data?.data)) return response.data.data;
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.data && typeof response.data.data === 'object') return Object.values(response.data.data);
        return [];
      };

      const safeEvents = (result) => {
        if (result.status === 'fulfilled') {
          return extractEvents(result.value);
        }
        return [];
      };

      const allEvents = safeEvents(results[0]);
      const pastEvents = safeEvents(results[1]);
      const futureEvents = safeEvents(results[2]);

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

  const fetchContacts = useCallback(async (force = false) => {
    if (!force && hasCachedData(cache.contacts) && isDataFresh(cache.contacts?.timestamp)) {
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

  const fetchGroupData = useCallback(async (force = false) => {
    if (!force && hasCachedData(cache.groupData) && isDataFresh(cache.groupData?.timestamp)) {
      return;
    }

    setLoading(prev => ({ ...prev, groupData: true }));
    setErrors(prev => ({ ...prev, groupData: null }));

    try {
      const headers = { ...getAuthHeaders() };
      const response = await api.post('/groupSettings', {}, { headers });

      const backendData = response.data?.data || response.data || {};
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
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

  const generateAnalytics = useCallback(() => {
    const membersData = data.members;
    const enquiriesData = data.enquiries;
    
    const hasMembersData = membersData.active.length || membersData.inactive.length || membersData.expired.length;
    const hasReceivedEnquiries = enquiriesData.received && Array.isArray(enquiriesData.received) && enquiriesData.received.length > 0;
    const hasDoneEnquiries = enquiriesData.done && Array.isArray(enquiriesData.done) && enquiriesData.done.length > 0;
    
    if (!hasMembersData && !hasReceivedEnquiries && !hasDoneEnquiries) {
      return;
    }

    try {
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
      
      const activeByMonth = groupByMonth(membersData.active, 'lct');
      const inactiveByMonth = groupByMonth(membersData.inactive, 'lct');
      const expiredByMonth = groupByMonth(membersData.expired, 'lct');
      
      const receivedByMonth = groupByMonth(enquiriesData.received || [], 'dtime');
      const doneByMonth = groupByMonth(enquiriesData.done || [], 'dtime');

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

      setCache(prev => ({
        ...prev,
        analytics: createCacheEntry(analyticsData)
      }));

      setData(prev => ({
        ...prev,
        analytics: analyticsData
      }));

    } catch (error) {
      handleError(error, 'analytics');
    }
  }, [data.members, data.enquiries, handleError]);

  useEffect(() => {
    const hasReceivedEnquiries = data.enquiries.received && Array.isArray(data.enquiries.received) && data.enquiries.received.length > 0;
    const hasDoneEnquiries = data.enquiries.done && Array.isArray(data.enquiries.done) && data.enquiries.done.length > 0;
    const hasMembersData = data.members.active.length || data.members.inactive.length || data.members.expired.length;
    
    if (hasReceivedEnquiries || hasDoneEnquiries || hasMembersData) {
      generateAnalytics();
    }
  }, [data.enquiries, data.members, generateAnalytics]);

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

  useEffect(() => {
    const handleLogout = () => {
      clearAllData();
    };
    
    const handleLogin = () => {
      setFastLoading(true);
      
      Promise.allSettled([
        fetchMembers(),
        fetchEnquiries(),
        fetchGroupData(),
        fetchEvents(),
        fetchContacts()
      ]).then(() => {
        setFastLoading(false);
        setLoading(prev => ({ ...prev, initial: false }));
      });
    };
    
    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, [clearAllData, fetchMembers, fetchEnquiries, fetchGroupData, fetchEvents, fetchContacts]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && !loading.initial) {
      const hasAnyData = hasCachedData(cache.members.active) || 
                        hasCachedData(cache.events.all) || 
                        hasCachedData(cache.contacts) ||
                        hasCachedData(cache.groupData);
      
      if (!hasAnyData) {
        setLoading(prev => ({ ...prev, initial: true }));
        
        Promise.allSettled([
          fetchMembers(),
          fetchEnquiries(),
          fetchGroupData(),
          fetchEvents(),
          fetchContacts()
        ]).then(() => {
          setLoading(prev => ({ ...prev, initial: false }));
        });
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const cacheMetadata = getCacheMetadata();
      const hasValidCache = cacheMetadata && 
                           cacheMetadata.timestamp && 
                           (Date.now() - cacheMetadata.timestamp) < CACHE_DURATION;
      
      if (!hasValidCache) {
        setLoading(prev => ({ ...prev, initial: true }));
        
        Promise.allSettled([
          fetchMembers(),
          fetchEnquiries(),
          fetchGroupData(),
          fetchEvents(),
          fetchContacts()
        ]).then(() => {
          setLoading(prev => ({ ...prev, initial: false }));
        }).catch(() => {
          setLoading(prev => ({ ...prev, initial: false }));
        });
      } else {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    } else {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  }, []);

  const refreshMembers = useCallback(() => fetchMembers(true), [fetchMembers]);
  const refreshEvents = useCallback(() => fetchEvents(true), [fetchEvents]);
  const refreshContacts = useCallback(() => fetchContacts(true), [fetchContacts]);
  const refreshEnquiries = useCallback(() => fetchEnquiries(true), [fetchEnquiries]);
  const refreshGroupData = useCallback(() => fetchGroupData(true), [fetchGroupData]);
  
  const refreshAll = useCallback(async () => {
    setLoading(prev => ({ ...prev, initial: true }));
    
    try {
      await Promise.allSettled([
        fetchMembers(true),
        fetchEvents(true),
        fetchContacts(true),
        fetchEnquiries(true),
        fetchGroupData(true)
      ]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Refresh failed');
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  }, [fetchMembers, fetchEvents, fetchContacts, fetchEnquiries, fetchGroupData]);

  const invalidateCache = useCallback((cacheKeys = []) => {
    if (cacheKeys.length === 0) {
      setCache({
        members: { active: null, inactive: null, expired: null },
        events: { all: null, past: null, future: null },
        contacts: null,
        analytics: null,
        enquiries: { received: null, done: null },
        groupData: null
      });
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } else {
      setCache(prev => {
        const newCache = { ...prev };
        cacheKeys.forEach(key => {
          if (newCache[key]) {
            newCache[key] = Array.isArray(newCache[key]) ? [] : null;
          }
        });
        return newCache;
      });
    }
  }, []);

  const refreshAfterOperation = useCallback(async (operationType = 'general') => {
    switch (operationType) {
      case 'member':
        await fetchMembers(true);
        break;
      case 'event':
        await fetchEvents(true);
        break;
      case 'contact':
        await fetchContacts(true);
        break;
      case 'enquiry':
        await fetchEnquiries(true);
        break;
      default:
        await refreshAll();
    }
  }, [fetchMembers, fetchEvents, fetchContacts, fetchEnquiries, refreshAll]);

  const value = {
    data,
    loading,
    errors,
    fastLoading,
    
    isCacheValid: {
      members: hasCachedData(cache.members.active) && isDataFresh(cache.members.active?.timestamp),
      events: hasCachedData(cache.events.all) && isDataFresh(cache.events.all?.timestamp),
      contacts: hasCachedData(cache.contacts) && isDataFresh(cache.contacts?.timestamp),
      analytics: hasCachedData(cache.analytics) && isDataFresh(cache.analytics?.timestamp),
      enquiries: hasCachedData(cache.enquiries.received) && isDataFresh(cache.enquiries.received?.timestamp),
      groupData: hasCachedData(cache.groupData) && isDataFresh(cache.groupData?.timestamp)
    },
    
    refreshMembers,
    refreshEvents,
    refreshContacts,
    refreshEnquiries,
    refreshGroupData,
    refreshAll,
    refreshAfterOperation,
    invalidateCache,
    clearCache,
    clearAllData,
    stats: data.stats,
    cacheMetadata: getCacheMetadata()
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};