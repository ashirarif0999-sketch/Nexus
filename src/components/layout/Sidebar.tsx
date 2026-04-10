import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ROUTES } from '../../config/routes';
import {
  Home, Building2, CircleDollarSign, Users, MessageCircle,
  Bell, FileText, Settings, HelpCircle, Calendar, Video,
  LogOut, Search, UserCircle, Mail, ChevronRight, Menu, Check
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  icon: React.ReactNode;
  text: string;
  badge?: number;
}

interface SidebarProps {
  onExpandChange?: (expanded: boolean) => void;
  isExpanded?: boolean;
  onCollapse?: () => void;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = memo(({ label, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="dock-tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <div className={`dock-tooltip ${visible ? 'dock-tooltip--visible' : ''}`}>
        {label}
      </div>
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

// ─── Dock Nav Item ─────────────────────────────────────────────────────────────

const DockItem: React.FC<NavItem & { isExpanded: boolean; onCollapse?: () => void }> = memo(({ to, icon, text, badge, isExpanded, onCollapse }) => {
  const handleClick = () => {
    // Collapse dock on mobile screens (< 950px) when item is clicked
    if (window.matchMedia('(max-width: 950px)').matches) {
      onCollapse?.();
    }
  };

  const content = (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        `dock-item ${isActive ? 'dock-item--active' : ''} ${isExpanded ? 'dock-item--expanded' : ''}`
      }
    >
      <span className="dock-item__icon">
        {icon}
        {badge ? <span className="dock-item__badge">{badge > 99 ? '99+' : badge}</span> : null}
      </span>
      {isExpanded && <span className="dock-item__text">{text}</span>}
    </NavLink>
  );

  return isExpanded ? content : <Tooltip label={text}>{content}</Tooltip>;
});

DockItem.displayName = 'DockItem';

// ─── Account Dropdown ──────────────────────────────────────────────────────────

interface AccountMenuProps {
  user: { name: string; avatarUrl?: string; role: string; isOnline?: boolean };
  onLogout: () => void;
  isExpanded?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = memo(({ user, onLogout, isExpanded = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Memoize avatar URL to avoid recalculation on every render
  const avatarUrl = useMemo(() => 
    user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`,
    [user.avatarUrl, user.name]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Use passive listener for better scroll performance and debounce
    document.addEventListener('mousedown', handler, { passive: true });
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="dock-account">
      {isExpanded ? (
        <button className="dock-item dock-item--expanded" onClick={() => setOpen(o => !o)}>
          <span className="dock-item__icon">
            <Avatar
              src={avatarUrl}
              alt={user.name || 'User'}
              size="sm"
              status={user.isOnline ? 'online' : 'offline'}
            />
          </span>
          <span className="dock-item__text">{user.name || 'User'}</span>
        </button>
      ) : (
        <Tooltip label={user.name || 'User'}>
          <button className="dock-avatar-btn" onClick={() => setOpen(o => !o)}>
            <Avatar
              src={avatarUrl}
              alt={user.name || 'User'}
              size="sm"
              status={user.isOnline ? 'online' : 'offline'}
            />
          </button>
        </Tooltip>
      )}

      <div className={`dock-account__menu ${open ? 'dock-account__menu--open' : ''}`}>
        {/* Signed-in header */}
        <div className="dock-account__header">
          <span className="dock-account__signed-label">SIGNED IN AS</span>
          <div className="dock-account__user">
            <Avatar src={avatarUrl} alt={user.name || 'User'} size="sm" />
            <div>
              <p className="dock-account__name">{user.name || 'User'}</p>
              <p className="dock-account__role">{user.role || 'Unknown'}</p>
            </div>
            <Check strokeWidth={1.25} className="dock-account__chevron"/>
          </div>
        </div>

        <div className="dock-account__divider" />

        <button
          className="dock-account__item"
          onClick={() => { navigate(ROUTES.SETTINGS); setOpen(false); }}
        >
          <Settings size={15} />
          Account settings
        </button>
        <button
          className="dock-account__item"
          onClick={() => { navigate(ROUTES.HELP); setOpen(false); }}
        >
          <HelpCircle size={15} />
          Help center
        </button>
        <a
          href="mailto:support@businessnexus.com"
          className="dock-account__item"
          onClick={() => setOpen(false)}
        >
          <Mail size={15} />
          Contact support
        </a>

        <div className="dock-account__divider" />

        <button
          className="dock-account__item dock-account__item--danger"
          onClick={() => { onLogout(); setOpen(false); }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
});

AccountMenu.displayName = 'AccountMenu';

// ─── Main Sidebar ──────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = memo(({ onExpandChange, isExpanded: controlledExpanded }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use controlled value if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  // Call the expand change callback when state changes
  const handleExpandChange = React.useCallback((expanded: boolean) => {
    setInternalExpanded(expanded);
    onExpandChange?.(expanded);
  }, [onExpandChange]);
  
  // Toggle handler for the dock button - memoized to prevent unnecessary re-renders
  const handleToggle = React.useCallback(() => {
    handleExpandChange(!isExpanded);
  }, [isExpanded, handleExpandChange]);

  if (!user) return null;

  // Memoize nav items arrays to avoid recreation on every render
  const entrepreneurItems = useMemo<NavItem[]>(() => [
    { to: ROUTES.DASHBOARD.ENTREPRENEUR, icon: <Home size={20} />, text: 'Dashboard' },
    { to: ROUTES.PROFILE.ENTREPRENEUR(user.id), icon: <Building2 size={20} />, text: 'My Startup' },
    { to: ROUTES.INVESTORS, icon: <CircleDollarSign size={20} />, text: 'Find Investors' },
    { to: ROUTES.CALENDAR, icon: <Calendar size={20} />, text: 'Calendar' },
    { to: ROUTES.VIDEO.ROOT, icon: <Video size={20} />, text: 'Video Calls' },
    { to: ROUTES.MESSAGES, icon: <MessageCircle size={20} />, text: 'Messages' },
    { to: ROUTES.NOTIFICATIONS, icon: <Bell size={20} />, text: 'Notifications' },
    { to: ROUTES.DOCUMENTS, icon: <FileText size={20} />, text: 'Documents' },
  ], [user.id]);

  const investorItems = useMemo<NavItem[]>(() => [
    { to: ROUTES.DASHBOARD.INVESTOR, icon: <Home size={20} />, text: 'Dashboard' },
    { to: ROUTES.PROFILE.INVESTOR(user.id), icon: <CircleDollarSign size={20} />, text: 'My Portfolio' },
    { to: ROUTES.ENTREPRENEURS, icon: <Users size={20} />, text: 'Find Startups' },
    { to: ROUTES.CALENDAR, icon: <Calendar size={20} />, text: 'Calendar' },
    { to: ROUTES.VIDEO.ROOT, icon: <Video size={20} />, text: 'Video Calls' },
    { to: ROUTES.MESSAGES, icon: <MessageCircle size={20} />, text: 'Messages' },
    { to: ROUTES.NOTIFICATIONS, icon: <Bell size={20} />, text: 'Notifications' },
    { to: ROUTES.DEALS, icon: <FileText size={20} />, text: 'Deals' },
  ], [user.id]);

  const navItems = useMemo(() => 
    user.role === 'entrepreneur' ? entrepreneurItems : investorItems,
    [user.role, entrepreneurItems, investorItems]
  );

  return (
    <>
      <aside className={`dock ${isExpanded ? 'dock--expanded' : ''}`}>
        {/* Hamburger toggle */}
        <div className="dock__header">
          <div className="dock-toggle dock-toggle-wrapper"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
          <button
            className="dock-toggle-btn"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={20} />
          </button>
          <img
                src="/images/logo-nexus-inverted.avif"
                alt="Nexus Logo"
                className="dock-logo-image h-[20px] w-auto"
              />
          </div>
        </div>

        {/* Top: Logo mark or brand dot — optional */}
        <div className="dock__top">
          {/* Main nav items */}
          <nav className="dock__nav">
            {navItems.map((item, i) => (
              <DockItem 
                key={item.to} 
                {...item} 
                isExpanded={isExpanded} 
                onCollapse={() => handleExpandChange(false)} 
              />
            ))}
          </nav>
        </div>

        {/* Bottom: search + settings + avatar */}
        <div className="dock__bottom">
          {isExpanded ? (
            <button
              className="dock-item dock-item--expanded"
              onClick={() => {/* wire to your search modal */ }}
            >
              <span className="dock-item__icon">
                <Search size={20} />
              </span>
              <span className="dock-item__text">Search</span>
            </button>
          ) : (
            <Tooltip label="Search  ⌘K">
              <button
                className="dock-item"
                onClick={() => {/* wire to your search modal */ }}
              >
                <Search size={20} />
              </button>
            </Tooltip>
          )}

          {isExpanded ? (
            <NavLink
              to={ROUTES.SETTINGS}
              className={({ isActive }) => `dock-item dock-item--expanded ${isActive ? 'dock-item--active' : ''}`}
            >
              <span className="dock-item__icon">
                <Settings size={20} />
              </span>
              <span className="dock-item__text">Settings</span>
            </NavLink>
          ) : (
            <Tooltip label="Settings">
              <NavLink
                to={ROUTES.SETTINGS}
                className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
              >
                <Settings size={20} />
              </NavLink>
            </Tooltip>
          )}

          <AccountMenu
            user={user}
            onLogout={() => setShowLogoutConfirm(true)}
            isExpanded={isExpanded}
          />
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out? You will need to log in again to access your account."
        confirmText="Sign out"
        cancelText="Cancel"
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
          navigate(ROUTES.AUTH.LOGIN);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        type="danger"
      />
    </>
  );
});