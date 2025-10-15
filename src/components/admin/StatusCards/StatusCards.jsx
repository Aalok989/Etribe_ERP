import React, { useEffect, useState } from "react";
import { FiUserCheck, FiUserX, FiAlertCircle, FiCalendar, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../../context/DashboardContext";

export default function StatusCards() {
  const { stats } = useDashboard();
  const navigate = useNavigate();

  // Use cached stats from dashboard context
  const activeCount = stats.activeCount;
  const inactiveCount = stats.inactiveCount;
  const expiredCount = stats.expiredCount;
  const totalEventsCount = stats.totalEventsCount;
  const pastEventsCount = stats.pastEventsCount;

  const statusData = [
    {
      label: "Active",
      count: activeCount, // Real value
      gradient: "bg-white dark:bg-gray-800",
      icon: <FiUserCheck size={32} className="text-blue-600 dark:text-blue-400 opacity-80" />, // Adjust icon color for contrast
      path: "/admin/active-members",
    },
    {
      label: "Pending Approval",
      count: inactiveCount, // Real value
      gradient: "bg-white dark:bg-gray-800",
      icon: <FiUserX size={32} className="text-emerald-600 dark:text-emerald-400 opacity-80" />, // Adjust icon color for contrast
      path: "/admin/pending-approval",
    },
    {
      label: "Membership Expired",
      count: expiredCount, // Real value
      gradient: "bg-white dark:bg-gray-800",
      icon: <FiAlertCircle size={32} className="text-rose-600 dark:text-rose-400 opacity-80" />, // Adjust icon color for contrast
      path: "/admin/membership-expired",
    },
    {
      label: "Total Event",
      count: totalEventsCount, // Real value
      gradient: "bg-white dark:bg-gray-800",
      icon: <FiCalendar size={32} className="text-blue-500 dark:text-blue-400 opacity-80" />,
      path: "/admin/all-events",
    },
    {
      label: "Past Event",
      count: pastEventsCount, // Real value
      gradient: "bg-white dark:bg-gray-800",
      icon: <FiClock size={32} className="text-violet-500 dark:text-violet-400 opacity-80" />,
      path: "/admin/past-events",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-6">
      {statusData.map((status) => (
        <div
          key={status.label}
          className={
            `relative rounded-2xl shadow-lg h-28 p-4 flex flex-col items-center justify-center gap-2 overflow-hidden transition-transform duration-200 hover:scale-105 cursor-pointer ${status.gradient} dark:shadow-gray-900 border border-gray-200 dark:border-gray-700`
          }
          onClick={() => navigate(status.path)}
          title={`Go to ${status.label} Members`}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/30 dark:bg-gray-700/40 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center gap-3 h-full w-full">
            <div className="flex-shrink-0">{status.icon}</div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-semibold tracking-wide leading-tight text-gray-900 dark:text-gray-100">{status.label}</span>
              <span className="text-2xl font-extrabold tracking-tight drop-shadow text-gray-900 dark:text-gray-100">{status.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 