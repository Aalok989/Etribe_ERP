import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import { useDashboard } from "../../../context/DashboardContext";

export default function PastEventCard() {
  const { stats } = useDashboard();
  const navigate = useNavigate();

  // Use cached stats from dashboard context
  const pastEventsCount = stats.pastEventsCount;

  return (
    <div
      className="relative h-32 rounded-2xl shadow-lg flex flex-col items-center justify-center p-3 gap-1 transition-transform duration-200 hover:scale-105 cursor-pointer overflow-hidden bg-gradient-to-br from-violet-200 via-indigo-100 to-white dark:from-violet-800 dark:via-indigo-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700"
              onClick={() => navigate("/user/past-events")}
      title="Go to Past Events"
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-700/40 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
        <FiClock size={32} className="text-violet-500 dark:text-violet-300 opacity-80 mb-1" />
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Past Event</div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 drop-shadow">{pastEventsCount}</div>
      </div>
    </div>
  );
} 