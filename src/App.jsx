import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Shared Components
import Login from "./pages/shared/Login";
import VisitingCardShare from "./pages/shared/VisitingCardShare";
import FastPreloader from "./components/user/FastPreloader/FastPreloader";

// Admin Pages
import Dashboard_Admin from "./pages/admin/Dashboard_Admin";
import AllEvents_Admin from "./pages/admin/AllEvents_Admin";
import MemberDetail_Admin from "./pages/admin/MemberDetail_Admin";
import Calendar_Admin from "./pages/admin/Calendar_Admin";
import PastEvents_Admin from "./pages/admin/PastEvents_Admin";
import UpcomingEventsPage_Admin from "./pages/admin/UpcomingEventsPage_Admin";
import ActiveMembers_Admin from "./pages/admin/ActiveMembers_Admin";
import InactiveMembers_Admin from "./pages/admin/InactiveMembers_Admin";
import PendingApproval_Admin from "./pages/admin/PendingApproval_Admin";
import MembershipExpired_Admin from "./pages/admin/MembershipExpired_Admin";
import NewRegistration_Admin from "./pages/admin/NewRegistration_Admin";
import PaymentDetails_Admin from "./pages/admin/PaymentDetails_Admin";
import Attendance_Admin from "./pages/admin/Attendance_Admin";
import AttendanceList_Admin from "./pages/admin/AttendanceList_Admin";
import Circulars_Admin from "./pages/admin/Circulars_Admin";
import Feedbacks_Admin from "./pages/admin/Feedbacks_Admin";
import GrievancesActive_Admin from "./pages/admin/GrievancesActive_Admin";
import GrievancesPending_Admin from "./pages/admin/GrievancesPending_Admin";
import GrievancesClosed_Admin from "./pages/admin/GrievancesClosed_Admin";
import ImportantContacts_Admin from "./pages/admin/ImportantContacts_Admin";
import PostJob_Admin from "./pages/admin/PostJob_Admin";
import PublicJob_Admin from "./pages/admin/PublicJob_Admin";
import JobApplicants_Admin from "./pages/admin/JobApplicants_Admin";
import PostJob_User from "./pages/user/PostJob_User";
import PublicJob_User from "./pages/user/PublicJob_User";
import JobApplicants_User from "./pages/user/JobApplicants_User";
import AdminAccounts_Admin from "./pages/admin/AdminAccounts_Admin";
import UserRoles_Admin from "./pages/admin/UserRoles_Admin";
import RoleManagement_Admin from "./pages/admin/RoleManagement_Admin";
import GroupData_Admin from "./pages/admin/GroupData_Admin";
import SMTPSettings_Admin from "./pages/admin/SMTPSettings_Admin";
import MessageSettings_Admin from "./pages/admin/MessageSettings_Admin";
import PaymentSettings_Admin from "./pages/admin/PaymentSettings_Admin";
import UserAdditionalFields_Admin from "./pages/admin/UserAdditionalFields_Admin";
import CompanyAdditionalFields_Admin from "./pages/admin/CompanyAdditionalFields_Admin";
import MembershipPlans_Admin from "./pages/admin/MembershipPlans_Admin";
import DocumentType_Admin from "./pages/admin/DocumentType_Admin";
import Resume_Admin from "./pages/admin/Resume_Admin";
import MasterSettings_Admin from "./pages/admin/MasterSettings_Admin";
import EVisitingCard_Admin from "./pages/admin/EVisitingCard_Admin";
import MembershipCertificateSettings_Admin from "./pages/admin/MembershipCertificateSettings_Admin";

// User Pages
import Dashboard_User from "./pages/user/Dashboard_User";
import AllEvents_User from "./pages/user/AllEvents_User";
import MemberDetail_User from "./pages/user/MemberDetail_User";
import Calendar_User from "./pages/user/Calendar_User";
import PastEvents_User from "./pages/user/PastEvents_User";
import UpcomingEventsPage_User from "./pages/user/UpcomingEventsPage_User";
import Circular_User from "./pages/user/Circular_User";
import Feedback_User from "./pages/user/Feedback_User";
import Grievance_User from "./pages/user/Grievance_User";
import Enquiry_User from "./pages/user/Enquiry_User";
import EnquiryReceived_User from "./pages/user/EnquiryReceived_User";
import EnquiriesDone_User from "./pages/user/EnquiriesDone_User";
import ProductServices_User from "./pages/user/ProductServices_User";
import PTFIMembers_User from "./pages/user/PTFIMembers_User";
import ImportantContacts_User from "./pages/user/ImportantContacts_User";
import GroupData_User from "./pages/user/GroupData_User";
import UserAdditionalFields_User from "./pages/user/UserAdditionalFields_User";
import Resume_User from "./pages/user/Resume_User";
import SearchResult_User from "./pages/user/SearchResult_User";

