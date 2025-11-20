import React from "react";
import DashboardLayout from "../../components/user/DashboardLayout";
import StatusCards from "../../components/user/StatusCards";
import AnalyticsGraph from "../../components/user/AnalyticsGraph";
import ImportantContacts from "../../components/user/ImportantContacts";
import UpcomingEvents from "../../components/user/UpcomingEvents";
import FastPreloader from "../../components/user/FastPreloader";
import { useDashboard } from "../../context/DashboardContext";

// Fast loading skeleton for dashboard
const DashboardSkeleton = () => (
  <div className="space-y-4 py-2">
    {/* Status Cards Skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-[#1E1E1E] rounded w-48 animate-pulse"></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-[#1E1E1E] rounded-2xl animate-pulse"></div>
        ))}
      </div>
    </div>
    
    {/* Event Statistics Skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-[#1E1E1E] rounded w-40 animate-pulse"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-[#1E1E1E] rounded-2xl animate-pulse"></div>
        ))}
      </div>
    </div>
    
    {/* Analytics Skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-[#1E1E1E] rounded w-36 animate-pulse"></div>
      <div className="h-80 bg-gray-200 dark:bg-[#1E1E1E] rounded-2xl animate-pulse"></div>
    </div>
    
    {/* Contacts Skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-[#1E1E1E] rounded w-44 animate-pulse"></div>
      <div className="h-96 bg-gray-200 dark:bg-[#1E1E1E] rounded-2xl animate-pulse"></div>
    </div>
  </div>
);

function DashboardContent() {
  const { loading, fastLoading } = useDashboard();

  // Show fast preloader for immediate feedback
  if (fastLoading) {
    return <FastPreloader />;
  }

  // Show skeleton while loading for better perceived performance
  if (loading.initial) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Mobile & Tablet Layout (xs to lg) - Image Layout */}
      <div className="block lg:hidden space-y-4 py-2 bg-transparent dark:bg-[#202123] transition-colors duration-300">
        {/* Dashboard Overview Section */}
        <div>
          <StatusCards />
        </div>
        
        {/* Event Statistics Section */}
        <div>
          <UpcomingEvents />
        </div>
        
        {/* Member Analytics Section */}
        <div>
          <div className="h-80">
            <AnalyticsGraph containerClass="h-full p-0 mb-0" chartHeight="100%" />
          </div>
        </div>
        
        {/* Important Contacts Section */}
        <div>
          <div className="rounded-2xl shadow">
            <ImportantContacts />
          </div>
        </div>
      </div>

      {/* Desktop Layout (lg and above) - Aligned Layout */}
      <div className="hidden lg:block space-y-4 py-2 bg-transparent dark:bg-[#202123] transition-colors duration-300">
        {/* First Row: Status Cards - Full Width */}
        <div>
          <StatusCards />
        </div>
        
        {/* Second Row: Member Analytics (left) + Upcoming Events (right) */}
        <div className="grid grid-cols-3 gap-4">
          {/* Member Analytics - Takes 2 columns */}
          <div className="col-span-2">
            <div className="h-80">
              <AnalyticsGraph containerClass="h-full p-0 mb-0" chartHeight="100%" />
            </div>
          </div>
          
          {/* Upcoming Events - Takes 1 column */}
          <div className="col-span-1">
            <div className="h-80">
              <UpcomingEvents containerClass="h-full p-0 mb-0" chartHeight="100%" />
            </div>
          </div>
        </div>
        
        {/* Third Row: Important Contacts - Full Width */}
        <div>
          <div className="rounded-2xl shadow">
            <ImportantContacts />
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
