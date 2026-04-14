import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import toast from 'react-hot-toast';

// Import centralized routes
import { ROUTES, ROOT_REDIRECT } from './config/routes';

// Layouts - Keep DashboardLayout eagerly loaded (required for most routes)
import { DashboardLayout } from './components/layout/DashboardLayout';

// Transition Wrapper with Barba.js and GSAP
import TransitionWrapper from './components/ui/TransitionWrapper';

// Check browser capabilities
const checkBrowserCapabilities = () => {
  const capabilities = {
    indexedDB: typeof window !== 'undefined' && !!window.indexedDB,
    localStorage: typeof window !== 'undefined' && !!window.localStorage,
  };

  if (!capabilities.indexedDB) {
    console.warn('⚠️ IndexedDB not available - data persistence will be limited to localStorage');
  }

  return capabilities;
};

// Auth Pages - Lazy load (heavy - 56KB with GSAP/OGL)
const AuthenticationPage = lazy(() => import('./pages/auth/AuthenticationPage').then(m => ({ default: m.AuthenticationPage })));

// Dashboard Pages - Lazy load
const EntrepreneurDashboard = lazy(() => import('./pages/dashboard/EntrepreneurDashboard').then(m => ({ default: m.EntrepreneurDashboard })));
const InvestorDashboard = lazy(() => import('./pages/dashboard/InvestorDashboard').then(m => ({ default: m.InvestorDashboard })));

// Profile Pages - Lazy load
const EntrepreneurProfile = lazy(() => import('./pages/profile/EntrepreneurProfile').then(m => ({ default: m.EntrepreneurProfile })));
const InvestorProfile = lazy(() => import('./pages/profile/InvestorProfile').then(m => ({ default: m.InvestorProfile })));
const CreateProfilePage = lazy(() => import('./pages/profile/CreateProfilePage').then(m => ({ default: m.CreateProfilePage })));

// Feature Pages - Lazy load
const InvestorsPage = lazy(() => import('./pages/investors/InvestorsPage').then(m => ({ default: m.InvestorsPage })));
const EntrepreneursPage = lazy(() => import('./pages/entrepreneurs/EntrepreneursPage').then(m => ({ default: m.EntrepreneursPage })));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const HelpPage = lazy(() => import('./pages/help/HelpPage').then(m => ({ default: m.HelpPage })));
const DealsPage = lazy(() => import('./pages/deals/DealsPage').then(m => ({ default: m.DealsPage })));



// Calendar Pages - Lazy load (heavy - FullCalendar)
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));

// Video Pages - Lazy load (heavy - WebRTC)
const VideoRoom = lazy(() => import('./pages/video/VideoRoom').then(m => ({ default: m.VideoRoom })));
const VideoMeetingsPage = lazy(() => import('./pages/video/VideoMeetingsPage').then(m => ({ default: m.VideoMeetingsPage })));

// External Redirect Component - Uses window.location to prevent React Router infinite loops
const ExternalRedirect: React.FC<{ to: string }> = ({ to }) => {
  React.useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
};



function App() {
  // Check browser capabilities on mount
  useEffect(() => {
    const capabilities = checkBrowserCapabilities();
    if (!capabilities.indexedDB) {
      // Show warning toast after a delay to not interfere with loading
      setTimeout(() => {
        toast.error('Browser storage limited - some features may not persist between sessions', {
          duration: 5000,
        });
      }, 2000);
    }
  }, []);

  return (
    <AuthProvider>
      <TransitionWrapper>
        <Router>
          <Suspense fallback={null}>
            <Routes>
            {/* Landing Page - External HTML - using window.location to prevent infinite loop */}
            <Route path={ROUTES.LANDING} element={<ExternalRedirect to="/landingpage.html" />} />
            {/* Authentication Routes */}
            <Route path={ROUTES.AUTH.LOGIN} element={<AuthenticationPage />} />
            <Route path={ROUTES.AUTH.REGISTER} element={<AuthenticationPage />} />
            <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<AuthenticationPage />} />
            <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<AuthenticationPage />} />

            {/* Dashboard Routes */}
            <Route path={ROUTES.DASHBOARD.ROOT} element={<DashboardLayout />}>
              <Route path="entrepreneur" element={<EntrepreneurDashboard />} />
              <Route path="investor" element={<InvestorDashboard />} />
            </Route>

            {/* Profile Routes */}
            <Route path={ROUTES.PROFILE.ROOT} element={<DashboardLayout />}>
              <Route path="entrepreneur/:id" element={<EntrepreneurProfile />} />
              <Route path="investor/:id" element={<InvestorProfile />} />
              <Route path="create/entrepreneur" element={<CreateProfilePage />} />
              <Route path="create/investor" element={<CreateProfilePage />} />
            </Route>

            {/* Feature Routes */}
            <Route path={ROUTES.INVESTORS} element={<DashboardLayout />}>
              <Route index element={<InvestorsPage />} />
            </Route>

            <Route path={ROUTES.ENTREPRENEURS} element={<DashboardLayout />}>
              <Route index element={<EntrepreneursPage />} />
            </Route>

            <Route path={ROUTES.MESSAGES} element={<DashboardLayout />}>
              <Route index element={<MessagesPage />} />
              <Route path=":contactId" element={<MessagesPage />} />
            </Route>

            <Route path={ROUTES.NOTIFICATIONS} element={<DashboardLayout />}>
              <Route index element={<NotificationsPage />} />
            </Route>

            <Route path={ROUTES.DOCUMENTS} element={<DashboardLayout />}>
              <Route index element={<DocumentsPage />} />
            </Route>

            <Route path={ROUTES.SETTINGS} element={<DashboardLayout />}>
              <Route index element={<SettingsPage />} />
            </Route>

            <Route path={ROUTES.HELP} element={<DashboardLayout />}>
              <Route index element={<HelpPage />} />
            </Route>

            <Route path={ROUTES.DEALS} element={<DashboardLayout />}>
              <Route index element={<DealsPage />} />
            </Route>

            {/* Calendar Routes */}
            <Route path={ROUTES.CALENDAR} element={<DashboardLayout />}>
              <Route index element={<CalendarPage />} />
            </Route>

            {/* Video Meetings Page - With dashboard layout */}
            <Route path={ROUTES.VIDEO.ROOT} element={<DashboardLayout />}>
              <Route index element={<VideoMeetingsPage />} />
            </Route>
            {/* Video Call Route - Full screen, no layout */}
            <Route path="/video/:roomId" element={<VideoRoom />} />

            {/* Chat Routes */}
            <Route path={ROUTES.CHAT.ROOT} element={<DashboardLayout />}>
              <Route index element={<MessagesPage />} />
              <Route path=":userId" element={<MessagesPage />} />
            </Route>

            {/* Redirect root to login */}
            <Route path={ROUTES.ROOT} element={<Navigate to={ROOT_REDIRECT} replace />} />

            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to={ROOT_REDIRECT} replace />} />
          </Routes>
        </Suspense>
      </Router>
      </TransitionWrapper>
    </AuthProvider>
  );
}

export default App;
