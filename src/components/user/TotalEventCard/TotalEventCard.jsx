import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import { useDashboard } from "../../../context/DashboardContext";

export default function TotalEventCard() {
  const { stats } = useDashboard();
  const navigate = useNavigate();

  // Use cached stats from dashboard context
  const totalEventsCount = stats.totalEventsCount;

  return (
    <div
      className="relative h-32 rounded-2xl shadow-lg flex flex-col items-center justify-center p-3 gap-1 transition-transform duration-200 hover:scale-105 cursor-pointer overflow-hidden bg-gradient-to-br from-blue-200 via-blue-100 to-white dark:from-blue-800 dark:via-blue-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700"
              onClick={() => navigate("/user/all-events")}
      title="Go to All Events"
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-700/40 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <FiCalendar size={32} className="text-blue-500 opacity-80 mb-1" />
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total Event</div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 drop-shadow">{totalEventsCount}</div>
      </div>
    </div>
  );
} 