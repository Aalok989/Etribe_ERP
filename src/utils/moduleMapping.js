/**
 * Module Mapping Configuration
 * Maps system_module_id to routes and page identifiers
 * Based on the API response structure where modules have system_module_id
 */
export const MODULE_MAPPING = {
  // System Module ID: { route, name, pageIdentifier }
  1: { route: '/admin/group-data', name: 'Group Settings', pageIdentifier: 'group-settings' },
  2: { route: '/admin/smtp-settings', name: 'SMTP Settings', pageIdentifier: 'smtp-settings' },
  3: { route: '/admin/user-roles', name: 'User Roles', pageIdentifier: 'user-roles' },
  4: { route: '/admin/role-management', name: 'Role Management', pageIdentifier: 'role-management' },
  5: { route: '/admin/admin-accounts', name: 'System Accounts', pageIdentifier: 'system-accounts' },
  6: { route: '/admin/account-password-change', name: 'Account Password Change', pageIdentifier: 'account-password-change' },
  7: { route: '/admin/message-settings', name: 'Message Settings', pageIdentifier: 'message-settings' },
  8: { route: '/admin/membership-plans', name: 'Membership Plans', pageIdentifier: 'membership-plans' },
  9: { route: '/admin/membership-expired', name: 'Membership Management', pageIdentifier: 'membership-management' },
  10: { route: '/admin/important-contacts', name: 'Contacts Management', pageIdentifier: 'contacts-management' },
  11: { route: '/admin/all-events', name: 'Events Management', pageIdentifier: 'events-management' },
  12: { route: '/admin/circulars', name: 'Notifications', pageIdentifier: 'notifications' },
  13: { route: '/admin/grievances-active', name: 'Grievances', pageIdentifier: 'grievances' },
  14: { route: '/admin/resume', name: 'Resume', pageIdentifier: 'resume' },
};

/**
 * Route to Module ID mapping (reverse lookup)
 * Maps routes to their corresponding system_module_id
 */
export const ROUTE_TO_MODULE = {
  '/admin/group-data': 1,
  '/admin/smtp-settings': 2,
  '/admin/user-roles': 3,
  '/admin/role-management': 4,
  '/admin/admin-accounts': 5,
  '/admin/account-password-change': 6,
  '/admin/message-settings': 7,
  '/admin/membership-plans': 8,
  '/admin/membership-expired': 9,
  '/admin/active-members': 9, // Membership Management
  '/admin/inactive-members': 9, // Membership Management
  '/admin/pending-approval': 9, // Membership Management
  '/admin/new-registration': 9, // Membership Management
  '/admin/payment-details': 9, // Membership Management
  '/admin/member-detail': 9, // Membership Management (for dynamic routes like /admin/member-detail/:memberId)
  '/admin/important-contacts': 10,
  '/admin/all-events': 11,
  '/admin/calendar': 11, // Calendar is part of events
  '/admin/upcoming-events': 11,
  '/admin/past-events': 11,
  '/admin/circulars': 12,
  '/admin/feedbacks': 12, // Feedbacks are part of notifications
  '/admin/grievances-active': 13,
  '/admin/grievances-pending': 13,
  '/admin/grievances-closed': 13,
  '/admin/resume': 14,
  '/admin/post-job': 14, // Job portal is part of resume module
  '/admin/public-job': 14,
  '/admin/job-applicants': 14,
};

/**
 * Get module ID from route
 * @param {string} route - The route path
 * @returns {number|null} - The system_module_id or null if not found
 */
export const getModuleIdFromRoute = (route) => {
  // Exact match first
  if (ROUTE_TO_MODULE[route]) {
    return ROUTE_TO_MODULE[route];
  }
  
  // Check for partial matches (for nested routes)
  for (const [routePattern, moduleId] of Object.entries(ROUTE_TO_MODULE)) {
    if (route.startsWith(routePattern)) {
      return moduleId;
    }
  }
  
  return null;
};

/**
 * Get route from module ID
 * @param {number} moduleId - The system_module_id
 * @returns {string|null} - The route or null if not found
 */
export const getRouteFromModuleId = (moduleId) => {
  const module = MODULE_MAPPING[moduleId];
  return module ? module.route : null;
};

/**
 * Get module name from module ID
 * @param {number} moduleId - The system_module_id
 * @returns {string|null} - The module name or null if not found
 */
export const getModuleNameFromId = (moduleId) => {
  const module = MODULE_MAPPING[moduleId];
  return module ? module.name : null;
};

