import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import FAQPage from './pages/public/FAQPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import OTPPage from './pages/auth/OTPPage';
import AdvancedAuthPage from './pages/auth/AdvancedAuthPage';
import PatternAuthPage from './pages/auth/PatternAuthPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboardAllStudents';
import StudentEditMode from './pages/admin/StudentEditMode';
import DebugAuth from './components/DebugAuth';

// Dashboard & Chatbot
import DashboardPage from './pages/dashboard/DashboardPage';

// Academic Monitoring
import AttendanceOverviewPage from './pages/attendance/AttendanceOverviewPage';
import HistoricalAttendancePage from './pages/attendance/HistoricalAttendancePage';

// Academic Status
import AcademicStatusPage from './pages/academics/AcademicStatusPage';
import PerformancePage from './pages/academics/PerformancePage';

// Finance
import FeesPage from './pages/finance/FeesPage';

// Notifications
import NotificationsCalendarPage from './pages/notifications/NotificationsCalendarPage';

// Insights & Support
import PerformanceInsightsPage from './pages/insights/PerformanceInsightsPage';
import ContactsPage from './pages/support/ContactsPage';

// Settings
import AccountSettingsPage from './pages/settings/AccountSettingsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_token');
  };

  // A simple mock for session checking
  useEffect(() => {
    const session = localStorage.getItem('parent_session');
    if (session) {
      setIsAuthenticated(true);
    }
    
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAdminAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/verify-otp" element={<OTPPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/advanced-auth" element={<AdvancedAuthPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/pattern-auth" element={<PatternAuthPage setIsAuthenticated={setIsAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated} />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage setIsAdminAuthenticated={setIsAdminAuthenticated} />} />
        <Route element={<AdminLayout onLogout={handleAdminLogout} />}>
          <Route 
            path="/admin/dashboard"
            element={
              <>
                <DebugAuth isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated} />
                {(() => {
                  console.log('Route protection check - isAdminAuthenticated:', isAdminAuthenticated);
                  console.log('Route protection check - admin_token:', localStorage.getItem('admin_token'));
                  if (isAdminAuthenticated) {
                    console.log('Rendering AdminDashboard');
                    return <AdminDashboard onAdminLogout={handleAdminLogout} />;
                  } else {
                    console.log('Redirecting to admin login');
                    return <Navigate to="/admin/login" replace />;
                  }
                })()}
              </>
            }
          />
          <Route 
            path="/admin/students/:regdNo" 
            element={isAdminAuthenticated ? <StudentEditMode /> : <Navigate to="/admin/login" replace />} 
          />
        </Route>

        {/* Protected Routes */}
        <Route element={isAuthenticated ? <MainLayout onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendanceOverviewPage />} />
          <Route path="/attendance/history" element={<HistoricalAttendancePage />} />
          <Route path="/academics/status" element={<AcademicStatusPage />} />
          <Route path="/academics/performance" element={<PerformancePage />} />
          <Route path="/finance/fees" element={<FeesPage />} />
          <Route path="/notifications" element={<NotificationsCalendarPage />} />
          <Route path="/insights" element={<PerformanceInsightsPage />} />
          <Route path="/support/contacts" element={<ContactsPage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
