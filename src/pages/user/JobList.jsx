import React, { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiMapPin, 
  FiChevronDown, 
  FiGrid, 
  FiList,
  FiBookmark,
  FiCheck,
  FiFilter,
  FiX
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Etribe-logo.jpg";
// import api from "../../api/axiosConfig";
// import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from "react-toastify";

export default function JobList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [sortBy, setSortBy] = useState("newest");
  
  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    experience: true,
    jobTitle: true,
    country: true,
    industry: true
  });
  
  const [filters, setFilters] = useState({
    experience: ["any"],
    jobTitle: [],
    country: [],
    industry: []
  });
  
  // Search queries for filter sections
  const [filterSearchQueries, setFilterSearchQueries] = useState({
    jobTitle: "",
    country: "",
    industry: ""
  });
  
  // Job data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter options (mock data - replace with API data)
  const experienceOptions = [
    { label: "Any work experience", count: 181, value: "any" },
    { label: "Less than 1 year", count: 21, value: "0-1" },
    { label: "1-2 years", count: 21, value: "1-2" },
    { label: "3-5 years", count: 125, value: "3-5" },
    { label: "More than 5 years", count: 125, value: "5+" }
  ];
  
  const jobTitleOptions = [
    { label: "IOS Developer", count: 181, value: "ios" },
    { label: "Android Developer", count: 21, value: "android" },
    { label: "UX&UI Designer", count: 1259, value: "ux-ui" }
  ];
  
  const countryOptions = [
    { label: "USA", count: 181, value: "usa" },
    { label: "UK", count: 21, value: "uk" }
  ];
  
  const industryOptions = [
    { label: "Information Technology", count: 245, value: "it" },
    { label: "Healthcare", count: 189, value: "healthcare" },
    { label: "Finance", count: 156, value: "finance" },
    { label: "Education", count: 134, value: "education" },
    { label: "Manufacturing", count: 98, value: "manufacturing" },
    { label: "Retail", count: 87, value: "retail" },
    { label: "Real Estate", count: 76, value: "real-estate" },
    { label: "Hospitality", count: 65, value: "hospitality" }
  ];
  
  // Mock job data - replace with API call
  const mockJobs = [
    {
      id: 1,
      title: "Web Developer",
      company: "Infosys",
      description: "A bachelor's degree in Computer Science is required. Strong communication skills, team spirit, client call handling. A Web Developer is a professional who is responsible for the development....",
      tags: ["Contract", "Remote", "Full Time", "0-1 years experience"],
      location: "Delhi",
      logo: "https://logo.clearbit.com/infosys.com",
      postedTime: "19 hours ago"
    },
    {
      id: 2,
      title: "Web Developer",
      company: "Concentrix",
      description: "A bachelor's degree in Computer Science is required. Strong communication skills, team spirit, client call handling. A Web Developer is a professional who is responsible for the development....",
      tags: ["Contract", "Remote", "Full Time", "0-1 years experience"],
      location: "Delhi",
      logo: "https://logo.clearbit.com/concentrix.com",
      postedTime: "19 hours ago"
    },
    {
      id: 3,
      title: "iOS Developer",
      company: "Nagarro",
      description: "A bachelor's degree in Computer Science is required. Strong communication skills, team spirit, client call handling. A Web Developer is a professional who is responsible for the development....",
      tags: ["Contract", "Remote", "Full Time", "0-1 years experience"],
      location: "Delhi",
      logo: "https://logo.clearbit.com/nagarro.com",
      postedTime: "19 hours ago"
    },
    {
      id: 4,
      title: "Web Developer",
      company: "Google",
      description: "A bachelor's degree in Computer Science is required. Strong communication skills, team spirit, client call handling. A Web Developer is a professional who is responsible for the development....",
      tags: ["Contract", "Remote", "Full Time", "0-1 years experience"],
      location: "Delhi",
      logo: "https://logo.clearbit.com/google.com",
      postedTime: "19 hours ago"
    }
  ];
  
  const loadJobs = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await api.post('/Job_post/all_public', {}, {
      //   headers: getAuthHeaders()
      // });
      // setJobs(response.data?.data || []);
      
      // Using mock data for now
      setJobs(mockJobs);
    } catch {
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Load jobs from API
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (category === "experience" && value === "any") {
        newFilters[category] = ["any"];
      } else {
        const current = newFilters[category] || [];
        if (current.includes(value)) {
          newFilters[category] = current.filter(v => v !== value);
          if (category === "experience" && newFilters[category].length === 0) {
            newFilters[category] = ["any"];
          }
        } else {
          if (category === "experience" && current.includes("any")) {
            newFilters[category] = [value];
          } else {
            newFilters[category] = [...current, value];
          }
        }
      }
      return newFilters;
    });
  };
  
  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      experience: ["any"],
      jobTitle: [],
      country: [],
      industry: []
    });
    setSearchQuery("");
    setLocationQuery("");
    setFilterSearchQueries({
      jobTitle: "",
      country: "",
      industry: ""
    });
  };
  
  // Filter options based on search queries
  const getFilteredJobTitles = () => {
    if (!filterSearchQueries.jobTitle) return jobTitleOptions;
    const query = filterSearchQueries.jobTitle.toLowerCase();
    return jobTitleOptions.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  };
  
  const getFilteredCountries = () => {
    if (!filterSearchQueries.country) return countryOptions;
    const query = filterSearchQueries.country.toLowerCase();
    return countryOptions.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  };
  
  const getFilteredIndustries = () => {
    if (!filterSearchQueries.industry) return industryOptions;
    const query = filterSearchQueries.industry.toLowerCase();
    return industryOptions.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  };
  
  const handleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };
  
  const handleFindJob = () => {
    // Implement search logic
    loadJobs();
  };
  
  return (
    <div className="h-screen bg-gray-50 w-full flex flex-col overflow-hidden">
      {/* Header Section - Fixed */}
      <header className="bg-white border-b border-gray-200 w-full fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-3 sm:px-4 py-1 sm:py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="ETRIBE" className="h-10 sm:h-14 md:h-16 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium bg-white border-2 border-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
              >
                Log in
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium bg-white border-2 border-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Search Bar Section - Fixed */}
      <div className="py-4 sm:py-6 w-full flex items-center justify-center fixed top-[60px] sm:top-[70px] left-0 right-0 z-40" style={{ backgroundColor: '#6258BA' }}>
        <div className="w-full max-w-6xl px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by: Job title, Position, Company ..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="City, state or zip code"
                className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm sm:text-base"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleFindJob}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
            >
              Find Job
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="w-full px-3 sm:px-4 pt-4 sm:pt-6 mt-[140px] sm:mt-[160px] flex-1 overflow-hidden flex flex-col">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiFilter size={18} />
            <span>Filters</span>
            <FiChevronDown 
              className={`transform transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full h-full">
          {/* Left Column - Filters - Fixed */}
          <div className={`lg:w-1/4 flex-shrink-0 ${showMobileFilters ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:shadow-sm lg:overflow-visible lg:h-full' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:h-full lg:flex lg:flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Filter by</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetFilters}
                    className="text-teal-600 hover:text-teal-700 text-xs sm:text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 lg:overflow-y-auto lg:min-h-0">
              
              {/* Experience Level Filter */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => toggleFilterSection("experience")}
                  className="w-full flex items-center justify-between text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  <span>Experience level:</span>
                  <FiChevronDown 
                    className={`transform transition-transform ${expandedFilters.experience ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>
                {expandedFilters.experience && (
                  <div className="space-y-2">
                    {experienceOptions.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.experience.includes(option.value)}
                          onChange={() => toggleFilter("experience", option.value)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label} ({option.count})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Job Title Filter */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => toggleFilterSection("jobTitle")}
                  className="w-full flex items-center justify-between text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  <span>Job title:</span>
                  <FiChevronDown 
                    className={`transform transition-transform ${expandedFilters.jobTitle ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>
                {expandedFilters.jobTitle && (
                  <div className="space-y-3">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search title"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={filterSearchQueries.jobTitle}
                        onChange={(e) => setFilterSearchQueries(prev => ({ ...prev, jobTitle: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      {getFilteredJobTitles().length > 0 ? (
                        getFilteredJobTitles().map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.jobTitle.includes(option.value)}
                              onChange={() => toggleFilter("jobTitle", option.value)}
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">
                              {option.label} ({option.count})
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No job titles found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Country Filter */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => toggleFilterSection("country")}
                  className="w-full flex items-center justify-between text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  <span>Country:</span>
                  <FiChevronDown 
                    className={`transform transition-transform ${expandedFilters.country ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>
                {expandedFilters.country && (
                  <div className="space-y-3">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search country"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={filterSearchQueries.country}
                        onChange={(e) => setFilterSearchQueries(prev => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      {getFilteredCountries().length > 0 ? (
                        getFilteredCountries().map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.country.includes(option.value)}
                              onChange={() => toggleFilter("country", option.value)}
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">
                              {option.label} ({option.count})
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No countries found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Industry Filter */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => toggleFilterSection("industry")}
                  className="w-full flex items-center justify-between text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                >
                  <span>Industry:</span>
                  <FiChevronDown 
                    className={`transform transition-transform ${expandedFilters.industry ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>
                {expandedFilters.industry && (
                  <div className="space-y-3">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search industry"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={filterSearchQueries.industry}
                        onChange={(e) => setFilterSearchQueries(prev => ({ ...prev, industry: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      {getFilteredIndustries().length > 0 ? (
                        getFilteredIndustries().map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.industry.includes(option.value)}
                              onChange={() => toggleFilter("industry", option.value)}
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">
                              {option.label} ({option.count})
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 py-2">No industries found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={handleFindJob}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Find job
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Job Listings - Scrollable */}
          <div className="lg:w-3/4 w-full h-full overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">All Job List</h2>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 sm:p-2 rounded ${viewMode === "grid" ? "bg-teal-500 text-white" : "text-gray-600"}`}
                      aria-label="Grid view"
                    >
                      <FiGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 sm:p-2 rounded ${viewMode === "list" ? "bg-teal-500 text-white" : "text-gray-600"}`}
                      aria-label="List view"
                    >
                      <FiList size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 flex-1 sm:flex-initial"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="relevance">Relevance</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Job Cards */}
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-teal-600"></div>
                  <p className="mt-4 text-sm sm:text-base text-gray-600">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-600">No jobs found</p>
                </div>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                  : "space-y-3 sm:space-y-4"
                }>
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      className={`border-2 rounded-lg p-3 sm:p-4 hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 ${
                        index === 0 ? "border-orange-400" : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">{job.title}</h3>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs sm:text-sm text-gray-600">{job.company}</span>
                            <FiCheck className="text-orange-500 flex-shrink-0" size={14} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.logo && (
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveJob(job.id);
                            }}
                            className={`p-1.5 transition-colors flex-shrink-0 ${
                              savedJobs.has(job.id)
                                ? "text-orange-500"
                                : "text-orange-500 hover:text-orange-600"
                            }`}
                            aria-label={savedJobs.has(job.id) ? "Unsave job" : "Save job"}
                          >
                            <FiBookmark size={18} fill={savedJobs.has(job.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-xs sm:text-sm mb-2 line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {job.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs sm:text-sm">
                          <FiMapPin className="flex-shrink-0" size={14} />
                          <span>{job.location}</span>
                        </div>
                        <span className="text-xs text-gray-500">{job.postedTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

