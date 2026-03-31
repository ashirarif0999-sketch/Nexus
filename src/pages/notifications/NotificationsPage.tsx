import React, { useState } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, X, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

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
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      role: 'Entrepreneur',
      company: 'TechWave AI',
      email: 'sarah@techwave.ai'
    },
    content: 'sent you a message about your startup',
    time: '5 minutes ago',
    unread: true,
    details: {
      message: "Hi! I came across your profile and I'm impressed by your work. I'm working on an AI-driven financial analytics platform and would love to discuss potential collaboration opportunities. Are you available for a call this week?",
      actionUrl: '/chat/e1'
    }
  },
  {
    id: 2,
    type: 'connection',
    user: {
      name: 'Michael Rodriguez',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
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
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
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
      avatar: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg',
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
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
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
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
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
      avatar: 'https://images.pexels.com/photos/3738088/pexels-photo-3738088.jpeg',
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
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
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
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
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
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
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
      avatar: 'https://images.pexels.com/photos/936137/pexels-photo-936137.jpeg',
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

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

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
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      case 'system':
        return <Bell size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="notifications-page page-main-content space-y-6 animate-fade-in">
      <div className="notifications-header page-header flex justify-between items-center">
        <div className="notifications-title-section">
          <h1 className="notifications-title text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="notifications-subtitle text-gray-600">Stay updated with your network activity</p>
        </div>
        
        <Button 
          className="notifications-mark-all-btn" 
          variant="outline" 
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>
      
      <div className="notifications-list page-content space-y-4">
        {notifications.map(notification => (
          <Card
            key={notification.id}
            className={clsx(
              'notifications-item transition-colors duration-200 cursor-pointer',
              notification.unread && 'bg-primary-50 hover:bg-primary-100'
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardBody className="notifications-item-body flex items-start p-4">
              <Avatar
                src={notification.user.avatar}
                alt={notification.user.name}
                size="md"
                className="flex-shrink-0 mr-4"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {notification.user.name}
                  </span>
                  {notification.unread && (
                    <Badge variant="primary" size="sm" rounded>New</Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mt-1">
                  {notification.content}
                </p>
                
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {getNotificationIcon(notification.type)}
                  <span>{notification.time}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Notification Detail Popup */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closePopup}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedNotification.user.avatar}
                  alt={selectedNotification.user.name}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedNotification.user.name}</h3>
                  {selectedNotification.user.role && (
                    <p className="text-sm text-gray-500">{selectedNotification.user.role}{selectedNotification.user.company && ` at ${selectedNotification.user.company}`}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={closePopup}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Notification Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                {getNotificationIcon(selectedNotification.type)}
                <span className="text-sm font-medium text-gray-500 capitalize">{selectedNotification.type}</span>
                <span className="text-sm text-gray-400">• {selectedNotification.time}</span>
              </div>

              {/* Main Content */}
              <p className="text-gray-700 mb-4">{selectedNotification.content}</p>

              {/* Type-specific Details */}
              {selectedNotification.type === 'message' && selectedNotification.details?.message && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="text-gray-400 mt-0.5" />
                    <p className="text-gray-600 text-sm">{selectedNotification.details.message}</p>
                  </div>
                </div>
              )}

              {selectedNotification.type === 'connection' && selectedNotification.details && (
                <div className="space-y-3 mb-4">
                  {selectedNotification.details.connectionStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <Badge 
                        variant={selectedNotification.details.connectionStatus === 'accepted' ? 'success' : selectedNotification.details.connectionStatus === 'pending' ? 'warning' : 'secondary'}
                        size="sm"
                      >
                        {selectedNotification.details.connectionStatus === 'accepted' ? 'Accepted' : selectedNotification.details.connectionStatus === 'pending' ? 'Pending' : 'Declined'}
                      </Badge>
                    </div>
                  )}
                  {selectedNotification.details.additionalInfo && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{selectedNotification.details.additionalInfo}</p>
                  )}
                </div>
              )}

              {selectedNotification.type === 'investment' && selectedNotification.details && (
                <div className="space-y-3 mb-4">
                  {selectedNotification.details.investmentInterest && (
                    <div className="flex items-start gap-2">
                      <DollarSign size={16} className="text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Investment Interest: </span>
                        <span className="text-sm text-gray-700">{selectedNotification.details.investmentInterest}</span>
                      </div>
                    </div>
                  )}
                  {selectedNotification.details.investmentAmount && (
                    <div className="flex items-start gap-2">
                      <DollarSign size={16} className="text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Investment Range: </span>
                        <span className="text-sm text-gray-700">{selectedNotification.details.investmentAmount}</span>
                      </div>
                    </div>
                  )}
                  {selectedNotification.details.meetingDate && (
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-indigo-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-gray-500">Meeting: </span>
                        <span className="text-sm text-gray-700">{selectedNotification.details.meetingDate} at {selectedNotification.details.meetingTime}</span>
                      </div>
                    </div>
                  )}
                  {selectedNotification.details.additionalInfo && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{selectedNotification.details.additionalInfo}</p>
                  )}
                </div>
              )}

              {selectedNotification.type === 'system' && selectedNotification.details?.additionalInfo && (
                <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-4">{selectedNotification.details.additionalInfo}</p>
              )}

              {/* Contact Info */}
              {(selectedNotification.user.email || selectedNotification.user.phone) && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedNotification.user.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        <a href={`mailto:${selectedNotification.user.email}`} className="text-indigo-600 hover:underline">{selectedNotification.user.email}</a>
                      </div>
                    )}
                    {selectedNotification.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <a href={`tel:${selectedNotification.user.phone}`} className="text-indigo-600 hover:underline">{selectedNotification.user.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Popup Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={closePopup}>
                Close
              </Button>
              {selectedNotification.type === 'message' && (
                <Button onClick={() => { window.location.href = selectedNotification.details?.actionUrl || '/messages'; }}>
                  <Mail size={16} className="mr-2" />
                  Reply
                </Button>
              )}
              {selectedNotification.type === 'connection' && selectedNotification.details?.connectionStatus === 'pending' && (
                <>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">Decline</Button>
                  <Button>Accept</Button>
                </>
              )}
              {selectedNotification.type === 'investment' && selectedNotification.details?.meetingDate && (
                <Button>
                  <Calendar size={16} className="mr-2" />
                  Confirm Meeting
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};