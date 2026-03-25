import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GuidedTour } from '../ui/GuidedTour';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  if (isLoading) {
    return (
      <div className="dashboard-loading min-h-screen flex items-center justify-center">
        <div className="dashboard-spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="dashboard-layout min-h-screen bg-gray-50 flex flex-col">
      <Navbar onToggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />

      <div className="dashboard-content flex-1 relative">
        {/* Blur overlay behind sidebar */}
        <div 
          className={`sidebar-overlay ${!isSidebarCollapsed ? 'visible' : ''}`}
          onClick={toggleSidebar}
        />
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <main className="dashboard-main absolute top-16 right-0 bottom-0 left-0 p-6 overflow-y-auto">
          <div className="dashboard-main-content max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <GuidedTour run={showTour} onComplete={handleTourComplete} />
    </div>
  );
};
