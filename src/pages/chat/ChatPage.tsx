import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  SendHorizontal,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  X,
  Search,
  Star,
  Flag,
  Ban,
  Trash2,
  Building2,
  Mail,
  Smartphone,
  Calendar,
  Mic,
  LockKeyhole,
  MessageCircle,
  ArrowLeft,
  Reply,
  Copy,
  Forward,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { EmojiPickerWrapper } from '../../components/chat/LazyEmojiPicker';
import joypixels from 'emoji-toolkit';
import { useAuth } from '../../context/AuthContext';
import { getMessagesBetweenUsers, sendMessage, getConversationsForUser } from '../../data/messages';
import { findUserById } from '../../data/users';
import { Message, ChatConversation, User as UserType } from '../../types';
import { recentContactsDB } from '../../utils/recentContactsDB';
import { ROUTES } from '../../config/routes';
import { ChatMessageSkeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';

// --- Types Extensions ---
interface ExtendedMessage extends Message {
  status?: 'sent' | 'delivered' | 'seen';
  replyTo?: string;
}

// --- Sub-Components ---

const MessageTicks: React.FC<{ status?: 'sent' | 'delivered' | 'seen' }> = ({ status }) => {
  const tickStatus = status || 'delivered';
  const color = tickStatus === 'seen' ? '#53BDEB' : '#8696A0';
  
  if (tickStatus === 'sent') {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="ml-1">
        <path d="M1 6L5.5 10.5L15 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="ml-1">
      <path d="M1 6L5.5 10.5L15 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 6L10.5 10.5L19.5 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4.5 0)"/>
    </svg>
  );
};

const ContactInfoDrawer: React.FC<{ 
  user: UserType | null; 
  isOpen: boolean; 
  onClose: () => void; 
}> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <div 
      className={clsx(
        "absolute right-0 top-0 h-full bg-[#FFFFFF] border-l border-[#E9EDEF] z-20 transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0 w-[340px]" : "translate-x-full w-[340px]"
      )}
    >
      <div className="h-16 bg-[#F0F2F5] border-b border-[#E9EDEF] px-4 flex items-center gap-4 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-[#54656F] hover:text-[#111B21] hover:bg-[#F0F2F5] rounded-full transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-[16px] font-medium text-[#111B21]">Contact Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-[#FFFFFF] flex flex-col items-center py-8 px-6 border-b border-[#E9EDEF]">
          <div className="relative">
             <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-[200px] h-[200px] rounded-full" />
             {user.isOnline && (
               <span className="absolute bottom-4 right-4 w-[14px] h-[14px] bg-[#00A884] border-4 border-white rounded-full"></span>
             )}
          </div>
          <h3 className="text-[20px] font-semibold text-[#111B21] mt-4">{user.name}</h3>
          <p className="text-[14px] text-[#667781] mt-1">{user.role === 'entrepreneur' ? 'Entrepreneur' : 'Investor'}</p>
          {user.isOnline && (
            <p className="text-[13px] text-[#00A884] mt-1">Online</p>
          )}
        </div>

        <div className="bg-[#FFFFFF] flex justify-center gap-8 py-4 border-b border-[#E9EDEF]">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
              <MessageCircle size={22} className="text-[#405CFF]" />
            </div>
            <span className="text-[12px] text-[#405CFF] font-medium">Message</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
              <Phone size={22} className="text-[#405CFF]" />
            </div>
            <span className="text-[12px] text-[#405CFF] font-medium">Call</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
              <Video size={22} className="text-[#405CFF]" />
            </div>
            <span className="text-[12px] text-[#405CFF] font-medium">Video</span>
          </button>
        </div>

        <div className="bg-[#FFFFFF] px-6 py-4 space-y-2">
          {user.company && (
            <div className="flex items-start gap-5 py-3 border-b border-[#F0F2F5] pb-5">
              <Building2 size={20} className="text-[#8696A0] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] text-[#667781]">Company</p>
                <p className="text-[14px] text-[#111B21] font-medium">{user.company}</p>
              </div>
            </div>
          )}
          {user.email && (
            <div className="flex items-start gap-5 py-3 border-b border-[#F0F2F5] pb-5">
              <Mail size={20} className="text-[#8696A0] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] text-[#667781]">Email</p>
                <a href={`mailto:${user.email}`} className="text-[14px] text-[#405CFF] font-medium hover:underline block truncate">
                  {user.email}
                </a>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="flex items-start gap-5 py-3 border-b border-[#F0F2F5] pb-5">
              <Smartphone size={20} className="text-[#8696A0] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] text-[#667781]">Phone</p>
                <a href={`tel:${user.phone}`} className="text-[14px] text-[#405CFF] font-medium hover:underline block truncate">
                  {user.phone}
                </a>
              </div>
            </div>
          )}
          <div className="flex items-start gap-5 py-3">
            <Calendar size={20} className="text-[#8696A0] mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] text-[#667781]">Member Since</p>
              <p className="text-[14px] text-[#111B21] font-medium">March 2024</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] mt-2 px-6 py-2 border-t border-[#E9EDEF]">
          <button className="w-full flex items-center gap-4 py-4 text-[#EA0038] text-[15px] hover:bg-[#F0F2F5] px-4 -mx-4 rounded-lg transition-colors">
            <Ban size={20} />
            <span>Block {user.name}</span>
          </button>
          <button className="w-full flex items-center gap-4 py-4 text-[#EA0038] text-[15px] hover:bg-[#F0F2F5] px-4 -mx-4 rounded-lg transition-colors">
            <Flag size={20} />
            <span>Report {user.name}</span>
          </button>
        </div>
        
        <div className="h-8"></div>
      </div>
    </div>
  );
};

