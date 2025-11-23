import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axiosConfig';
import { getAuthHeaders } from '../utils/apiHeaders';

const GroupDataContext = createContext();

export const useGroupData = () => {
  const context = useContext(GroupDataContext);
  if (!context) {
    throw new Error('useGroupData must be used within a GroupDataProvider');
  }
  return context;
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_STORAGE_KEY = 'etribe_groupdata_cache';

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
    sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('GroupData cache storage failed:', e);
  }
  
  return entry;
};

const getCacheFromStorage = () => {
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
         typeof cacheEntry.data === 'object' &&
         Object.keys(cacheEntry.data).length > 0 &&
         cacheEntry.timestamp;
};

const defaultGroupData = {
    name: '',
    email: '',
    logo: '',
    signature: '',
    address: '',
    contact: '',
    website: ''
};

export const GroupDataProvider = ({ children }) => {
  const [cache, setCache] = useState(() => {
    const storedCache = getCacheFromStorage();
    return storedCache && isDataFresh(storedCache.timestamp) ? storedCache : null;
  });
  
  const [groupData, setGroupData] = useState(() => {
    const storedCache = getCacheFromStorage();
    return storedCache && isDataFresh(storedCache.timestamp) ? storedCache.data : defaultGroupData;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchGroupData = useCallback(async (force = false) => {
    if (!force && hasCachedData(cache) && isDataFresh(cache?.timestamp)) {
      return;
    }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in');
      setLoading(false);
        return;
      }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/groupSettings', {}, {
        headers: getAuthHeaders()
      });

      const backendData = response.data?.data || response.data || {};
      
      const processedData = {
        name: backendData.name || '',
        email: backendData.email || '',
        logo: backendData.logo ? (backendData.logo.startsWith('http') ? backendData.logo : `${API_BASE_URL}/${backendData.logo}`) : '',
        signature: backendData.signature ? (backendData.signature.startsWith('http') ? backendData.signature : `${API_BASE_URL}/${backendData.signature}`) : '',
        address: backendData.address || '',
        contact: backendData.contact || '',
        website: backendData.website || ''
      };

      const cacheEntry = createCacheEntry(processedData);
      setCache(cacheEntry);
      setGroupData(processedData);
    } catch (err) {
      setError('Failed to fetch group data');
    } finally {
      setLoading(false);
    }
  }, [cache, API_BASE_URL]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const hasAnyData = hasCachedData(cache);
      
      if (!hasAnyData) {
        fetchGroupData();
      }
    } else {
      setLoading(false);
      setGroupData(defaultGroupData);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearGroupData();
    };
    
    const handleLogin = () => {
      fetchGroupData();
    };
    
    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, [fetchGroupData]);

  const updateGroupData = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please log in');
      }

      const response = await api.post('/groupSettings/update', updatedData, {
        headers: getAuthHeaders()
      });

      if (response.data?.success || response.data?.status === 'success') {
        await fetchGroupData(true);
        return { success: true };
      } else {
        throw new Error(response.data?.message || 'Failed to update group data');
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to update group data');
    }
  };

  const refreshGroupData = useCallback(() => fetchGroupData(true), [fetchGroupData]);

  const clearGroupData = useCallback(() => {
    setCache(null);
    setGroupData(defaultGroupData);
    setLoading(false);
    setError(null);
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear group data cache:', e);
    }
  }, []);

  const value = {
      groupData, 
      loading, 
      error, 
      fetchGroupData, 
      updateGroupData,
    refreshGroupData,
    clearGroupData,
    isCacheValid: hasCachedData(cache) && isDataFresh(cache?.timestamp)
  };

  return (
    <GroupDataContext.Provider value={value}>
      {children}
    </GroupDataContext.Provider>
  );
}; 