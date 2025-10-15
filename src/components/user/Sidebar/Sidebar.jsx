import React, { useState, useEffect } from "react";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiBell,
  FiAlertTriangle,
  FiBookOpen,
  FiFileText,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axiosConfig";
import { getAuthHeaders } from "../../../utils/apiHeaders";
import { useDashboard } from "../../../context/DashboardContext";
import { useGroupData } from "../../../context/GroupDataContext";

// Custom logout hook
const useLogout = () => {
  const navigate = useNavigate();
  const dashboard = useDashboard();
  
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("uid");
    
    // Clear dashboard data and cache
    try {
      dashboard.clearAllData();
    } catch (e) {
      // Context might not be available, continue with logout
    }
    
    // Dispatch logout event to clear data
    window.dispatchEvent(new Event('logout'));
    
    // Navigate to login
    navigate("/login", { replace: true });
  };
  
  return handleLogout;
};

// Menu structure
const menuItems = [
  {
    label: "Dashboard",
    icon: <FiGrid size={20} />,
    path: "/user/dashboard",
    dropdown: false,
  },
  {
    label: "Membership Detail",
    icon: <FiUsers size={20} />,
    path: "/user/member-detail/me",
    dropdown: false,
  },
  {
    label: "Product/Services",
    icon: <FiBookOpen size={20} />,
    path: "/user/product-services",
    dropdown: false,
  },
  {
    label: "Enquiry",
    icon: <FiFileText size={20} />,
    path: "/user/enquiry",
    dropdown: false,
  },
  {
    label: "Enquiry Received",
    icon: <FiFileText size={20} />,
    path: "/user/enquiry-received",
    dropdown: false,
  },
  {
    label: "Event Management",
    icon: <FiCalendar size={20} />,
    path: "#",
    basePath: "/user/event-management",
    dropdown: true,
    subItems: [
      { label: "Calendar", path: "/user/calendar" },
      { label: "All Events", path: "/user/all-events" },
      { label: "Upcoming Events", path: "/user/upcoming-events" },
      { label: "Past Events", path: "/user/past-events" },
    ],
  },
  {
    label: "Member's Area",
    icon: <FiUsers size={20} />,
    path: "#",
    basePath: "/user/members-area",
    dropdown: true,
    subItems: [
      { label: "Feedback", path: "/user/feedback" },
      { label: "Grievance", path: "/user/grievance" },
      { label: "Circular", path: "/user/circular" },
      { label: "PTFI Members", path: "/user/ptfi-members" },
    ],
  },
  {
    label: "Enquiries Done",
    icon: <FiFileText size={20} />,
    path: "/user/enquiries-done",
    dropdown: false,
  },
  {
    label: "Important Contacts",
    icon: <FiBookOpen size={20} />,
    path: "/user/important-contacts",
    dropdown: false,
  },
  {
    label: "Resume",
    icon: <FiFileText size={20} />,
    path: "/user/resume",
    dropdown: false,
  },
];