// --- Helper Functions ---

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
};

const isConsecutive = (currentMsg: ExtendedMessage | undefined, prevMsg: ExtendedMessage | undefined) => {
  if (!currentMsg || !prevMsg) return false;
  if (!currentMsg.senderId || !prevMsg.senderId) return false;
  if (currentMsg.senderId !== prevMsg.senderId) return false;
  const currTime = new Date(currentMsg.timestamp).getTime();
  const prevTime = new Date(prevMsg.timestamp).getTime();
  return (currTime - prevTime) < 5 * 60 * 1000;
};

const isEmojiOnly = (content: string): boolean => {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\uFE0F)+$/u;
  const trimmed = content.trim();
  return emojiRegex.test(trimmed) && trimmed.length <= 6;
};

const detectLinks = (content: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a 
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#405CFF] underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// --- Main Component ---

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(42);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatUser = userId ? findUserById(userId) : null;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (joypixels) {
      joypixels.imageType = 'svg';
      if (joypixels.assets) {
        joypixels.assets.svg = 'https://cdn.jsdelivr.net/joypixels/assets/8.0/svg/unicode/';
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      try {
        const recentContacts = await recentContactsDB.getRecentContacts(currentUser.id);
        if (recentContacts.length > 0) {
          const conversations = getConversationsForUser(currentUser.id);
          const sortedConversations = conversations.sort((a, b) => {
            const aIndex = recentContacts.indexOf(a.participants.find(p => p !== currentUser.id) || '');
            const bIndex = recentContacts.indexOf(b.participants.find(p => p !== currentUser.id) || '');
            return aIndex - bIndex;
          });
          setConversations(sortedConversations);
        } else {
          setConversations(getConversationsForUser(currentUser.id));
        }
      } catch (error) {
        console.warn('Error loading recent contacts:', error);
        setConversations(getConversationsForUser(currentUser.id));
      }
      setIsLoadingConversations(false);

      if (userId) {
        const rawMessages = getMessagesBetweenUsers(currentUser.id, userId);
        const extendedMessages = rawMessages.map(m => ({
          ...m,
          status: (m as ExtendedMessage).status || 'delivered'
        }));
        setMessages(extendedMessages);
      }
      setIsLoadingMessages(false);
    };
    loadData();
  }, [userId, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (activeMessageId) {
        setActiveMessageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMessageId]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollBtn(!isNearBottom);
      }
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages, userId]);

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    const message = sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: newMessage
    }) as ExtendedMessage;

    message.status = 'sent';
    message.isDelivered = true;

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'delivered' } : m));
    }, 1000);

    recentContactsDB.addRecentContact(currentUser.id, userId).catch(console.warn);

    setMessages(prev => [...prev, message]);
    setConversations(getConversationsForUser(currentUser.id));
    setNewMessage('');
    setShowEmojiPicker(false);
    setReplyingTo(null);
    setTextareaHeight(42);
  }, [currentUser, userId, newMessage, replyingTo]);

  const onEmojiClick = useCallback((emojiData: any) => {
    setNewMessage(prev => prev + (emojiData.emoji || ''));
    textareaRef.current?.focus();
  }, []);

  const handleUserSelect = useCallback((id: string) => {
    navigate(ROUTES.CHAT.CONVERSATION(id));
    if (currentUser) {
      recentContactsDB.addRecentContact(currentUser.id, id).catch(console.warn);
    }
    if (windowWidth < 768) setIsSidebarOpen(false);
  }, [navigate, currentUser, windowWidth]);

  const handleBackToSidebar = useCallback(() => {
    navigate(ROUTES.CHAT.ROOT);
  }, [navigate]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 120);
    e.target.style.height = `${newHeight}px`;
    setTextareaHeight(newHeight);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleContextMenu = (_messageId: string, x: number, y: number) => {
    setActiveMessageId(_messageId);
    setContextMenuPos({ x, y });
  };

  const handleReaction = (_emoji: string) => {
    setActiveMessageId(null);
  };

  const handleReply = (message: ExtendedMessage) => {
    setReplyingTo(message);
    setActiveMessageId(null);
    textareaRef.current?.focus();
  };

  const handleCopy = (message: ExtendedMessage) => {
    navigator.clipboard.writeText(message.content);
    setActiveMessageId(null);
  };

  const handleDelete = (_messageId: string) => {
    setActiveMessageId(null);
  };

  if (!currentUser) return null;

  const isMobile = windowWidth < 768;
  const showChatArea = isMobile ? !isSidebarOpen : true;

  const firstUnreadIndex = messages.findIndex(m => !m.isRead && m.receiverId === currentUser.id);

  return (
    <main className={clsx(
      "chatpage-container flex bg-[#F0F2F5] font-sans overflow-hidden transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-[200] h-screen w-screen rounded-none" : "relative h-[calc(100vh-160px)] w-full rounded-2xl border border-[#E9EDEF]"
    )}>
      
      {/* LEFT SIDEBAR */}
      <aside className={clsx(
        "bg-[#FFFFFF] flex flex-col border-r border-[#E9EDEF] transition-all duration-300 z-30",
        isMobile 
          ? (isSidebarOpen ? "fixed inset-0 w-full" : "hidden") 
          : "w-[360px] shrink-0"
      )}>
        <div className="h-16 bg-[#F0F2F5] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" className="w-10 h-10 cursor-pointer" />
          </div>
          <div className="flex items-center gap-5 text-[#54656F]">
            <button className="hover:text-[#111B21] transition-colors"><MessageCircle size={20} /></button>
            <button className="hover:text-[#111B21] transition-colors"><MoreVertical size={20} /></button>
          </div>
        </div>

        <div className="px-3 py-2 shrink-0">
          <div className="bg-[#F0F2F5] rounded-lg h-9 flex items-center px-3 gap-3">
            <Search size={18} className="text-[#54656F]" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="bg-transparent border-none focus:ring-0 text-[14px] text-[#111B21] placeholder:text-[#667781] w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingConversations ? (
            <ChatMessageSkeleton isCurrentUser={false} />
          ) : (
            conversations.map(conv => {
              const otherUserId = conv.participants.find(p => p !== currentUser.id);
              const otherUser = otherUserId ? findUserById(otherUserId) : null;
              const lastMsg = conv.lastMessage as ExtendedMessage | undefined;
              const isActive = userId === otherUserId;
              const isUnread = lastMsg && lastMsg.receiverId === currentUser.id && !lastMsg.isRead;
              
              return (
                <div 
                  key={conv.id}
                  onClick={() => handleUserSelect(otherUserId || '')}
                  className={clsx(
                    "h-[72px] flex items-center px-3 gap-3 cursor-pointer transition-colors border-b border-[#F0F2F5] last:border-0",
                    isActive ? "bg-[#F0F2F5]" : "hover:bg-[#F5F6F6]"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar src={otherUser?.avatarUrl || ''} alt={otherUser?.name || ''} size="md" className="w-[49px] h-[49px] rounded-full" />
                    {otherUser?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00A884] rounded-full ring-2 ring-white"></span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className={clsx("text-[15px] font-medium truncate", isActive ? "text-[#111B21]" : "text-[#111B21]")}>
                        {otherUser?.name}
                      </span>
                      <span className={clsx("text-[12px] shrink-0", isUnread ? "text-[#405CFF] font-medium" : "text-[#667781]")}>
                        {lastMsg ? formatTime(lastMsg.timestamp) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 truncate text-[13px] text-[#667781] max-w-[200px]">
                        {lastMsg?.senderId === currentUser.id && (
                          <MessageTicks status={lastMsg.status} />
                        )}
                        <span className="truncate">{lastMsg?.content || 'No messages yet'}</span>
                      </div>
                      {isUnread && (
                        <div className="w-5 h-5 bg-[#405CFF] text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
                          1
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <section className={clsx(
        "flex-1 flex flex-col relative overflow-hidden transition-all duration-300",
        isMobile && !showChatArea ? "hidden" : "flex"
      )}>
        
        {userId && chatUser ? (
          <>
            <header className="h-16 bg-[#F0F2F5] border-b border-[#E9EDEF] px-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button onClick={handleBackToSidebar} className="mr-1 text-[#54656F] hover:text-[#111B21]">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setShowContactInfo(true)}
                >
                  <div className="relative">
                    <Avatar src={chatUser.avatarUrl} alt={chatUser.name} size="sm" className="w-10 h-10" />
                    {chatUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00A884] rounded-full ring-2 ring-[#F0F2F5]"></span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-medium text-[#111B21] leading-tight">{chatUser.name}</h2>
                    <p className="text-[13px] text-[#667781]">
                      {chatUser.isOnline ? <span className="text-[#00A884]">Online</span> : 'Click for info'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[#54656F]">
                <button className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]"><Video size={20} /></button>
                <button className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]"><Phone size={20} /></button>
                <button className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]"><Search size={20} /></button>
                <button className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-[8%] py-4 bg-[#EFEAE2] custom-scrollbar relative"
              style={{
                backgroundImage: "radial-gradient(#D1D7DB 0.5px, transparent 0.5px)",
                backgroundSize: "20px 20px"
              }}
            >
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <ChatMessageSkeleton key={i} isCurrentUser={i % 2 === 0} />)}
                </div>
              ) : messages.length > 0 ? (
                <div className="flex flex-col">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];
                    const consecutive = isConsecutive(msg, prevMsg);
                    const isLastInGroup = !isConsecutive(nextMsg, msg);
                    const showTimestamp = isLastInGroup;
                    const emojiOnly = isEmojiOnly(msg.content);
                    const isFirstUnread = idx === firstUnreadIndex;

                    return (
                      <React.Fragment key={msg.id}>
                        {isFirstUnread && (
                          <div className="text-[12.5px] text-[#667781] bg-[rgba(225,221,214,0.9)] px-4 py-1 rounded-full mx-auto my-3 w-fit select-none">
                            UNREAD MESSAGES
                          </div>
                        )}

                        {(!prevMsg || formatDateSeparator(msg.timestamp) !== formatDateSeparator(prevMsg.timestamp)) && (
                          <div className="text-[12.5px] text-[#667781] bg-[rgba(225,221,214,0.9)] px-4 py-1 rounded-full mx-auto my-4 w-fit select-none">
                            {formatDateSeparator(msg.timestamp)}
                          </div>
                        )}

                        <div 
                          className={clsx(
                            "flex w-full group relative",
                            isMe ? "justify-end" : "justify-start",
                            consecutive ? "mt-0.5" : "mt-2"
                          )}
                        >
                          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{
                              [isMe ? 'right' : 'left']: '100%',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(msg.id, e.clientX, e.clientY);
                              }}
                              className="p-1 rounded-full hover:bg-[#E9EDEF] transition-colors"
                            >
                              <MoreVertical size={16} className="text-[#8696A0]" />
                            </button>
                          </div>

                          <div 
                            className={clsx(
                              "relative px-3 py-2 shadow-sm max-w-[65%]",
                              emojiOnly 
                                ? "bg-transparent shadow-none px-0 py-0 text-[42px] leading-none"
                                : isMe 
                                  ? "bg-[#D9FDD3] rounded-[8px] rounded-tr-[0px]" 
                                  : "bg-[#FFFFFF] rounded-[8px] rounded-tl-[0px]",
                              consecutive && !emojiOnly && "rounded-[8px]",
                              !emojiOnly && "text-[#111B21] text-[14.2px] leading-[19px]"
                            )}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {detectLinks(msg.content)}
                            </div>

                            {!emojiOnly && showTimestamp && (
                              <div className={clsx(
                                "flex justify-end items-center gap-1 mt-1 select-none",
                                isMe ? "text-right" : "text-right"
                              )}>
                                <span className="text-[11px] text-[#667781] min-w-fit">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {isMe && <MessageTicks status={msg.status} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-[rgba(255,217,102,0.15)] text-[#111B21] text-[13px] rounded-[8px] px-4 py-3 text-center max-w-[85%] shadow-sm">
                    Messages you send to this chat are secured with end-to-end encryption.
                  </div>
                </div>
              )}

              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-8 w-10 h-10 bg-[#FFFFFF] rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.15)] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
                >
                  <ChevronDown size={20} className="text-[#54656F]" />
                </button>
              )}

              {activeMessageId && (
                <div 
                  className="fixed bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] w-52 py-1.5 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-150"
                  style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#F0F2F5]">
                    {['👍', '❤️', '😂', '😮', '😢', '✊'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-[22px] cursor-pointer hover:scale-125 transition-transform duration-150 select-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleReply(messages.find(m => m.id === activeMessageId) as ExtendedMessage)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
                  >
                    <Reply size={18} className="text-[#8696A0]" />
                    Reply
                  </button>
                  <button 
                    onClick={() => handleCopy(messages.find(m => m.id === activeMessageId) as ExtendedMessage)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
                  >
                    <Copy size={18} className="text-[#8696A0]" />
                    Copy
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors">
                    <Forward size={18} className="text-[#8696A0]" />
                    Forward
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors">
                    <Star size={18} className="text-[#8696A0]" />
                    Star
                  </button>
                  <div className="border-t border-[#F0F2F5] my-1"></div>
                  <button 
                    onClick={() => handleDelete(activeMessageId)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#EA0038] hover:bg-[#FFF0F3] cursor-pointer transition-colors"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="h-auto bg-[#F0F2F5] border-t border-[#E9EDEF] px-4 py-3 shrink-0 z-10">
              {replyingTo && (
                <div className="bg-[#F0F2F5] border-l-4 border-[#405CFF] px-3 py-2 flex justify-between items-start mb-3 rounded">
                  <div className="flex-1">
                    <p className="text-[13px] text-[#405CFF] font-semibold">
                      {findUserById(replyingTo.senderId)?.name}
                    </p>
                    <p className="text-[13px] text-[#667781] truncate max-w-[85%]">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-[#54656F] hover:text-[#111B21]">
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <button className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1"><Smile size={24} /></button>
                <button className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1"><Paperclip size={24} /></button>
                
                <div className="flex-1 bg-[#FFFFFF] rounded-[8px] flex items-center px-4 py-2">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-[#111B21] placeholder:text-[#8696A0] resize-none"
                    style={{ minHeight: '42px', maxHeight: '120px', height: `${textareaHeight}px` }}
                  />
                </div>

                {newMessage.trim() ? (
                  <button
                    onClick={() => handleSendMessage()}
                    className="w-[42px] h-[42px] bg-[#405CFF] rounded-full flex items-center justify-center text-white hover:bg-[#3451E0] active:scale-95 transition-all shadow-sm mb-1"
                  >
                    <SendHorizontal size={20} />
                  </button>
                ) : (
                  <button className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1"><Mic size={24} /></button>
                )}
                
                <div ref={emojiPickerRef} className="relative mb-1">
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-[200] shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                      <EmojiPickerWrapper onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ContactInfoDrawer 
              user={chatUser} 
              isOpen={showContactInfo} 
              onClose={() => setShowContactInfo(false)} 
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5]">
            <div className="text-center px-8">
              <div className="w-64 h-64 mx-auto mb-8 opacity-60">
                <div className="w-full h-full bg-[#D1D7DB] rounded-full flex items-center justify-center">
                  <LockKeyhole size={64} strokeWidth={1} className="text-[#8696A0]" />
                </div>
              </div>
              <h1 className="text-[20px] font-light text-[#111B21] mb-2">Your messages are end-to-end encrypted</h1>
              <p className="text-[14px] text-[#667781] leading-6 text-center max-w-[260px] mx-auto">
                No one outside can read or listen to them
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};