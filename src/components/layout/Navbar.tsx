import React, { useState, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlignJustify, Bell, MessageCircle, User, LogOut, Building2, CircleDollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ROUTES } from '../../config/routes';

interface NavbarProps {
  onToggleDock?: () => void;
}

export const Navbar: React.FC<NavbarProps> = memo(({ onToggleDock }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    logout();
    navigate(ROUTES.AUTH.LOGIN);
    setShowLogoutConfirm(false);
  };
  
  // User dashboard route based on role
  const dashboardRoute = user?.role === 'entrepreneur' 
    ? ROUTES.DASHBOARD.ENTREPRENEUR 
    : ROUTES.DASHBOARD.INVESTOR;
  
  // User profile route based on role and ID
  const profileRoute = user
    ? (user.role === 'entrepreneur'
        ? ROUTES.PROFILE.ENTREPRENEUR(user.id)
        : ROUTES.PROFILE.INVESTOR(user.id))
    : ROUTES.AUTH.LOGIN;
  
  const navLinks = [
    {
      icon: user?.role === 'entrepreneur' ? <Building2 size={18} /> : <CircleDollarSign size={18} />,
      text: 'Dashboard',
      path: dashboardRoute,
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? ROUTES.MESSAGES : ROUTES.AUTH.LOGIN,
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? ROUTES.NOTIFICATIONS : ROUTES.AUTH.LOGIN,
    },
    {
      icon: <User size={18} />,
      text: 'Profile',
      path: profileRoute,
    }
  ];
  
  return (
    <>
      <nav className="navbar bg-white shadow-md">
      <div className="navbar-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navbar-content flex justify-between h-16">
          {/* Sidebar toggle button (acts as logo button to toggle dock) */}
          <button
            onClick={onToggleDock}
            className="navbar-sidebar-toggle flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <AlignJustify className="navbar-sidebar-toggle-icon block h-6 w-6" />
          </button>
          
         
          
          {/* Desktop navigation */}
          <div className="navbar-desktop hidden md:flex md:items-center md:ml-6">
            {user ? (
              <div className="navbar-user-menu flex items-center space-x-4">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="navbar-nav-link inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    <span className="navbar-nav-icon mr-2">{link.icon}</span>
                    <span className="navbar-nav-text">{link.text}</span>
                  </Link>
                ))}
                
                <Button 
                  variant="ghost"
                  onClick={handleLogout}
                  leftIcon={<LogOut size={18} />}
                  className="navbar-logout-btn"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="navbar-auth-buttons flex items-center space-x-4">
                <Link to={ROUTES.AUTH.LOGIN}>
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link to={ROUTES.AUTH.REGISTER}>
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Avatar button at flex end */}
          <div className="navbar-avatar-button flex items-center">
            {user ? (
              <Link to={profileRoute} className="navbar-profile-link flex items-center space-x-2">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  size="lg"
                  status={user.isOnline ? 'online' : 'offline'}
                  className="navbar-avatar"
                />
              </Link>
            ) : (
              <Link to={ROUTES.AUTH.LOGIN}>
                <Avatar
                  src=""
                  alt="Login"
                  size="lg"
                  className="navbar-avatar-guest"
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
      
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        type="danger"
      />
    </>
  );
});