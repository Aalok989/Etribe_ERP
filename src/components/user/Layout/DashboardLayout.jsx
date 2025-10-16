import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="bg-gray-50 dark:bg-[#202123] font-sans h-screen overflow-hidden flex transition-colors duration-300">
      {/* Fixed Sidebar */}
      <Sidebar className="fixed left-0 top-0 h-screen z-30" collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* Main content area with responsive padding */}
      <div className={`flex flex-col flex-1 h-screen overflow-y-auto transition-all duration-200 ${
        // Always collapsed by default, expand only on user action
        collapsed ? 'pl-0 lg:pl-20' : 'pl-0 lg:pl-72'
      }`}>
        {/* TopBar with separate padding */}
        <div className="w-full px-6 pt-4 mb-0">
          <TopBar />
        </div>
        
        {/* Main content area with separate padding */}
        <div className="w-full px-6 flex-1 mb-2">
          {children}
        </div>
        {/* Footer */}
        <div className="w-full px-6 pb-2 mb-2">
          <Footer />
        </div>
      </div>
    </div>
  );
}