// Context Providers
import { DashboardProvider } from "./context/DashboardContext";
import { PermissionProvider } from "./context/PermissionContext";

// Authentication hook
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [userRoleId, setUserRoleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole") || "user";
      const roleId = localStorage.getItem("user_role_id");
      
      console.log('Auth check - Token:', !!token, 'Role:', role, 'Role ID:', roleId);
      
      if (!token) {
        console.log('No token found, user not authenticated');
        setIsAuthenticated(false);
        setUserRole("user");
        setUserRoleId(null);
        setIsLoading(false);
        return;
      }

      // Determine role based on user_role_id: if user_role_id !== 2, they can access admin pages
      let finalRole = role;
      if (roleId && roleId !== '2') {
        finalRole = 'admin';
      } else if (roleId === '2') {
        finalRole = 'user';
      }

      // For now, assume token is valid if it exists
      // In a production app, you might want to validate the token with the server
      setIsAuthenticated(true);
      setUserRole(finalRole);
      setUserRoleId(roleId);
      setIsLoading(false);
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', checkAuth);
    
    // Also listen for custom events for better sync
    const handleAuthChange = () => checkAuth();
    window.addEventListener('login', handleAuthChange);
    window.addEventListener('logout', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('login', handleAuthChange);
      window.removeEventListener('logout', handleAuthChange);
    };
  }, []);

  return { isAuthenticated, userRole, userRoleId, isLoading };
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole = "user" }) {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
  console.log('ProtectedRoute - Required role:', requiredRole, 'User role:', userRole, 'Authenticated:', isAuthenticated, 'Loading:', isLoading);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <FastPreloader />;
  }
  
  if (!isAuthenticated) {
    console.log('Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }

  // Strict role-based access control
  if (requiredRole === "admin" && userRole !== "admin") {
    // Non-admin user trying to access admin route
    console.log('Redirecting to user dashboard - non-admin trying to access admin route');
    return <Navigate to="/user/dashboard" replace />;
  }
  
  if (requiredRole === "user" && userRole === "admin") {
    // Admin user trying to access user route - redirect to admin dashboard
    console.log('Redirecting to admin dashboard - admin trying to access user route');
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  console.log('Access granted to route');
  return children;
}



function App() {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // Auto-logout when tab/window is closed for security
  useEffect(() => {
    // Only set up auto-logout if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    const handleBeforeUnload = (e) => {
      // Clear authentication data when tab is closed
      const token = localStorage.getItem('token');
      if (token) {
        // Clear all auth data synchronously
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('uid');
        
        // Dispatch logout event to notify other components
        // Note: This might not always fire due to browser limitations
        try {
          window.dispatchEvent(new Event('logout'));
        } catch (err) {
          // Ignore errors if event dispatch fails
        }
      }
    };

    const handlePageHide = (e) => {
      // This event is more reliable for detecting tab close
      const token = localStorage.getItem('token');
      if (token) {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('uid');
        
        // Dispatch logout event
        try {
          window.dispatchEvent(new Event('logout'));
        } catch (err) {
          // Ignore errors if event dispatch fails
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <FastPreloader />;
  }

  return (
    <PermissionProvider>
    <DashboardProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/share/visiting-card/:encodedData" element={<VisitingCardShare />} />
          
          {/* Root Route - Redirect based on user role */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                userRole === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/user/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Dashboard Route - Redirect based on role */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                userRole === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/user/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <Routes>
                  <Route path="dashboard" element={<Dashboard_Admin />} />
                  <Route path="all-events" element={<AllEvents_Admin />} />
                  <Route path="member-detail/:memberId" element={<MemberDetail_Admin />} />
                  <Route path="calendar" element={<Calendar_Admin />} />
                  <Route path="past-events" element={<PastEvents_Admin />} />
                  <Route path="upcoming-events" element={<UpcomingEventsPage_Admin />} />
                  <Route path="active-members" element={<ActiveMembers_Admin />} />
                  <Route path="inactive-members" element={<InactiveMembers_Admin />} />
                  <Route path="pending-approval" element={<PendingApproval_Admin />} />
                  <Route path="membership-expired" element={<MembershipExpired_Admin />} />
                  <Route path="new-registration" element={<NewRegistration_Admin />} />
                  <Route path="payment-details" element={<PaymentDetails_Admin />} />
                  <Route path="attendance" element={<Attendance_Admin />} />
                  <Route path="attendance-list" element={<AttendanceList_Admin />} />
                  <Route path="circulars" element={<Circulars_Admin />} />
                  <Route path="feedbacks" element={<Feedbacks_Admin />} />
                  <Route path="grievances-active" element={<GrievancesActive_Admin />} />
                  <Route path="grievances-pending" element={<GrievancesPending_Admin />} />
                  <Route path="grievances-closed" element={<GrievancesClosed_Admin />} />
                  <Route path="important-contacts" element={<ImportantContacts_Admin />} />
                  <Route path="post-job" element={<PostJob_Admin />} />
                  <Route path="public-job" element={<PublicJob_Admin />} />
                  <Route path="job-applicants" element={<JobApplicants_Admin />} />
                  <Route path="admin-accounts" element={<AdminAccounts_Admin />} />
                  <Route path="user-roles" element={<UserRoles_Admin />} />
                  <Route path="role-management" element={<RoleManagement_Admin />} />
                  <Route path="group-data" element={<GroupData_Admin />} />
                  <Route path="smtp-settings" element={<SMTPSettings_Admin />} />
                  <Route path="message-settings" element={<MessageSettings_Admin />} />
                  <Route path="payment-settings" element={<PaymentSettings_Admin />} />
                  <Route path="user-additional-fields" element={<UserAdditionalFields_Admin />} />
                  <Route path="company-additional-fields" element={<CompanyAdditionalFields_Admin />} />
                  <Route path="membership-plans" element={<MembershipPlans_Admin />} />
                  <Route path="document-type" element={<DocumentType_Admin />} />
                  <Route path="e-visiting-card" element={<EVisitingCard_Admin />} />
                  <Route path="membership-certificate" element={<MembershipCertificateSettings_Admin />} />
                  <Route path="resume" element={<Resume_Admin />} />
                  <Route path="master-settings" element={<MasterSettings_Admin />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/user/*"
            element={
              <ProtectedRoute requiredRole="user">
                <Routes>
                  <Route path="dashboard" element={<Dashboard_User />} />
                  <Route path="all-events" element={<AllEvents_User />} />
                  <Route path="member-detail/:memberId" element={<MemberDetail_User />} />
                  <Route path="calendar" element={<Calendar_User />} />
                  <Route path="past-events" element={<PastEvents_User />} />
                  <Route path="upcoming-events" element={<UpcomingEventsPage_User />} />
                  <Route path="circular" element={<Circular_User />} />
                  <Route path="feedback" element={<Feedback_User />} />
                  <Route path="grievance" element={<Grievance_User />} />
                  <Route path="post-job" element={<PostJob_User />} />
                  <Route path="public-job" element={<PublicJob_User />} />
                  <Route path="job-applicants" element={<JobApplicants_User />} />
                  <Route path="enquiry" element={<Enquiry_User />} />
                  <Route path="enquiry-received" element={<EnquiryReceived_User />} />
                  <Route path="enquiries-done" element={<EnquiriesDone_User />} />
                  <Route path="product-services" element={<ProductServices_User />} />
                  <Route path="ptfi-members" element={<PTFIMembers_User />} />
                  <Route path="important-contacts" element={<ImportantContacts_User />} />
                  <Route path="group-data" element={<GroupData_User />} />
                  <Route path="user-additional-fields" element={<UserAdditionalFields_User />} />
                  <Route path="resume" element={<Resume_User />} />
                  <Route path="search-results" element={<SearchResult_User />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </DashboardProvider>
    </PermissionProvider>
  );
}

export default App;

