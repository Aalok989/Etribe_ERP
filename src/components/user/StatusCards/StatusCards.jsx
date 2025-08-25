import React, { useEffect, useState } from "react";
import { FiUserCheck, FiMessageSquare, FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../../context/DashboardContext";

export default function StatusCards() {
  const { stats } = useDashboard();
  const navigate = useNavigate();

  // Use cached stats from dashboard context
  const activeCount = stats.activeCount;
  const enquiryReceivedCount = stats.enquiryReceivedCount;
  const enquiryDoneCount = stats.enquiryDoneCount;

  const statusData = [
    {
      label: "Active",
      count: activeCount, // Real value
      gradient: "bg-gradient-to-br from-emerald-200 via-green-100 to-white dark:from-emerald-800 dark:via-green-900 dark:to-gray-800",
      icon: <FiUserCheck size={32} className="text-blue-600 dark:text-emerald-300 opacity-80" />, // Adjust icon color for contrast
      path: "/user/ptfi-members",
    },
    {
      label: "Enquiry Received",
      count: enquiryReceivedCount, // Real value
      gradient: "bg-gradient-to-br from-blue-200 via-indigo-200 to-white dark:from-blue-900 dark:via-indigo-900 dark:to-gray-900 ",
      icon: <FiMessageSquare size={32} className="text-emerald-600 dark:text-blue-300 opacity-80" />, // Adjust icon color for contrast
      path: "/user/enquiry-received",
    },
    {
      label: "Enquiry Done",
      count: enquiryDoneCount, // Real value
      gradient: "bg-gradient-to-br from-rose-200 via-pink-100 to-white dark:from-rose-900 dark:via-pink-900 dark:to-gray-900",
      icon: <FiCheckCircle size={32} className="text-rose-600 dark:text-rose-300 opacity-80" />, // Adjust icon color for contrast
      path: "/user/enquiries-done",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      {statusData.map((status) => (
        <div
          key={status.label}
          className={
            `relative rounded-2xl shadow-lg h-32 p-4 flex flex-col items-center justify-center gap-2 overflow-hidden transition-transform duration-200 hover:scale-105 cursor-pointer ${status.gradient} dark:shadow-gray-900 border border-gray-200 dark:border-gray-700`
          }
          onClick={() => navigate(status.path)}
          title={`Go to ${status.label === "Active" ? "PTFI" : status.label} Members`}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/30 dark:bg-gray-700/40 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
            <div className="flex-shrink-0">{status.icon}</div>
            <span className="text-sm font-semibold tracking-wide text-center leading-tight text-gray-900 dark:text-gray-100">{status.label}</span>
            <span className="text-2xl font-extrabold tracking-tight drop-shadow text-gray-900 dark:text-gray-100">{status.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
} 