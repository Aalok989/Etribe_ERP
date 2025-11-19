import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch permissions for the current user's role
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const userRoleId = localStorage.getItem('user_role_id');
      
      if (!token) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // If user_role_id is 2, they don't have admin permissions
      if (userRoleId === '2') {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Fetch permissions for the user's role
      const roleId = userRoleId || '1'; // Default to role 1 if not set
      
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

      // Transform permissions data to a more usable format
      const transformedPermissions = permissionsData.map(perm => ({
        system_module_id: perm.system_module_id || perm.module_id,
        module_name: perm.name || perm.module_name || perm.module,
        is_add: parseInt(perm.is_add) === 1,
        is_edit: parseInt(perm.is_edit) === 1,
        is_view: parseInt(perm.is_view) === 1,
        is_delete: parseInt(perm.is_delete) === 1,
      }));

      setPermissions(transformedPermissions);
    } catch (err) {
      setError(err.message || 'Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Refresh permissions
  const refreshPermissions = () => {
    fetchPermissions();
  };

  // Fetch permissions on mount and when user_role_id changes
  useEffect(() => {
    fetchPermissions();

    // Listen for login/logout events
    const handleAuthChange = () => {
      fetchPermissions();
    };

    window.addEventListener('login', handleAuthChange);
    window.addEventListener('logout', handleAuthChange);

    return () => {
      window.removeEventListener('login', handleAuthChange);
      window.removeEventListener('logout', handleAuthChange);
    };
  }, []);

  // Re-fetch permissions when user_role_id changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_role_id' || e.key === 'token') {
        fetchPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

