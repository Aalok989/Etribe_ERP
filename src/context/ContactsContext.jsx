import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axiosConfig';
import { getAuthHeaders } from '../utils/apiHeaders';

const ContactsContext = createContext();

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_STORAGE_KEY = 'etribe_contacts_cache';

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
    console.warn('Contacts cache storage failed:', e);
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
         Array.isArray(cacheEntry.data) &&
         cacheEntry.data.length > 0 &&
         cacheEntry.timestamp;
};

export const ContactsProvider = ({ children }) => {
  const [cache, setCache] = useState(() => {
    const storedCache = getCacheFromStorage();
    return storedCache && isDataFresh(storedCache.timestamp) ? storedCache : null;
  });
  
  const [contactsData, setContactsData] = useState(() => {
    const storedCache = getCacheFromStorage();
    return storedCache && isDataFresh(storedCache.timestamp) ? storedCache.data : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async (force = false) => {
    if (!force && hasCachedData(cache) && isDataFresh(cache?.timestamp)) {
      return;
    }

      setLoading(true);
      setError(null);

    try {
      const response = await api.get('/contact', {
        headers: getAuthHeaders()
      });

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

      const cacheEntry = createCacheEntry(mappedContacts);
      setCache(cacheEntry);
      setContactsData(mappedContacts);
    } catch (err) {
      setError('Failed to fetch contacts: ' + (err.response?.data?.message || err.message));
      setContactsData([]);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const hasAnyData = hasCachedData(cache);
      
      if (!hasAnyData) {
      fetchContacts();
      }
    } else {
      setLoading(false);
      setContactsData([]);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearContacts();
    };
    
    const handleLogin = () => {
      fetchContacts();
    };
    
    window.addEventListener('logout', handleLogout);
    window.addEventListener('login', handleLogin);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('login', handleLogin);
    };
  }, [fetchContacts]);

  const addContact = async (contact) => {
    try {
      const payload = {
        department: contact.dept,
        name: contact.name,
        contact_no: contact.contact,
        email_id: contact.email,
        address: contact.address,
      };
      const response = await api.post('/contact/add', payload, {
        headers: getAuthHeaders()
      });
      await fetchContacts(true);
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to add contact';
    }
  };

  const editContact = async (contact) => {
    try {
      const payload = {
        id: contact.id,
        department: contact.dept,
        name: contact.name,
        contact_no: contact.contact,
        email_id: contact.email,
        address: contact.address,
      };
      const response = await api.post('/contact/edit', payload, {
        headers: getAuthHeaders()
      });
      await fetchContacts(true);
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to edit contact';
    }
  };

  const deleteContact = async (contactId) => {
    try {
      const response = await api.post('/contact/remove', { id: contactId }, {
        headers: getAuthHeaders()
      });
      await fetchContacts(true);
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to delete contact';
    }
  };

  const refreshContacts = useCallback(() => fetchContacts(true), [fetchContacts]);

  const clearContacts = useCallback(() => {
    setCache(null);
    setContactsData([]);
    setLoading(false);
    setError(null);
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear contacts cache:', e);
    }
  }, []);

  const value = {
    contactsData,
    loading,
    error,
    addContact,
    editContact,
    deleteContact,
    fetchContacts,
    refreshContacts,
    clearContacts,
    isCacheValid: hasCachedData(cache) && isDataFresh(cache?.timestamp)
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}; 