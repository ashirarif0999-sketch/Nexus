import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { Avatar } from '../ui/Avatar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Home, Building2, CircleDollarSign, Users, MessageCircle,
  Bell, FileText, Settings, HelpCircle, Calendar, Video, LogOut
} from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  className?: string;
}

interface SidebarProps {
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text, className }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'sidebar-item flex items-center py-2.5 px-4 rounded-md transition-colors duration-200',
          className,
          isActive
            ? 'sidebar-item-active bg-primary-50 text-primary-700'
            : 'sidebar-item-inactive text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      <span className="sidebar-item-icon mr-3">{icon}</span>
      <span className="sidebar-item-text text-sm font-medium">{text}</span>
    </NavLink>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  if (!user) return null;
  
  // Define sidebar items based on user role
  const entrepreneurItems = [
    { to: '/dashboard/entrepreneur', icon: <Home size={20} />, text: 'Dashboard', className: '' },
    { to: '/profile/entrepreneur/' + user.id, icon: <Building2 size={20} />, text: 'My Startup', className: '' },
    { to: '/investors', icon: <CircleDollarSign size={20} />, text: 'Find Investors', className: 'sidebar-investors' },
    { to: '/calendar', icon: <Calendar size={20} />, text: 'Calendar', className: 'sidebar-calendar' },
    { to: '/video', icon: <Video size={20} />, text: 'Video Calls', className: 'sidebar-video' },
    { to: '/messages', icon: <MessageCircle size={20} />, text: 'Messages', className: '' },
    { to: '/notifications', icon: <Bell size={20} />, text: 'Notifications', className: '' },
    { to: '/documents', icon: <FileText size={20} />, text: 'Documents', className: 'sidebar-documents' },
  ];

  const investorItems = [
    { to: '/dashboard/investor', icon: <Home size={20} />, text: 'Dashboard', className: '' },
    { to: '/profile/investor/' + user.id, icon: <CircleDollarSign size={20} />, text: 'My Portfolio', className: '' },
    { to: '/entrepreneurs', icon: <Users size={20} />, text: 'Find Startups', className: 'sidebar-investors' },
    { to: '/calendar', icon: <Calendar size={20} />, text: 'Calendar', className: 'sidebar-calendar' },
    { to: '/video', icon: <Video size={20} />, text: 'Video Calls', className: 'sidebar-video' },
    { to: '/messages', icon: <MessageCircle size={20} />, text: 'Messages', className: '' },
    { to: '/notifications', icon: <Bell size={20} />, text: 'Notifications', className: '' },
    { to: '/deals', icon: <FileText size={20} />, text: 'Deals', className: '' },
  ];
  
  const sidebarItems = user.role === 'entrepreneur' ? entrepreneurItems : investorItems;
  
  // Common items at the bottom
  const commonItems = [
    { to: '/settings', icon: <Settings size={20} />, text: 'Settings', className: 'sidebar-settings' },
    { to: '/help', icon: <HelpCircle size={20} />, text: 'Help & Support', className: '' },
  ];
  
  return (
    <div className={`sidebar-container fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-30 ${isCollapsed ? 'collapsed w-0 overflow-hidden' : 'w-64'}`}>
      <div className="sidebar-content h-full flex flex-col">
        {/* User Profile Header */}
        <div className="sidebar-header p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Avatar
              src={user.avatarUrl}
              alt={user.name}
              size="lg"
              status={user.isOnline ? 'online' : 'offline'}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user.role}</p>
            </div>
          </div>
        </div>
        
        <div className="sidebar-main flex-1 py-4 overflow-y-auto">
          <div className="sidebar-items px-3 space-y-1">
            {sidebarItems.map((item, index) => (
              <SidebarItem
                key={index}
                to={item.to}
                icon={item.icon}
                text={item.text}
                className={item.className}
              />
            ))}
          </div>
          
          <div className="sidebar-settings mt-8 px-3">
            <h3 className="sidebar-settings-title px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h3>
            <div className="sidebar-settings-items mt-2 space-y-1">
              {commonItems.map((item, index) => (
                <SidebarItem
                  key={index}
                  to={item.to}
                  icon={item.icon}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="sidebar-footer p-4 border-t border-gray-200">
          <div className="sidebar-support bg-gray-50 rounded-md p-3">
            <p className="sidebar-support-text text-xs text-gray-600">Need assistance?</p>
            <h4 className="sidebar-support-title text-sm font-medium text-gray-900 mt-1">Contact Support</h4>
            <a 
              href="mailto:support@businessnexus.com" 
              className="sidebar-support-email mt-2 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500"
            >
              support@businessnexus.com
            </a>
          </div>
          <button 
            className="sidebar-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
        
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          title="Logout"
          message="Are you sure you want to logout? You will need to login again to access your account."
          confirmText="Logout"
          cancelText="Cancel"
          onConfirm={() => {
            logout();
            setShowLogoutConfirm(false);
            navigate('/login');
          }}
          onCancel={() => setShowLogoutConfirm(false)}
          type="danger"
        />
      </div>
    </div>
  );
};