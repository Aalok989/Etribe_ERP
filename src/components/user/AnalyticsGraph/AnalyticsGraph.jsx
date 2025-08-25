import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { FiTrendingUp, FiUsers, FiUserCheck, FiUserX, FiClock, FiRefreshCw, FiBarChart2, FiPieChart, FiActivity } from "react-icons/fi";
import { useDashboard } from '../../../context/DashboardContext';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl p-4">
        <p className="text-gray-600 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full shadow-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsGraph() {
  const { data: dashboardData, loading: dashboardLoading, errors, refreshEnquiries, stats } = useDashboard();
  const [chartType, setChartType] = useState('area'); // area, bar, line, pie
  const [selectedMetric, setSelectedMetric] = useState('all'); // all, members activated, pending approval, membership expired, enquiry received, enquiry done
  const [lastUpdated, setLastUpdated] = useState(null);

  // Use analytics data from dashboard context
  const data = dashboardData.analytics || [];
  const loading = dashboardLoading.enquiries;
  const error = errors.enquiries;

  // Debug logging
  console.log('AnalyticsGraph - analytics data:', data);
  console.log('AnalyticsGraph - loading state:', loading);
  console.log('AnalyticsGraph - error state:', error);



  // Process real data to ensure complete year data by filling missing months
  // Use useMemo to prevent recalculation on every render
  const chartData = useMemo(() => {
    if (data.length > 0) {
      // Ensure we have complete year data by filling missing months
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const completeData = monthOrder.map(month => {
        const existingData = data.find(item => item.month === month);
        if (existingData) {
          return existingData;
        } else {
          // Fill missing months with zero values for enquiry metrics only
          return {
            month,
            'Enquiry Received': 0,
            'Enquiry Done': 0
          };
        }
      });
      return completeData;
    }
    // Return empty array if no data available
    return [];
  }, [data]);

  // Update last updated when data changes - only when data actually changes
  useEffect(() => {
    if (chartData.length > 0) {
      setLastUpdated(new Date());
    }
  }, [data]); // Changed from chartData to data to prevent infinite loop

  const handleRefresh = useCallback(() => {
    refreshEnquiries();
  }, [refreshEnquiries]);

  const getChartComponent = useCallback(() => {
    const colors = {
      'Enquiry Received': '#6366f1',      // Indigo
      'Enquiry Done': '#f43f5e'          // Rose
    };

    const filteredData = selectedMetric === 'all' 
      ? chartData 
      : chartData.map(item => ({
          month: item.month,
          [selectedMetric]: item[selectedMetric]
        }));

    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="enquiryReceivedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="enquiryDoneGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              allowDecimals={false}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetric === 'all' && (
              <>
                <Area type="monotone" dataKey="Enquiry Received" stroke="#6366f1" fill="url(#enquiryReceivedGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="Enquiry Done" stroke="#f43f5e" fill="url(#enquiryDoneGradient)" strokeWidth={3} />
              </>
            )}
            {selectedMetric !== 'all' && (
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={colors[selectedMetric]} 
                fill={`url(#${selectedMetric.toLowerCase().replace(/\s+/g, '')}Gradient)`} 
                strokeWidth={3} 
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              allowDecimals={false}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetric === 'all' && (
              <>
                <Bar dataKey="Enquiry Received" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Enquiry Done" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </>
            )}
            {selectedMetric !== 'all' && (
              <Bar 
                dataKey={selectedMetric} 
                fill={colors[selectedMetric]} 
                radius={[4, 4, 0, 0]} 
              />
            )}
          </BarChart>
        );

      default: // line chart
        return (
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              allowDecimals={false}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedMetric === 'all' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="Enquiry Received" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, fill: '#6366f1', strokeWidth: 3, stroke: '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Enquiry Done" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, fill: '#f43f5e', strokeWidth: 3, stroke: '#ffffff' }}
                />
              </>
            )}
            {selectedMetric !== 'all' && (
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={colors[selectedMetric]} 
                strokeWidth={3} 
                dot={{ r: 6, fill: colors[selectedMetric], strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 8, fill: colors[selectedMetric], strokeWidth: 3, stroke: '#ffffff' }}
              />
            )}
          </LineChart>
        );
    }
  }, [chartData, selectedMetric, chartType]);

  return (
    <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 h-full w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header with gradient background, improved for layout consistency */}
      <div className="relative rounded-t-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 via-blue-200 to-blue-300 dark:from-indigo-900 dark:via-blue-900 dark:to-gray-900" />
        <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/40 backdrop-blur-md border-b border-white/30 dark:border-gray-700" />
        <div className="relative z-10 flex items-center gap-3 px-5 py-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-indigo-100 tracking-wide">Enquiry Analytics</h2>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-6">
        {/* Chart Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Chart:</span>
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            {[
              { key: 'area', icon: FiPieChart, label: 'Area' },
              { key: 'bar', icon: FiBarChart2, label: 'Bar' },
              { key: 'line', icon: FiActivity, label: 'Line' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setChartType(key)}
                disabled={chartData.length === 0}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 border-none outline-none focus:ring-2 focus:ring-indigo-400 ${
                  chartType === key
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                } ${chartData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Metric Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Filter:</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            disabled={chartData.length === 0}
            className={`px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              chartData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="all">All Metrics</option>
            <option value="Enquiry Received">Enquiry Received Only</option>
            <option value="Enquiry Done">Enquiry Done Only</option>
          </select>
        </div>

        {/* Last Updated */}
        {lastUpdated && chartData.length > 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            No data available
          </div>
        ) : null}

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="ml-auto p-2 bg-white/20 dark:bg-gray-800/40 rounded-lg backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/40 transition-all duration-200 disabled:opacity-50"
          aria-label="Refresh"
        >
          <FiRefreshCw className={`w-5 h-5 text-indigo-600 dark:text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0 h-0 flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Refreshing chart...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiActivity className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBarChart2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No Analytics Data Available</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Data will appear here once enquiries are processed</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm"
              >
                Refresh Data
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              {getChartComponent()}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
} 