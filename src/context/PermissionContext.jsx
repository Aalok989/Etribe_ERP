import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { getAuthHeaders } from '../utils/apiHeaders';
import { getModuleIdFromRoute, ROUTE_TO_MODULE } from '../utils/moduleMapping';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_STORAGE_KEY = 'etribe_permissions_cache';

const isDataFresh = (timestamp, forceRefresh = false) => {
  if (forceRefresh) return false;
  return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
};

const createCacheEntry = (data, userRoleId) => {
  const entry = {
    data,
    userRoleId,
    timestamp: Date.now(),
    version: 1
  };
  
  try {
    sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('Permissions cache storage failed:', e);
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

const hasCachedData = (cacheEntry, currentUserRoleId) => {
  return cacheEntry && 
         cacheEntry.data && 
         Array.isArray(cacheEntry.data) &&
         cacheEntry.timestamp &&
         cacheEntry.userRoleId === currentUserRoleId; // Cache is role-specific
};

export const PermissionProvider = ({ children }) => {
  const [cache, setCache] = useState(() => {
    const storedCache = getCacheFromStorage();
    const currentUserRoleId = localStorage.getItem('user_role_id');
    return storedCache && isDataFresh(storedCache.timestamp) && hasCachedData(storedCache, currentUserRoleId) ? storedCache : null;
  });
  
  const [permissions, setPermissions] = useState(() => {
    const storedCache = getCacheFromStorage();
    const currentUserRoleId = localStorage.getItem('user_role_id');
    return storedCache && isDataFresh(storedCache.timestamp) && hasCachedData(storedCache, currentUserRoleId) ? storedCache.data : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPermissions = useCallback(async (force = false) => {
    const token = localStorage.getItem('token');
    const userRoleId = localStorage.getItem('user_role_id');

    if (!force && hasCachedData(cache, userRoleId) && isDataFresh(cache?.timestamp)) {
      return;
    }

    if (!token) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    if (userRoleId === '2') {
      const emptyPermissions = [];
      const cacheEntry = createCacheEntry(emptyPermissions, userRoleId);
      setCache(cacheEntry);
      setPermissions(emptyPermissions);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roleId = userRoleId || '1';
      
      const response = await api.post('/userRole/get_modules', {
        role_id: roleId.toString()
      }, {
        headers: getAuthHeaders()
      });

      let permissionsData = [];
      if (response.data?.status === true && Array.isArray(response.data?.data)) {
        permissionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        permissionsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        permissionsData = response.data.data;
      }

      const transformedPermissions = permissionsData.map(perm => ({
        system_module_id: perm.system_module_id || perm.module_id,
        module_name: perm.name || perm.module_name || perm.module,
        is_add: parseInt(perm.is_add) === 1,
        is_edit: parseInt(perm.is_edit) === 1,
        is_view: parseInt(perm.is_view) === 1,
        is_delete: parseInt(perm.is_delete) === 1,
      }));

      const cacheEntry = createCacheEntry(transformedPermissions, userRoleId);
      setCache(cacheEntry);
      setPermissions(transformedPermissions);
    } catch (err) {
      setError(err.message || 'Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Check if user has permission for a specific module and action
  const hasPermission = (moduleId, action) => {
    if (!moduleId) return false;
    
    const permission = permissions.find(
      p => String(p.system_module_id) === String(moduleId)
    );
    
    if (!permission) return false;
    
    switch (action) {
      case 'add':
      case 'create':
        return permission.is_add;
      case 'edit':
      case 'update':
        return permission.is_edit;
      case 'view':
      case 'read':
        return permission.is_view;
      case 'delete':
      case 'remove':
        return permission.is_delete;
      default:
        return false;
    }
  };

  // Check if user has any permission for a module
  const hasAnyPermission = (moduleId) => {
    if (!moduleId) return false;
    
    const permission = permissions.find(
      p => String(p.system_module_id) === String(moduleId)
    );
    
    if (!permission) return false;
    
    return permission.is_add || permission.is_edit || permission.is_view || permission.is_delete;
  };

  // Get permission object for a module
  const getModulePermission = (moduleId) => {
    if (!moduleId) return null;
    
    return permissions.find(
      p => String(p.system_module_id) === String(moduleId)
    ) || null;
  };

  // Check if user can access admin pages (user_role_id !== 2)
  const canAccessAdmin = () => {
    const userRoleId = localStorage.getItem('user_role_id');
    return userRoleId && userRoleId !== '2';
  };

  // Check if user has permission to access a specific route
  // This checks specifically for 'view' permission to control sidebar visibility
  const canAccessRoute = (route) => {
    const moduleId = getModuleIdFromRoute(route);
    if (!moduleId) {
      // If route is not mapped, allow access (for backward compatibility)
      return true;
    }
    return hasPermission(moduleId, 'view');
  };

  // Check if user has permission for a specific action on a route
  const canPerformActionOnRoute = (route, action) => {
    const moduleId = getModuleIdFromRoute(route);
    if (!moduleId) {
      // If route is not mapped, allow access (for backward compatibility)
      return true;
    }
    return hasPermission(moduleId, action);
  };

  const refreshPermissions = useCallback(() => fetchPermissions(true), [fetchPermissions]);

  const clearPermissions = useCallback(() => {
    setCache(null);
    setPermissions([]);
    setLoading(false);
    setError(null);
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear permissions cache:', e);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRoleId = localStorage.getItem('user_role_id');
    
    if (token) {
      const hasAnyData = hasCachedData(cache, userRoleId);
      
      if (!hasAnyData) {
        fetchPermissions();
      }
    } else {
      setLoading(false);
      setPermissions([]);
      setError(null);
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        fetchPermissions(true);
      } else {
        clearPermissions();
      }
    };

    window.addEventListener('login', handleAuthChange);
    window.addEventListener('logout', handleAuthChange);

    return () => {
      window.removeEventListener('login', handleAuthChange);
      window.removeEventListener('logout', handleAuthChange);
    };
  }, [fetchPermissions, clearPermissions]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_role_id' || e.key === 'token') {
        fetchPermissions(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchPermissions]);

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    getModulePermission,
    canAccessAdmin,
    canAccessRoute,
    canPerformActionOnRoute,
    refreshPermissions,
    clearPermissions,
    isCacheValid: hasCachedData(cache, localStorage.getItem('user_role_id')) && isDataFresh(cache?.timestamp)
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

