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
import AdminAccounts_Admin from "./pages/admin/AdminAccounts_Admin";
import UserRoles_Admin from "./pages/admin/UserRoles_Admin";
import RoleManagement_Admin from "./pages/admin/RoleManagement_Admin";
import GroupData_Admin from "./pages/admin/GroupData_Admin";
import SMTPSettings_Admin from "./pages/admin/SMTPSettings_Admin";
import MessageSettings_Admin from "./pages/admin/MessageSettings_Admin";
import UserAdditionalFields_Admin from "./pages/admin/UserAdditionalFields_Admin";
import CompanyAdditionalFields_Admin from "./pages/admin/CompanyAdditionalFields_Admin";
import MembershipPlans_Admin from "./pages/admin/MembershipPlans_Admin";
import DocumentType_Admin from "./pages/admin/DocumentType_Admin";
import Resume_Admin from "./pages/admin/Resume_Admin";
import MasterSettings_Admin from "./pages/admin/MasterSettings_Admin";

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

// Context Providers
import { DashboardProvider } from "./context/DashboardContext";

// Authentication hook
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole") || "user";
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole") || "user";
      console.log('Auth check - Token:', !!token, 'Role:', role);
      setIsAuthenticated(!!token);
      setUserRole(role);
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

  return { isAuthenticated, userRole };
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole = "user" }) {
  const { isAuthenticated, userRole } = useAuth();
  
  console.log('ProtectedRoute - Required role:', requiredRole, 'User role:', userRole, 'Authenticated:', isAuthenticated);
  
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
  const { isAuthenticated, userRole } = useAuth();

  return (
    <DashboardProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
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
                  <Route path="admin-accounts" element={<AdminAccounts_Admin />} />
                  <Route path="user-roles" element={<UserRoles_Admin />} />
                  <Route path="role-management" element={<RoleManagement_Admin />} />
                  <Route path="group-data" element={<GroupData_Admin />} />
                  <Route path="smtp-settings" element={<SMTPSettings_Admin />} />
                  <Route path="message-settings" element={<MessageSettings_Admin />} />
                  <Route path="user-additional-fields" element={<UserAdditionalFields_Admin />} />
                  <Route path="company-additional-fields" element={<CompanyAdditionalFields_Admin />} />
                  <Route path="membership-plans" element={<MembershipPlans_Admin />} />
                  <Route path="document-type" element={<DocumentType_Admin />} />
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
                  <Route path="enquiry" element={<Enquiry_User />} />
                  <Route path="enquiry-received" element={<EnquiryReceived_User />} />
                  <Route path="enquiries-done" element={<EnquiriesDone_User />} />
                  <Route path="product-services" element={<ProductServices_User />} />
                  <Route path="ptfi-members" element={<PTFIMembers_User />} />
                  <Route path="important-contacts" element={<ImportantContacts_User />} />
                  <Route path="group-data" element={<GroupData_User />} />
                  <Route path="user-additional-fields" element={<UserAdditionalFields_User />} />
                  <Route path="resume" element={<Resume_User />} />
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
  );
}

export default App;

