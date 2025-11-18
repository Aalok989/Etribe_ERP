import React from 'react';
import { usePermissions } from '../../context/PermissionContext';

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 * 
 * @param {number} moduleId - The system_module_id to check permissions for
 * @param {string} action - The action to check ('view', 'add', 'edit', 'delete')
 * @param {React.ReactNode} children - The content to render if permission is granted
 * @param {React.ReactNode} fallback - Optional content to render if permission is denied
 */
export default function PermissionGuard({ 
  moduleId, 
  action = 'view', 
  children, 
  fallback = null 
}) {
  const { hasPermission, loading } = usePermissions();

  // Show loading state or fallback while permissions are loading
  if (loading) {
    return fallback;
  }

  // Check if user has the required permission
  if (hasPermission(moduleId, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * RoutePermissionGuard Component
 * Conditionally renders children based on route permissions
 * 
 * @param {string} route - The route path to check permissions for
 * @param {string} action - The action to check ('view', 'add', 'edit', 'delete')
 * @param {React.ReactNode} children - The content to render if permission is granted
 * @param {React.ReactNode} fallback - Optional content to render if permission is denied
 */
export function RoutePermissionGuard({ 
  route, 
  action = 'view', 
  children, 
  fallback = null 
}) {
  const { canPerformActionOnRoute, loading } = usePermissions();

  // Show loading state or fallback while permissions are loading
  if (loading) {
    return fallback;
  }

  // Check if user has the required permission for the route
  if (canPerformActionOnRoute(route, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

