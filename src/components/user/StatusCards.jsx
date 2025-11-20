import React from "react";
import { FiUserCheck, FiMessageSquare, FiCheckCircle, FiCalendar, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../../context/DashboardContext";

export default function StatusCards() {
  const { stats } = useDashboard();
  const navigate = useNavigate();

  // Use cached stats from dashboard context
  const activeCount = stats.activeCount;
  const enquiryReceivedCount = stats.enquiryReceivedCount;
  const enquiryDoneCount = stats.enquiryDoneCount;
  const totalEventsCount = stats.totalEventsCount;
  const pastEventsCount = stats.pastEventsCount;

  const statusData = [
    {
      label: "Active",
      count: activeCount, // Real value
      gradient: "bg-white dark:bg-[#1E1E1E]",
      icon: <FiUserCheck size={32} className="text-blue-600 dark:text-blue-400" />, // Adjust icon color for contrast
      path: "/user/ptfi-members",
    },
    {
      label: "Enquiry Received",
      count: enquiryReceivedCount, // Real value
      gradient: "bg-white dark:bg-[#1E1E1E]",
      icon: <FiMessageSquare size={32} className="text-emerald-600 dark:text-emerald-400" />, // Adjust icon color for contrast
      path: "/user/enquiry-received",
    },
    {
      label: "Enquiry Done",
      count: enquiryDoneCount, // Real value
      gradient: "bg-white dark:bg-[#1E1E1E]",
      icon: <FiCheckCircle size={32} className="text-rose-600 dark:text-rose-400" />, // Adjust icon color for contrast
      path: "/user/enquiries-done",
    },
    {
      label: "Total Event",
      count: totalEventsCount, // Real value
      gradient: "bg-white dark:bg-[#1E1E1E]",
      icon: <FiCalendar size={32} className="text-blue-500 dark:text-blue-400" />,
      path: "/user/all-events",
    },
    {
      label: "Past Event",
      count: pastEventsCount, // Real value
      gradient: "bg-white dark:bg-[#1E1E1E]",
      icon: <FiClock size={32} className="text-violet-500 dark:text-violet-400" />,
      path: "/user/past-events",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-6">
      {statusData.map((status) => (
        <div
          key={status.label}
          className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer p-4 h-28 flex flex-col items-center justify-center gap-2 text-center"
          onClick={() => navigate(status.path)}
          title={`Go to ${status.label === "Active" ? "PTFI" : status.label} Members`}
        >
          <div className="flex-shrink-0">{status.icon}</div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {status.label}
            </span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {status.count ?? 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 