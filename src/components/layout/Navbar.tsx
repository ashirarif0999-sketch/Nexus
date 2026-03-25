import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Bell, MessageCircle, User, LogOut, Building2, CircleDollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarCollapsed = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  };
  
  // User dashboard route based on role
  const dashboardRoute = user?.role === 'entrepreneur' 
    ? '/dashboard/entrepreneur' 
    : '/dashboard/investor';
  
  // User profile route based on role and ID
  const profileRoute = user 
    ? `/profile/${user.role}/${user.id}` 
    : '/login';
  
  const navLinks = [
    {
      icon: user?.role === 'entrepreneur' ? <Building2 size={18} /> : <CircleDollarSign size={18} />,
      text: 'Dashboard',
      path: dashboardRoute,
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? '/messages' : '/login',
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? '/notifications' : '/login',
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
          {/* Logo and brand */}
          <div className="navbar-logo flex-shrink-0 flex items-center">
            <button
              onClick={onToggleSidebar}
              className="sidebar-toggle-btn mr-3 p-1.5 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-200"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <i className='bx bx-dock-right text-xl' />
              ) : (
                <i className='bx bx-dock-left text-xl' />
              )}
            </button>
            <Link to="/" className="navbar-brand-link flex items-center space-x-2">
              <img 
                src="/logo-nexus.png" 
                alt="Nexus Logo" 
                className="navbar-logo-image h-8 w-auto"
              />
            </Link>
          </div>
          
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
                
                <Link to={profileRoute} className="navbar-profile-link flex items-center space-x-2 ml-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                    className="navbar-avatar"
                  />
                  <span className="navbar-user-name text-sm font-medium text-gray-700">{user.name}</span>
                </Link>
              </div>
            ) : (
              <div className="navbar-auth-buttons flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="navbar-mobile-toggle md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="navbar-toggle-btn inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="navbar-toggle-icon block h-6 w-6" />
              ) : (
                <Menu className="navbar-toggle-icon block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="navbar-mobile-menu md:hidden bg-white border-b border-gray-200 animate-fade-in">
          <div className="navbar-mobile-content px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="navbar-mobile-user flex items-center space-x-3 px-3 py-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <div>
                    <p className="navbar-mobile-user-name text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="navbar-mobile-user-role text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="navbar-mobile-links border-t border-gray-200 pt-2">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      className="navbar-mobile-link flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="navbar-mobile-link-icon mr-3">{link.icon}</span>
                      <span className="navbar-mobile-link-text">{link.text}</span>
                    </Link>
                  ))}
                  
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(true);
                      setIsMenuOpen(false);
                    }}
                    className="navbar-mobile-logout flex w-full items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut size={18} className="navbar-mobile-logout-icon mr-3" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="navbar-mobile-auth flex flex-col space-y-2 px-3 py-2">
                <Link 
                  to="/login" 
                  className="navbar-mobile-login-link w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" fullWidth>Log in</Button>
                </Link>
                <Link 
                  to="/register" 
                  className="navbar-mobile-register-link w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button fullWidth>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
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
};