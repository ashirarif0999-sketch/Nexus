import React, { useState, useEffect, memo } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GuidedTour } from '../ui/GuidedTour';
import { ROUTES } from '../../config/routes';

export const DashboardLayout: React.FC = memo(() => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showTour, setShowTour] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleToggleDock = () => {
    setSidebarExpanded(prev => !prev);
  };

  useEffect(() => {
    // Show tour for first-time users (simulated by checking localStorage)
    const hasSeenTour = localStorage.getItem('hasSeenGuidedTour');
    if (isAuthenticated && user && !hasSeenTour) {
      setShowTour(true);
    }
  }, [isAuthenticated, user]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenGuidedTour', 'true');
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading min-h-screen flex items-center justify-center">
        <div className="dashboard-spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }
  
  return (
    <div className="dashboard-layout min-h-screen bg-gray-50 flex overflow-y-auto">
      <Sidebar isExpanded={sidebarExpanded} onExpandChange={setSidebarExpanded} />

      <div className="dashboard-content flex-1 flex flex-col">
        <Navbar onToggleDock={handleToggleDock} />

        <main className={`dashboard-main flex-1 ${sidebarExpanded ? 'dock-expanded' : ''} ${location.pathname === ROUTES.CALENDAR ? (sidebarExpanded ? 'calendar-expanded' : 'no-padding') : 'p-6'}`}>
          <div className={`dashboard-main-content ${location.pathname === ROUTES.CALENDAR ? 'w-full' : 'max-w-7xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <GuidedTour run={showTour} onComplete={handleTourComplete} />
    </div>
  );
});
