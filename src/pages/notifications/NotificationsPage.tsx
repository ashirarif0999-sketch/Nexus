import React, { useState, useMemo } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, X, Calendar, Mail, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './notifications.css';

interface NotificationDetail {
  message?: string;
  connectionStatus?: 'pending' | 'accepted' | 'declined';
  investmentInterest?: string;
  investmentAmount?: string;
  meetingDate?: string;
  meetingTime?: string;
  actionUrl?: string;
  additionalInfo?: string;
}

interface Notification {
  id: number;
  type: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  content: string;
  time: string;
  unread: boolean;
  details?: NotificationDetail;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: 'message',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Entrepreneur',
      company: 'TechWave AI',
      email: 'sarah@techwave.ai'
    },
    content: 'sent you a message about your startup',
    time: '5 minutes ago',
    unread: true,
    details: {
      message: "Hi! I came across your profile and I'm impressed by your work. I'm working on an AI-driven financial analytics platform and would love to discuss potential collaboration opportunities. Are you available for a call this week?",
      actionUrl: '/messages'
    }
  },
  {
    id: 2,
    type: 'connection',
    user: {
      name: 'Michael Rodriguez',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Investor',
      company: 'Venture Capital Partners',
      email: 'michael@vcpartners.com'
    },
    content: 'accepted your connection request',
    time: '2 hours ago',
    unread: true,
    details: {
      connectionStatus: 'accepted',
      additionalInfo: 'Michael Rodriguez is a Series A investor focused on B2B SaaS and fintech startups. He has invested in 12 companies in the past.'
    }
  },
  {
    id: 3,
    type: 'investment',
    user: {
      name: 'Jennifer Lee',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Investor',
      company: 'Green Ventures',
      email: 'jennifer@greenvc.com',
      phone: '+1 (555) 123-4567'
    },
    content: 'showed interest in investing in your startup',
    time: '1 day ago',
    unread: false,
    details: {
      investmentInterest: 'CleanTech, Sustainability, AgTech',
      investmentAmount: '$500K - $3M',
      additionalInfo: 'Jennifer is an impact investor focused on climate tech, sustainable agriculture, and clean energy. She specifically mentioned interest in your sustainable practices approach.'
    }
  },
  {
    id: 4,
    type: 'message',
    user: {
      name: 'Robert Torres',
      avatar: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Investor',
      company: 'HealthTech Ventures'
    },
    content: 'replied to your message about funding rounds',
    time: '3 hours ago',
    unread: true,
    details: {
      message: "Thanks for the update on your Series B plans! I'm particularly interested in the growth metrics you mentioned. Could you share more details about your customer acquisition cost and lifetime value? I'd love to schedule a follow-up call."
    }
  },
  {
    id: 5,
    type: 'connection',
    user: {
      name: 'Amanda Foster',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Angel Investor',
      company: 'WomenFund Ventures',
      email: 'amanda@womenfund.vc'
    },
    content: 'sent you a connection request',
    time: '5 hours ago',
    unread: true,
    details: {
      connectionStatus: 'pending',
      additionalInfo: 'Amanda is an advocate for women-led startups and partners at WomenFund Ventures. She invests in EdTech, HealthTech, and Women\'s Health sectors with amounts ranging from $50K - $500K.'
    }
  },
  {
    id: 6,
    type: 'investment',
    user: {
      name: 'David Martinez',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Investor',
      company: 'DevTools Capital',
      email: 'david@devtoolscapital.com'
    },
    content: 'scheduled a meeting to discuss your pitch',
    time: '1 day ago',
    unread: true,
    details: {
      meetingDate: 'March 28, 2026',
      meetingTime: '2:00 PM PST',
      additionalInfo: 'David wants to discuss your Series A pitch. He focuses on developer tools, cloud infrastructure, and developer APIs. Previously invested in companies like GitHub, Vercel, and Stripe.'
    }
  },
  {
    id: 7,
    type: 'message',
    user: {
      name: 'Sarah Chen',
      avatar: 'https://images.pexels.com/photos/3738088/pexels-photo-3738088.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Entrepreneur',
      company: 'MarketPlace Inc'
    },
    content: 'mentioned you in a comment',
    time: '1 day ago',
    unread: false,
    details: {
      message: '@You Great insights on the market trends! I agree that the e-commerce sector is ready for disruption.',
      additionalInfo: 'Comment was on a post about "Future of E-commerce in 2026"'
    }
  },
  {
    id: 8,
    type: 'connection',
    user: {
      name: 'Emily Watson',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Marketing Director',
      company: 'GrowthHub'
    },
    content: 'accepted your connection request',
    time: '2 days ago',
    unread: false,
    details: {
      connectionStatus: 'accepted',
      additionalInfo: 'Emily specializes in growth marketing and can help with customer acquisition strategies.'
    }
  },
  {
    id: 9,
    type: 'investment',
    user: {
      name: 'James Wilson',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Venture Partner',
      company: 'TechAccelerator',
      email: 'james@techaccelerator.com'
    },
    content: 'requested more details about your business model',
    time: '2 days ago',
    unread: true,
    details: {
      additionalInfo: 'James is interested in understanding your unit economics, pricing strategy, and scalability plans before making an investment decision. He specifically asked for:\n- Monthly recurring revenue breakdown\n- Customer retention rates\n- Competitive analysis\n- 3-year financial projections'
    }
  },
  {
    id: 10,
    type: 'message',
    user: {
      name: 'Lisa Thompson',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Product Manager',
      company: 'InnovateTech'
    },
    content: 'thanked you for the introduction',
    time: '3 days ago',
    unread: false,
    details: {
      message: "Thank you so much for introducing me to David! The meeting went great and we're already planning a follow-up. I really appreciate your help expanding my network!"
    }
  },
  {
    id: 11,
    type: 'system',
    user: {
      name: 'Business Nexus',
      avatar: 'https://i.pravatar.cc/150?img=50'
    },
    content: 'Your profile has been verified successfully',
    time: '4 days ago',
    unread: false,
    details: {
      additionalInfo: 'Your investor profile is now visible to all entrepreneurs. You can now send connection requests and receive investment inquiries. Verified badges are displayed on your profile.'
    }
  },
  {
    id: 12,
    type: 'investment',
    user: {
      name: 'Kevin Brown',
      avatar: 'https://images.pexels.com/photos/936137/pexels-photo-936137.jpeg?w=150&h=150&auto=format&fit=crop',
      role: 'Private Equity',
      company: 'Brown Family Office'
    },
    content: 'left feedback on your pitch deck',
    time: '5 days ago',
    unread: false,
    details: {
      additionalInfo: 'Kevin rated your pitch 8/10. Positive feedback: Strong market opportunity, clear value proposition, experienced team. Areas for improvement: Need more detailed financial projections, consider adding competitive differentiation section.'
    }
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageCircle size={16} />;
    case 'connection':
      return <UserPlus size={16} />;
    case 'investment':
      return <DollarSign size={16} />;
    case 'system':
      return <Bell size={16} />;
    default:
      return <Bell size={16} />;
  }
};