export default function Sidebar({ className = "", collapsed, setCollapsed }) {
  const [openDropdown, setOpenDropdown] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = useLogout();
  
  // Try to use DashboardContext first, fallback to GroupDataContext
  let groupData = {};
  try {
    const dashboard = useDashboard();
    groupData = dashboard.data?.groupData || {};
  } catch (e) {
    // DashboardContext not available, try GroupDataContext
    try {
      const groupDataContext = useGroupData();
      groupData = groupDataContext.groupData || {};
    } catch (e2) {
      // Neither context available, use empty object
      groupData = {};
    }
  }

  // Open the relevant dropdown if inside a nested path
  useEffect(() => {
    const activeItem = menuItems.find((item) =>
      item.subItems?.some((sub) => {
        // Check exact match first
        if (sub.path === location.pathname) return true;
        
        // Special case for member detail pages - they should open "Members Services" dropdown
        if (sub.path === "/members-services/active" && location.pathname.startsWith("/member/")) {
          return true;
        }
        
        return false;
      })
    );
    if (activeItem) {
      setOpenDropdown(activeItem.label);
    }
  }, [location.pathname]);

  return (
    <>
                {/* Mobile/Tablet Toggle Button - Always visible on small, medium, and large screens */}
              <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label={mobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={mobileSidebarOpen}
        >
          {mobileSidebarOpen ? (
            <FiChevronLeft size={20} />
          ) : (
            <FiChevronRight size={20} />
          )}
        </button>

      {/* Mobile/Tablet Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 flex flex-col transition-all duration-200 shadow-lg h-screen max-h-screen ${
          collapsed ? "w-20" : "w-72"
        } hidden lg:flex ${className}`}
      >
              {/* Top bar with logo */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {groupData?.signature ? (
            <img
              src={groupData.signature}
              alt="Signature Logo"
              className={`object-contain ${collapsed ? "w-16 h-6" : "w-32 h-8"}`}
            />
          ) : (
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/Etribe-logo.jpg"
                alt="Etribe Logo"
                className={`rounded-lg ${collapsed ? "w-8 h-8" : "w-8 h-8"}`}
              />
              {!collapsed && (
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                  Etribe
                </span>
              )}
            </div>
          )}
        <button
          className="ml-auto p-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <FiChevronRight size={20} />
          ) : (
            <FiChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-2 pt-4 pb-4 overflow-y-auto min-h-0 max-h-full">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isParentActive = item.subItems?.some(
              (sub) => {
                // Check exact match first
                if (location.pathname === sub.path) return true;
                
                // Special case for member detail pages - they should highlight "Active Members"
                if (sub.path === "/members-services/active" && location.pathname.startsWith("/member/")) {
                  return true;
                }
                
                return false;
              }
            );

            if (item.dropdown) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === item.label ? "" : item.label
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-2 font-medium text-left whitespace-nowrap rounded-lg transition-colors
                      ${
                        collapsed ? "justify-center" : ""
                      }
                      ${
                        isParentActive
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span className={`${collapsed ? "hidden" : "flex-1"}`}>
                      {item.label}
                    </span>
                    {!collapsed && (
                      <span className="ml-auto">
                        <FiChevronDown
                          size={20}
                          className={`transition-transform ${
                            openDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    )}
                  </button>
                  {openDropdown === item.label && !collapsed && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((sub) => (
                        <li key={sub.path}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) => {
                              // Special case for member detail pages - they should highlight "Active Members"
                              let shouldBeActive = isActive;
                              if (sub.path === "/members-services/active" && location.pathname.startsWith("/member/")) {
                                shouldBeActive = true;
                              }
                              
                              return `block text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors
                                ${
                                  shouldBeActive
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm font-medium"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`;
                            }}
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap
                      ${
                        collapsed ? "justify-center" : ""
                      }
                      ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`
                  }
                  end={item.path === "/user/dashboard"}
                >
                  <span>{item.icon}</span>
                  <span className={`${collapsed ? "hidden" : ""}`}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <FiLogOut size={20} />
          {!collapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>

    {/* Mobile/Tablet Sidebar - Full width with icons and text */}
    <aside
      className={`lg:hidden fixed top-0 left-0 h-screen max-h-screen bg-white dark:bg-gray-800 flex flex-col transition-all duration-200 shadow-lg z-50 ${
        mobileSidebarOpen ? "w-72 md:w-80" : "-translate-x-full"
      }`}
    >
      {/* Mobile Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/Etribe-logo.jpg"
            alt="Etribe Logo"
            className="w-8 h-8 rounded-lg"
          />
          <span className="text-lg font-bold text-gray-800 dark:text-white">
            Etribe
          </span>
        </div>
        <button
          className="p-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-gray-600 transition-colors"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <FiChevronLeft size={20} />
        </button>
      </div>

      {/* Mobile Nav Menu - Icons and Text */}
      <nav className="flex-1 px-2 pt-4 overflow-y-auto min-h-0 max-h-full pb-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isParentActive = item.subItems?.some(
              (sub) => location.pathname === sub.path
            );

            if (item.dropdown) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => {
                      setOpenDropdown(
                        openDropdown === item.label ? "" : item.label
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 font-medium text-left whitespace-nowrap rounded-lg transition-colors
                      ${
                        isParentActive
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    <span className="ml-auto">
                      <FiChevronDown
                        size={20}
                        className={`transition-transform ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                  {openDropdown === item.label && (
                    <ul className="mt-1 space-y-1">
                      {item.subItems.map((sub) => (
                        <li key={sub.path}>
                          <NavLink
                            to={sub.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={({ isActive }) =>
                              `block text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors
                                ${
                                  isActive
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm font-medium"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`
                            }
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap
                      ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 shadow-sm relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-2 before:bg-gradient-to-b before:from-blue-600 before:to-blue-500 dark:before:from-blue-400 dark:before:to-blue-300 before:rounded-r-xl before:shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`
                  }
                  end={item.path === "/user/dashboard"}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

              {/* Mobile Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <FiLogOut size={20} />
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </div>
    </aside>
    </>
  );
} 