const getNotificationTypeClass = (type: string) => {
  switch (type) {
    case 'message': return 'nx-tag-message';
    case 'connection': return 'nx-tag-connection';
    case 'investment': return 'nx-tag-investment';
    case 'system': return 'nx-tag-system';
    default: return '';
  }
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, index, onClick }) => (
  <Card
    className={clsx(
      'nx-notification-item',
      notification.unread && 'nx-notification-item--unread'
    )}
    style={{ '--nx-index': index } as React.CSSProperties}
    onClick={() => onClick(notification)}
  >
    <CardBody className="nx-notification-item-body">
      <div className="nx-notification-avatar-container">
        <Avatar
          src={notification.user.avatar}
          alt={notification.user.name}
          size="md"
          className="nx-notification-avatar"
        />
        {notification.unread && <div className="nx-notification-unread-dot" />}
      </div>

      <div className="nx-notification-content-wrapper">
        <div className="nx-notification-header-row">
          <span className="nx-notification-user-name">
            {notification.user.name}
          </span>
          <div className="nx-notification-meta-top">
            <span className="nx-notification-time">{notification.time}</span>
            {notification.unread && (
              <Badge variant="primary" size="sm" rounded className="nx-notification-new-badge">New</Badge>
            )}
          </div>
        </div>

        <p className="nx-notification-text">
          {notification.content}
        </p>

        <div className="nx-notification-footer-row">
          <div className={clsx('nx-notification-type-tag', getNotificationTypeClass(notification.type))}>
            {getNotificationIcon(notification.type)}
            <span className="nx-notification-type-label">{notification.type}</span>
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="nx-notification-modal-overlay" onClick={onClose}>
      <div
        className="nx-notification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="nx-notification-modal-header">
          <div className="nx-notification-modal-user">
            <Avatar
              src={notification.user.avatar}
              alt={notification.user.name}
              size="lg"
              className="nx-notification-modal-avatar"
            />
            <div className="nx-notification-modal-user-info">
              <h3 className="nx-notification-modal-user-name">{notification.user.name}</h3>
              {notification.user.role && (
                <p className="nx-notification-modal-user-role">
                  {notification.user.role}
                  {notification.user.company && <span className="nx-notification-modal-user-company"> at {notification.user.company}</span>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="nx-notification-modal-close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="nx-notification-modal-body">
          {/* Status Bar */}
          <div className="nx-notification-modal-status">
            <div className="nx-notification-modal-type">
              {getNotificationIcon(notification.type)}
              <span className="nx-notification-modal-type-label">{notification.type}</span>
            </div>
            <span className="nx-notification-modal-time">{notification.time}</span>
          </div>

          {/* Main Message */}
          <div className="nx-notification-modal-content">
            <p className="nx-notification-modal-main-text">{notification.content}</p>
          </div>

          {/* Details Section */}
          <div className="nx-notification-modal-details">
            {notification.type === 'message' && notification.details?.message && (
              <div className="nx-notification-detail-card nx-notification-detail-card--message">
                <Mail size={16} className="nx-notification-detail-icon" />
                <p className="nx-notification-detail-text">{notification.details.message}</p>
              </div>
            )}

            {notification.type === 'connection' && notification.details && (
              <div className="nx-notification-detail-group">
                {notification.details.connectionStatus && (
                  <div className="nx-notification-detail-item">
                    <span className="nx-notification-detail-label">Status</span>
                    <Badge
                      variant={notification.details.connectionStatus === 'accepted' ? 'success' : notification.details.connectionStatus === 'pending' ? 'warning' : 'secondary'}
                      size="sm"
                      className="nx-notification-detail-badge"
                    >
                      {notification.details.connectionStatus === 'accepted' ? 'Accepted' : notification.details.connectionStatus === 'pending' ? 'Pending' : 'Declined'}
                    </Badge>
                  </div>
                )}
                {notification.details.additionalInfo && (
                  <div className="nx-notification-detail-card">
                    <p className="nx-notification-detail-text">{notification.details.additionalInfo}</p>
                  </div>
                )}
              </div>
            )}

            {notification.type === 'investment' && notification.details && (
              <div className="nx-notification-detail-group">
                {notification.details.investmentInterest && (
                  <div className="nx-notification-detail-item">
                    <DollarSign size={16} className="nx-notification-detail-icon nx-notification-detail-icon--investment" />
                    <div>
                      <span className="nx-notification-detail-label">Investment Interest: </span>
                      <span className="nx-notification-detail-value">{notification.details.investmentInterest}</span>
                    </div>
                  </div>
                )}
                {notification.details.investmentAmount && (
                  <div className="nx-notification-detail-item">
                    <DollarSign size={16} className="nx-notification-detail-icon nx-notification-detail-icon--investment" />
                    <div>
                      <span className="nx-notification-detail-label">Investment Range: </span>
                      <span className="nx-notification-detail-value">{notification.details.investmentAmount}</span>
                    </div>
                  </div>
                )}
                {notification.details.meetingDate && (
                  <div className="nx-notification-detail-item">
                    <Calendar size={16} className="nx-notification-detail-icon nx-notification-detail-icon--calendar" />
                    <div>
                      <span className="nx-notification-detail-label">Meeting: </span>
                      <span className="nx-notification-detail-value">{notification.details.meetingDate} at {notification.details.meetingTime}</span>
                    </div>
                  </div>
                )}
                {notification.details.additionalInfo && (
                  <div className="nx-notification-detail-card">
                    <p className="nx-notification-detail-text">{notification.details.additionalInfo}</p>
                  </div>
                )}
              </div>
            )}

            {notification.type === 'system' && notification.details?.additionalInfo && (
              <div className="nx-notification-detail-card nx-notification-detail-card--system">
                <p className="nx-notification-detail-text">{notification.details.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          {(notification.user.email || notification.user.phone) && (
            <div className="nx-notification-modal-contact">
              <h4 className="nx-notification-contact-title">Contact Information</h4>
              <div className="nx-notification-contact-list">
                {notification.user.email && (
                  <div className="nx-notification-contact-item">
                    <Mail size={14} />
                    <a href={`mailto:${notification.user.email}`} className="nx-notification-contact-link">{notification.user.email}</a>
                  </div>
                )}
                {notification.user.phone && (
                  <div className="nx-notification-contact-item">
                    <Phone size={14} />
                    <a href={`tel:${notification.user.phone}`} className="nx-notification-contact-link">{notification.user.phone}</a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="nx-notification-modal-footer">
          <Button variant="outline" onClick={onClose} className="nx-notification-footer-btn">
            Close
          </Button>
          {notification.type === 'message' && (
            <Button onClick={() => { window.location.href = notification.details?.actionUrl || '/messages'; }} className="nx-notification-footer-btn nx-notification-footer-btn--primary">
              <Mail size={16} className="nx-btn-icon" />
              Reply
            </Button>
          )}
          {notification.type === 'connection' && notification.details?.connectionStatus === 'pending' && (
            <>
              <Button 
                variant="outline" 
                className="nx-notification-footer-btn nx-notification-footer-btn--decline"
                style={{ backgroundColor: 'white', color: '#374151', borderColor: '#e5e7eb' }}
              >
                Decline
              </Button>
              <Button 
                className="nx-notification-footer-btn nx-notification-footer-btn--primary"
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                Accept
              </Button>
            </>
          )}
          {notification.type === 'investment' && notification.details?.meetingDate && (
            <Button className="nx-notification-footer-btn nx-notification-footer-btn--primary">
              <Calendar size={16} className="nx-btn-icon" />
              Confirm Meeting
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const closePopup = () => {
    setSelectedNotification(null);
  };
  
  return (
    <div className="nx-notifications-page animate-fade-in">
      <div className="nx-notifications-header">
        <div className="notifications-title-section">
          <h1 className="nx-notifications-title">Notifications</h1>
          <p className="nx-notifications-subtitle">Stay updated with your network activity</p>
        </div>
        
        <Button 
          className="nx-notifications-mark-all-btn"
          variant="outline" 
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>
      
      <div className="nx-notifications-list-container">
        <div className="nx-notifications-list">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            index={index}
            onClick={handleNotificationClick}
          />
        ))}
        </div>
      </div>

      <NotificationModal
        notification={selectedNotification}
        onClose={closePopup}
      />
    </div>
  );
};