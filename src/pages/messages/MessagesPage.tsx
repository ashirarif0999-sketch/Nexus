import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Mic, MicOff, Video, VideoOff, Volume2, X, PanelLeftClose, PanelLeftOpen, Phone, Search, MoreVertical } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';
import { Message, ChatConversation } from '../../types';
import {
  sendMessageCustom,
  getMessagesBetweenUsersCustom,
  getConversationsForUserCustom,
  markMessagesAsReadCustom,
  addReactionCustom,
  deleteMessageCustom
} from '../../utils/messagesDB';

export const MessagesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // For future cloud upload

  // ===== CALL UI MOCKUP STATE =====
  type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';
  type CallType = 'audio' | 'video' | null;

  const [callState, setCallState] = useState<{
    status: CallStatus;
    type: CallType;
    isMuted: boolean;
    isCameraOff: boolean;
    startTime: number | null;
    timerInterval: number | null;
  }>({
    status: 'idle',
    type: null,
    isMuted: false,
    isCameraOff: false,
    startTime: null,
    timerInterval: null,
  });

  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_TYPES = ['image/*', 'video/*', '.pdf', '.doc', '.docx'];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 5,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showToast(rejectedFiles[0].errors[0].message, 'error');
        return;
      }

      setPendingFiles(prev => [...prev, ...acceptedFiles]);

      // Generate preview URLs
      const newUrls = acceptedFiles.map(file => {
        if (file.type.startsWith('image/')) return URL.createObjectURL(file);
        if (file.type.startsWith('video/')) return URL.createObjectURL(file);
        return null; // Fallback for docs
      }).filter(Boolean) as string[];

      setPreviewUrls(prev => [...prev, ...newUrls]);
      showToast(`${acceptedFiles.length} file(s) attached`);
    }
  });

  // 🧹 Cleanup object URLs on unmount or file removal
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Load conversations on component mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);
        const userConversations = await getConversationsForUserCustom(currentUser.id);
        setConversations(userConversations);

        // Auto-select first conversation if available
        if (userConversations.length > 0) {
          const firstPartner = userConversations[0].participants.find(p => p !== currentUser.id);
          if (firstPartner) {
            setSelectedContact(firstPartner);
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        showToast('Failed to load conversations', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  // Load messages when selected contact changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser || !selectedContact) {
        setMessages([]);
        return;
      }

      try {
        setError(null);
        const conversationMessages = await getMessagesBetweenUsersCustom(currentUser.id, selectedContact);
        setMessages(conversationMessages);

        // Mark conversation as read when opened
        await markMessagesAsReadCustom(currentUser.id, selectedContact);
      } catch (err) {
        console.error('Error loading messages:', err);
        showToast('Failed to load messages', 'error');
      }
    };

    loadMessages();
  }, [currentUser, selectedContact]);

  const handleContextMenu = (messageId: string, x: number, y: number) => {
    setActiveMessageId(messageId);
    setContextMenuPos({ x, y });
  };

  const handleReaction = async (emoji: string) => {
    if (!activeMessageId || !currentUser) return;

    try {
      // Check if reaction already exists and remove it, or add new one
      const message = messages.find(m => m.id === activeMessageId);
      if (!message) return;

      const existingReaction = message.reactions?.find(r => r.userId === currentUser.id && r.emoji === emoji);

      if (existingReaction) {
        // Remove reaction - for now, just update local state (we'd need removeReactionCustom)
        const updatedMessage = {
          ...message,
          reactions: message.reactions?.filter(r => !(r.userId === currentUser.id && r.emoji === emoji)) || []
        };
        setMessages(prev => prev.map(msg => msg.id === activeMessageId ? updatedMessage : msg));
        showToast('Reaction removed');
      } else {
        // Add reaction using IndexedDB
        const updatedMessage = await addReactionCustom(activeMessageId, emoji, currentUser.id);
        if (updatedMessage) {
          setMessages(prev => prev.map(msg => msg.id === activeMessageId ? updatedMessage : msg));
          showToast('Reaction added');
        } else {
          showToast('Failed to add reaction', 'error');
        }
      }
    } catch (err) {
      console.error('Error handling reaction:', err);
      showToast('Failed to add/remove reaction', 'error');
    }

    setActiveMessageId(null);
  };

  const handleReply = () => {
    if (!activeMessageId) return;

    const message = messages.find(m => m.id === activeMessageId);
    if (message) {
      setReplyingTo(message);
      showToast('Reply mode activated');
    }

    setActiveMessageId(null);
  };

  const handleCopy = async () => {
    if (!activeMessageId) return;

    const message = messages.find(m => m.id === activeMessageId);
    if (message) {
      try {
        await navigator.clipboard.writeText(message.content);
        showToast('Message copied to clipboard');
      } catch (err) {
        console.error('Failed to copy message:', err);
        showToast('Failed to copy message', 'error');
      }
    }

    setActiveMessageId(null);
  };

  const handleDelete = () => {
    if (!activeMessageId) return;
    setShowDeleteConfirm(activeMessageId);
    setActiveMessageId(null);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm || !currentUser || !selectedContact) return;

    const messageId = showDeleteConfirm;
    const deletedMessage = messages.find(m => m.id === messageId);
    if (!deletedMessage) return;

    // Calculate the remaining messages for conversation update
    const remainingMessagesInConversation = messages.filter(m =>
      m.id !== messageId &&
      ((m.senderId === currentUser.id && m.receiverId === selectedContact) ||
       (m.senderId === selectedContact && m.receiverId === currentUser.id))
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const newLastMessage = remainingMessagesInConversation.length > 0
      ? remainingMessagesInConversation[remainingMessagesInConversation.length - 1]
      : undefined;

    try {
      // Remove from local state immediately for better UX
      setMessages(prev => prev.filter(m => m.id !== messageId));
      console.log('Message removed from local state:', messageId);

      // Update conversations if this was the last message
      setConversations(prev => prev.map(conv => {
        if (conv.lastMessage?.id === messageId) {
          console.log('Updating conversation last message:', conv.id, newLastMessage?.content);
          return { ...conv, lastMessage: newLastMessage };
        }
        return conv;
      }));

      // Attempt to delete from database
      console.log('Attempting to delete from IndexedDB:', messageId);
      const success = await deleteMessageCustom(messageId);
      console.log('IndexedDB delete result:', success);

      if (success) {
        showToast('Message deleted');
        console.log('Message successfully deleted');
      } else {
        // Revert local state if database delete failed
        console.error('Database delete failed, reverting local state');
        setMessages(prev => {
          const updatedMessages = [...prev];
          // Insert the message back in the correct position based on timestamp
          const insertIndex = updatedMessages.findIndex(m => new Date(m.timestamp) > new Date(deletedMessage.timestamp));
          if (insertIndex === -1) {
            updatedMessages.push(deletedMessage);
          } else {
            updatedMessages.splice(insertIndex, 0, deletedMessage);
          }
          return updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
        showToast('Failed to delete message', 'error');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      // Revert local state on error
      console.error('Exception occurred, reverting local state');
      setMessages(prev => {
        const updatedMessages = [...prev];
        // Insert the message back in the correct position based on timestamp
        const insertIndex = updatedMessages.findIndex(m => new Date(m.timestamp) > new Date(deletedMessage.timestamp));
        if (insertIndex === -1) {
          updatedMessages.push(deletedMessage);
        } else {
          updatedMessages.splice(insertIndex, 0, deletedMessage);
        }
        return updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });
      showToast('Failed to delete message', 'error');
    }

    setShowDeleteConfirm(null);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && pendingFiles.length === 0) || !currentUser || !selectedContact) return;

    try {
      const baseMessage: Omit<Message, "id" | "timestamp" | "isRead" | "reactions" | "isStarred" | "isDeleted"> = {
        senderId: currentUser.id,
        receiverId: selectedContact,
        content: newMessage.trim() || (pendingFiles.length > 0 ? `📎 ${pendingFiles.length} file(s)` : ''),
      };

      if (replyingTo) {
        baseMessage.replyTo = replyingTo.id;
        baseMessage.replyContent = replyingTo.content;
      }

      let attachmentData: { attachmentUrl: string; attachmentType: 'image' | 'video' | 'file'; attachmentName: string; attachmentSize: number } | undefined;

      // 📎 Handle attachments temporarily (not saved to IndexedDB)
      if (pendingFiles.length > 0) {
        const file = pendingFiles[0]; // Simplified: send 1st file. Loop for multiple later.
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        attachmentData = {
          attachmentUrl: `data:${file.type};base64,${base64}`,
          attachmentType: file.type.startsWith('image/') ? 'image'
            : file.type.startsWith('video/') ? 'video' : 'file',
          attachmentName: file.name,
          attachmentSize: file.size
        };
      }

      const sentMessage = await sendMessageCustom(baseMessage);

      // Add attachment data to local state only (temporary, vanishes on reload)
      const sentMessageWithAttachment = attachmentData ? { ...sentMessage, ...attachmentData } : sentMessage;

      // Add the new message to the local state for immediate UI update
      setMessages(prev => [...prev, sentMessageWithAttachment]);

      // Update conversations
      setConversations(prev =>
        prev.map(conv =>
          conv.participants.includes(selectedContact!)
            ? { ...conv, lastMessage: sentMessage, updatedAt: sentMessage.timestamp }
            : conv
        )
      );

      // Cleanup
      setNewMessage('');
      setReplyingTo(null);
      pendingFiles.forEach((_, index) => {
        if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
      });
      setPendingFiles([]);
      setPreviewUrls([]);

      showToast('Message sent');

      // 🟢 MOCK REPLY SEQUENCE START
      setIsTyping(true);

      // 1. Show typing indicator after short delay
      setTimeout(() => {
        // 2. After "typing" for 2.5s, send mock reply
        setTimeout(() => {
          setIsTyping(false);

          const mockReply: Message = {
            id: `mock-reply-${Date.now()}`,
            senderId: selectedContact,
            receiverId: currentUser.id,
            content: "Thanks for your message! Let's discuss this further. 👋",
            timestamp: new Date().toISOString(),
            isRead: false,
          };

          // Add to messages
          setMessages(prev => [...prev, mockReply]);

          // Update conversation list
          setConversations(prev =>
            prev.map(conv =>
              conv.participants.includes(selectedContact!)
                ? { ...conv, lastMessage: mockReply, updatedAt: mockReply.timestamp }
                : conv
            )
          );
        }, 2500); // Typing duration
      }, 800); // Delay before typing starts
      // 🟢 MOCK REPLY SEQUENCE END

    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Failed to send message', 'error');
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 120);
    e.target.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startCall = (type: CallType) => {
    if (!selectedContact) return;

    // Show connecting state
    setCallState(prev => ({
      ...prev,
      status: 'connecting',
      type,
      isMuted: false,
      isCameraOff: type === 'audio', // Camera off by default for audio calls
      startTime: null,
    }));

    // Mock connection delay (1.5s)
    setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        status: 'active',
        startTime: Date.now(),
      }));

      // Start timer
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      setCallState(prev => ({ ...prev, timerInterval: interval }));

      showToast(`Connected to ${findUserById(selectedContact)?.name}`, 'success');

      // Mock local video stream (for video calls)
      if (type === 'video' && localVideoRef.current) {
        // In real app: navigator.mediaDevices.getUserMedia(...)
        // For mock: use a placeholder video or canvas
        localVideoRef.current.srcObject = null; // Would attach real stream here
      }
    }, 1500);
  };

  const endCall = () => {
    // Clear timer
    if (callState.timerInterval) {
      clearInterval(callState.timerInterval);
    }

    // Show ended state briefly for animation
    setCallState(prev => ({ ...prev, status: 'ended' }));

    // Reset after animation
    setTimeout(() => {
      setCallState({
        status: 'idle',
        type: null,
        isMuted: false,
        isCameraOff: false,
        startTime: null,
        timerInterval: null,
      });
      setCallDuration(0);
    }, 300);

    showToast('Call ended', 'success');
  };

  const toggleMute = () => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    showToast(callState.isMuted ? 'Unmuted' : 'Muted', 'success');
  };

  const toggleCamera = () => {
    if (callState.type !== 'video') return;
    setCallState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
    showToast(callState.isCameraOff ? 'Camera on' : 'Camera off', 'success');
  };

  // Updated handlers
  const handleVideoCall = () => startCall('video');
  const handlePhoneCall = () => startCall('audio');

  const handleSearch = () => {
    alert('Search functionality coming soon!');
  };

  const handleMoreOptions = () => {
    alert('More options menu coming soon!');
  };

  const handleAttachment = () => {
    // Trigger the hidden input
    const input = document.querySelector('[data-dropzone-input]') as HTMLInputElement;
    input?.click();
  };

  const handleMicToggle = () => {
    alert('Voice recording coming soon!');
  };

  const handleContactSelect = async (contactId: string) => {
    setSelectedContact(contactId);
    setShowContactInfo(false); // Close contact info when switching conversations

    // Close sidebar on mobile when selecting conversation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // Mark conversation as read when opened
    if (currentUser) {
      try {
        await markMessagesAsReadCustom(currentUser.id, contactId);
        // Update local state to reflect read status
        setConversations(prev =>
          prev.map(conv =>
            conv.participants.includes(contactId)
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (err) {
        console.error('Error marking conversation as read:', err);
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (activeMessageId) {
        setActiveMessageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMessageId]);

  if (!currentUser) {
    return (
<div className="loading-screen messages-loading-container flex items-center justify-center min-h-screen">
<div className="spinner messages-loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages-error-container flex items-center justify-center min-h-screen">
        <div className="messages-error-content text-center">
          <div className="messages-error-message text-red-600 mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="messages-error-retry-button px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatpage-main-container">
      <main className="chatpage-container flex bg-[#F0F2F5] font-sans overflow-hidden transition-all duration-300 relative h-[calc(100vh-160px)] w-full rounded-2xl border border-[#E9EDEF]">
        <aside className={`messages-sidebar bg-[#FFFFFF] flex flex-col border-r border-[#E9EDEF] transition-all duration-300 z-30 w-[360px] shrink-0 ${isSidebarOpen ? '' : 'hidden'}`}>
          <div className="sidebar-header h-16 bg-[#F0F2F5] px-4 flex items-center justify-between shrink-0">
            <div className="sidebar-avatar-section flex items-center gap-3">
              <div className="avatar-wrapper w-10 h-10 cursor-pointer">
                <div className="avatar-container relative inline-block">
                  <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg" alt="Michael Rodriguez" className="avatar-image rounded-full object-cover h-12 w-12 h-8 w-8" />
                </div>
              </div>
            </div>
            <div className="sidebar-header-actions flex items-center gap-5 text-[#54656F]">
              <button onClick={handleMoreOptions} className="hover:text-[#111B21] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
              </button>
              <button onClick={handleMoreOptions} className="hover:text-[#111B21] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div className="sidebar-search-container px-3 py-2 shrink-0">
            <div className="search-input-wrapper bg-[#F0F2F5] rounded-lg h-9 flex items-center px-3 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-[#54656F]">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input type="text" placeholder="Search or start new chat" className="search-input bg-transparent border-none focus:ring-0 text-[14px] text-[#111B21] placeholder:text-[#667781] w-full" />
            </div>
          </div>

          <div className="conversations-list flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              // Loading skeleton for conversations
              <div className="loading-skeleton-container p-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-item h-[72px] flex items-center px-3 gap-3 mb-2">
                    <div className="skeleton-avatar w-[49px] h-[49px] bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="skeleton-content flex-1">
                      <div className="skeleton-name h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="skeleton-message h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.map(conversation => {
              const partnerId = conversation.participants.find(p => p !== currentUser?.id);
              if (!partnerId) return null;

              const partner = findUserById(partnerId);
              if (!partner) return null;

              const isActive = selectedContact === partnerId;
              const lastMessage = conversation.lastMessage;
              const hasUnread = lastMessage && !lastMessage.isRead && lastMessage.receiverId === currentUser?.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => handleContactSelect(partnerId)}
                  className={`conversation-item h-[72px] flex items-center px-3 gap-3 cursor-pointer transition-colors border-b border-[#F0F2F5] last:border-0 ${
                    isActive ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'
                  }`}
                >
                  <div className="conversation-avatar-container relative shrink-0">
                    <div className="avatar-wrapper w-[49px] h-[49px] rounded-full">
                      <div className="avatar-container relative inline-block">
                        <img
                          src={partner.avatarUrl}
                          alt={partner.name}
                          className="avatar-image rounded-full object-cover h-12 w-12 h-10 w-10"
                        />
                      </div>
                    </div>
                    {partner.isOnline && (
                      <span className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00A884] rounded-full ring-2 ring-white"></span>
                    )}
                  </div>
                  <div className="conversation-content flex-1 overflow-hidden flex flex-col justify-center">
                    <div className="conversation-header flex justify-between items-center mb-1">
                      <span className={`text-[15px] font-medium truncate ${isActive ? 'text-[#111B21]' : 'text-[#111B21]'}`}>
                        {partner.name}
                      </span>
                      <span className={`text-[12px] shrink-0 ${hasUnread ? 'text-[#405CFF] font-medium' : 'text-[#667781]'}`}>
                        {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="conversation-footer flex justify-between items-center">
                      <div className="flex items-center gap-1 truncate text-[13px] text-[#667781] max-w-[200px]">
                        {lastMessage?.senderId === currentUser?.id && (
                          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="ml-1">
                            <path d="M1 6L5.5 10.5L15 1" stroke="#8696A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M6 6L10.5 10.5L19.5 1" stroke="#8696A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4.5 0)"></path>
                          </svg>
                        )}
                        <span className="truncate">{lastMessage?.content || 'No messages yet'}</span>
                      </div>
                      {hasUnread && (
                        <div className="w-5 h-5 bg-[#405CFF] text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
                          1
                        </div>
                      )}
                    </div>
                  </div>
                </div>
               );
            })}
            {!isLoading && conversations.length === 0 && (
              <div className="empty-conversations flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500">Start a conversation to see your messages here.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="chat-section flex-1 flex flex-col relative overflow-hidden transition-all duration-300 flex">
          <header className="chat-header h-16 bg-[#F0F2F5] border-b border-[#E9EDEF] px-4 flex items-center justify-between shrink-0 z-10">
            {selectedContact && currentUser ? (
              <div className="chat-user-info flex items-center gap-3">
                <div
                  className="chat-user-clickable flex items-center gap-3 cursor-pointer"
                  onClick={() => setShowContactInfo(true)}
                >
                  <div className="chat-avatar-container relative">
                    <div className="avatar-wrapper w-10 h-10">
                      <div className="avatar-container relative inline-block">
                        <img
                          src={findUserById(selectedContact)?.avatarUrl || ''}
                          alt={findUserById(selectedContact)?.name || ''}
                          className="avatar-image rounded-full object-cover h-12 w-12 h-8 w-8"
                        />
                      </div>
                    </div>
                    {(findUserById(selectedContact)?.isOnline) && (
                      <span className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00A884] rounded-full ring-2 ring-[#F0F2F5]"></span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-medium text-[#111B21] leading-tight">
                      {findUserById(selectedContact)?.name || 'Unknown User'}
                    </h2>
                    <p className="text-[13px] text-[#667781]">
                      {findUserById(selectedContact)?.isOnline ? <span className="text-[#00A884]">Online</span> : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="chat-no-contact flex items-center gap-3">
                <div className="no-contact-avatar w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-medium text-[#111B21] leading-tight">Select a conversation</h2>
                  <p className="text-[13px] text-[#667781]">Choose a contact to start messaging</p>
                </div>
              </div>
            )}
            <div className="chat-header-actions flex items-center gap-4 text-[#54656F]">
              {/* Sidebar Toggle - Only show on mobile */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21] lg:hidden"
              >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>
              <button onClick={handleVideoCall} className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]">
                <Video size={20} />
              </button>
              <button onClick={handlePhoneCall} className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]">
                <Phone size={20} />
              </button>
              <button onClick={handleSearch} className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]">
                <Search size={20} />
              </button>
              <button onClick={handleMoreOptions} className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors hover:text-[#111B21]">
                <MoreVertical size={20} />
              </button>
            </div>
          </header>

          <div className="messages-area flex-1 overflow-y-auto px-[8%] py-4 bg-[#EFEAE2] custom-scrollbar relative" style={{ backgroundImage: 'radial-gradient(rgb(209, 215, 219) 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}>
            {messages.length > 0 ? (
              <div className="messages-container flex flex-col">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === currentUser?.id;
                  const prevMessage = messages[index - 1];
                  const showDateSeparator = !prevMessage ||
                    new Date(message.timestamp).toDateString() !== new Date(prevMessage.timestamp).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDateSeparator && (
                        <div className="date-separator text-[12.5px] text-[#667781] bg-[rgba(225,221,214,0.9)] px-4 py-1 rounded-full mx-auto my-4 w-fit select-none">
                          {new Date(message.timestamp).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                })}

</div>
                      )}

                      <div className={`message-wrapper flex w-full group relative ${index === 0 ? 'mt-2' : 'mt-2'}`}>
                        <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                          isOwn ? 'right-[100%]' : 'left-[100%]'
                        }`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
                          <button
                            className="context-menu-button p-1 rounded-full hover:bg-[#E9EDEF] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              handleContextMenu(message.id, rect.left, rect.top);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical text-[#8696A0]">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="12" cy="5" r="1"></circle>
                              <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                          </button>
                        </div>
                        <div className={`message-bubble relative px-3 py-2 shadow-sm max-w-[65%] rounded-[8px] text-[#111B21] text-[14.2px] leading-[19px] ${
                          isOwn
                            ? 'bg-[#D9FDD3] rounded-tr-[0px] ml-auto'
                            : 'bg-[#FFFFFF] rounded-tl-[0px] mr-auto'
                        }`}>
                          {/* Reply indicator */}
                          {message.replyTo && message.replyContent && (
                            <div className="reply-indicator bg-gray-50 border-l-4 border-gray-300 pl-3 py-2 mb-2 rounded">
                              <p className="text-xs text-gray-600 mb-1">
                                Replying to {message.senderId === currentUser?.id ? 'yourself' :
                                  findUserById(messages.find(m => m.id === message.replyTo)?.senderId || '')?.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{message.replyContent}</p>
                            </div>
                          )}

                          <div className="message-content whitespace-pre-wrap break-words">
                            <span>{message.content}</span>
                          </div>

                          {/* Attachment Display */}
                          {message.attachmentUrl && (
                            <div className="attachment-container mt-2">
                              {message.attachmentType === 'image' && (
                                <img
                                  src={message.attachmentUrl}
                                  alt={message.attachmentName}
                                  className="max-w-full max-h-64 rounded-lg cursor-pointer"
                                  onClick={() => window.open(message.attachmentUrl, '_blank')}
                                />
                              )}
                              {message.attachmentType === 'video' && (
                                <video
                                  src={message.attachmentUrl}
                                  controls
                                  className="max-w-full max-h-64 rounded-lg"
                                />
                              )}
                              {message.attachmentType === 'file' && (
                                <a
                                  href={message.attachmentUrl}
                                  download={message.attachmentName}
                                  className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{message.attachmentName}</p>
                                    <p className="text-xs text-gray-500">{message.attachmentSize ? `${(message.attachmentSize / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Message Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="reactions-container flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction, index) => (
                                <span
                                  key={`${reaction.emoji}-${reaction.userId}-${index}`}
                                  className="reaction inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full"
                                  title={`Reacted by ${reaction.userId}`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-gray-600">1</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className={`message-footer flex justify-end items-center gap-1 mt-1 select-none text-right`}>
                            <span className="text-[11px] text-[#667781] min-w-fit">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="ml-1">
                                <path d="M1 6L5.5 10.5L15 1" stroke="#8696A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M6 6L10.5 10.5L19.5 1" stroke="#8696A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4.5 0)"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* 🔹 TYPING INDICATOR UI */}
                {isTyping && (
                  <div className="typing-indicator-wrapper flex w-full mt-2">
                    <div className="typing-bubble bg-[#FFFFFF] px-3 py-2 shadow-sm rounded-[8px] rounded-tl-[0px] max-w-fit flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-messages h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500 text-center">Choose a contact from the sidebar to start messaging</p>
              </div>
            )}
          </div>

          <div className="input-area h-auto bg-[#F0F2F5] border-t border-[#E9EDEF] px-4 py-3 shrink-0 z-10">
            {/* Reply Indicator */}
            {replyingTo && (
              <div className="input-reply-indicator bg-[#F0F2F5] border-l-4 border-[#405CFF] px-3 py-2 mb-3 flex justify-between items-start rounded">
                <div className="flex-1">
                  <p className="text-[13px] text-[#405CFF] font-semibold">
                    Replying to {replyingTo.senderId === currentUser?.id ? 'yourself' : findUserById(replyingTo.senderId)?.name}
                  </p>
                  <p className="text-[13px] text-[#667781] truncate max-w-[85%]">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-[#54656F] hover:text-[#111B21] ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Attachment Preview Chips */}
            {pendingFiles.length > 0 && (
              <div className="attachments-preview flex flex-wrap gap-2 px-2 pb-2">
                {pendingFiles.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  const isVideo = file.type.startsWith('video/');
                  const previewUrl = previewUrls[idx];
                  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

                  return (
                    <div key={`${file.name}-${idx}`} className="attachment-item relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {isImage && previewUrl && (
                        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                      )}
                      {isVideo && previewUrl && (
                        <video src={previewUrl} className="w-full h-full object-cover" />
                      )}
                      {!isImage && !isVideo && (
                        <div className="flex flex-col items-center justify-center h-full text-[10px] text-gray-500">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="truncate max-w-[60px]">{file.name.split('.').pop()?.toUpperCase()}</span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          setPendingFiles(prev => prev.filter((_, i) => i !== idx));
                          setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 truncate">
                        {file.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hidden input + dropzone wrapper */}
            <div
              {...getRootProps()}
              className={`dropzone-wrapper hidden ${isDragActive ? 'bg-[#E0F2FE] border-2 border-dashed border-[#405CFF] rounded-lg p-4 text-center' : ''}`}
            >
              <input {...getInputProps()} data-dropzone-input />
              {isDragActive ? (
                <p className="text-[#405CFF] text-sm font-medium">Drop files here...</p>
              ) : null}
            </div>

            <div className="input-wrapper flex items-end gap-3 relative">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" x2="9.01" y1="9" y2="9"></line>
                  <line x1="15" x2="15.01" y1="9" y2="9"></line>
                </svg>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-lg shadow-lg">
                  <Picker
                    data={data}
                    set="joypixels"
                    onEmojiSelect={(emoji: any) => {
                      setNewMessage(prev => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
                    theme="light"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
              <button onClick={handleAttachment} className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <div className="flex-1 bg-[#FFFFFF] rounded-[8px] flex items-center px-4 py-2">
                <textarea
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message"
                  rows={1}
                  className="message-textarea flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-[#111B21] placeholder:text-[#8696A0] resize-none"
                  style={{ minHeight: '42px', maxHeight: '120px', height: '42px' }}
                ></textarea>
              </div>

              {newMessage.trim() || pendingFiles.length > 0 ? (
                <button
                  onClick={handleSendMessage}
                  className="w-[42px] h-[42px] bg-[#405CFF] rounded-full flex items-center justify-center text-white hover:bg-[#3451E0] active:scale-95 transition-all shadow-sm mb-1"
                >
                  <SendHorizontal size={20} />
                </button>
              ) : (
                <button onClick={handleMicToggle} className="text-[#54656F] hover:text-[#405CFF] transition-colors mb-1">
                  <Mic size={24} />
                </button>
              )}
                
              
            </div>
          </div>

          {/* Contact Info Drawer */}
          <div className={`contact-info-drawer absolute right-0 top-0 h-full bg-[#FFFFFF] border-l border-[#E9EDEF] z-20 transition-transform duration-300 ease-in-out flex flex-col ${showContactInfo ? 'translate-x-0' : 'translate-x-full'} w-[340px]`}>
            <div className="drawer-header h-16 bg-[#F0F2F5] border-b border-[#E9EDEF] px-4 flex items-center gap-4 shrink-0">
              <button
                onClick={() => setShowContactInfo(false)}
                className="p-2 -ml-2 text-[#54656F] hover:text-[#111B21] hover:bg-[#F0F2F5] rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
              <h2 className="text-[16px] font-medium text-[#111B21]">Contact Info</h2>
            </div>

            <div className="drawer-content flex-1 overflow-y-auto custom-scrollbar">
              {selectedContact && (
                <div className="contact-info-section bg-[#FFFFFF] flex flex-col items-center py-8 px-6 border-b border-[#E9EDEF]">
                  <div className="contact-avatar-container relative">
                    <div className="avatar-wrapper w-[200px] h-[200px] rounded-full">
                      <div className="avatar-container-right-panel relative inline-block">
                        <img
                          src={findUserById(selectedContact)?.avatarUrl || ''}
                          alt={findUserById(selectedContact)?.name || ''}
                          className="avatar-image rounded-full object-cover h-12 w-12 h-16 w-16"
                        />
                      </div>
                    </div>
                    {(findUserById(selectedContact)?.isOnline) && (
                      <span className="right-panel-profile-status absolute bottom-4 right-4 w-[14px] h-[14px] bg-[#00A884] border-4 border-white rounded-full"></span>
                    )}
                  </div>
                  <h3 className="contact-name text-[20px] font-semibold text-[#111B21] mt-4">
                    {findUserById(selectedContact)?.name || 'Unknown User'}
                  </h3>
                  <p className="contact-role text-[14px] text-[#667781] mt-1">
                    {findUserById(selectedContact)?.role === 'entrepreneur' ? 'Entrepreneur' : 'Investor'}
                  </p>
                  <p className="contact-online-status text-[13px] text-[#00A884] mt-1">
                    {findUserById(selectedContact)?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              )}

              <div className="contact-actions-section bg-[#FFFFFF] flex justify-center gap-8 py-4 border-b border-[#E9EDEF]">
                <button className="contact-action-button flex flex-col items-center gap-2 group">
                  <div className="action-icon-container w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle text-[#405CFF]">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    </svg>
                  </div>
                  <span className="action-label text-[12px] text-[#405CFF] font-medium">Message</span>
                </button>
                <button className="contact-action-button flex flex-col items-center gap-2 group">
                  <div className="action-icon-container w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone text-[#405CFF]">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <span className="action-label text-[12px] text-[#405CFF] font-medium">Call</span>
                </button>
                <button className="contact-action-button flex flex-col items-center gap-2 group">
                  <div className="action-icon-container w-12 h-12 bg-[#F0F6FF] rounded-full flex items-center justify-center group-hover:bg-[#E0E7FF] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video text-[#405CFF]">
                      <path d="m22 8-6 4 6 4V8Z"></path>
                      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
                    </svg>
                  </div>
                  <span className="action-label text-[12px] text-[#405CFF] font-medium">Video</span>
                </button>
              </div>

              <div className="contact-details-section bg-[#FFFFFF] px-6 py-4 space-y-2">
                {selectedContact && findUserById(selectedContact)?.email && (
                  <div className="contact-detail-item flex items-start gap-5 py-3 border-b border-[#F0F2F5] pb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail text-[#8696A0] mt-0.5 shrink-0">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    <div className="detail-content flex-1">
                      <p className="detail-label text-[13px] text-[#667781]">Email                      </p>
                      <a
                        href={`mailto:${findUserById(selectedContact)?.email}`}
                        className="detail-value text-[14px] text-[#405CFF] font-medium hover:underline block truncate"
                      >
                        {findUserById(selectedContact)?.email}
                      </a>
                    </div>
                  </div>
                )}
                <div className="contact-detail-item flex items-start gap-5 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar text-[#8696A0] mt-0.5 shrink-0">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  <div className="detail-content">
                    <p className="detail-label text-[13px] text-[#667781]">Member Since                    </p>
                    <p className="detail-value text-[14px] text-[#111B21] font-medium">March 2024</p>
                  </div>
                </div>
              </div>

              <div className="contact-danger-section bg-[#FFFFFF] mt-2 px-6 py-2 border-t border-[#E9EDEF]">
                {selectedContact && (
                  <>
                    <button className="danger-button w-full flex items-center gap-4 py-4 text-[#EA0038] text-[15px] hover:bg-[#F0F2F5] px-4 -mx-4 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ban">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m4.9 4.9 14.2 14.2"></path>
                      </svg>
                      <span>Block {findUserById(selectedContact)?.name || 'User'}</span>
                    </button>
                    <button className="danger-button w-full flex items-center gap-4 py-4 text-[#EA0038] text-[15px] hover:bg-[#F0F2F5] px-4 -mx-4 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flag">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                        <line x1="4" x2="4" y1="22" y2="15"></line>
                      </svg>
                      <span>Report {findUserById(selectedContact)?.name || 'User'}</span>
                    </button>
                  </>
                )}
              </div>

              <div className="drawer-spacer h-8"></div>
            </div>
          </div>

          {/* Context Menu */}
          {activeMessageId && (
            <div
              className="context-menu fixed bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] w-52 py-1.5 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-150"
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            >
              <div className="context-menu-emojis flex items-center justify-between px-3 py-2 border-b border-[#F0F2F5]">
                {['👍', '❤️', '😂', '😮', '😢', '✊'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="emoji-button text-[22px] cursor-pointer hover:scale-125 transition-transform duration-150 select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={handleReply}
                className="context-menu-item flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corner-up-left text-[#8696A0]">
                  <polyline points="9,14 4,9 9,4"></polyline>
                  <path d="M20,20v-7a4,4 0 0,0-4-4H4"></path>
                </svg>
                Reply
              </button>
              <button
                onClick={handleCopy}
                className="context-menu-item flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy text-[#8696A0]">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4,16c-1.1,0-2-0.9-2-2V4c0-1.1,0.9-2,2-2h10c1.1,0,2,0.9,2,2"></path>
                </svg>
                Copy
              </button>
              <button className="context-menu-item flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-forward text-[#8696A0]">
                  <polyline points="15,17 20,12 15,7"></polyline>
                  <path d="M4,18v-2a4,4 0 0,1,4-4h12"></path>
                </svg>
                Forward
              </button>
              <button className="context-menu-item flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#111B21] hover:bg-[#F5F6F6] cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-[#8696A0]">
                  <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"></polygon>
                </svg>
                Star
              </button>
              <div className="context-menu-separator border-t border-[#F0F2F5] my-1"></div>
              <button
                onClick={handleDelete}
                className="context-menu-item flex items-center gap-3 w-full px-4 py-2.5 text-[14.5px] text-[#EA0038] hover:bg-[#FFF0F3] cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                  <path d="M3,6h18"></path>
                  <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
                Delete
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="modal-content bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Message</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
            <div className="modal-actions flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="modal-cancel-button px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="modal-delete-button px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* ===== CALL OVERLAY MOCKUP ===== */}
      {callState.status !== 'idle' && selectedContact && (
        <div className={`call-overlay fixed inset-0 z-[400] flex flex-col items-center justify-center transition-all duration-300 ${
          callState.status === 'ended' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } ${callState.type === 'video' ? 'bg-black' : 'bg-gradient-to-br from-slate-900 to-slate-800'}`}>

          {/* Background pattern for audio calls */}
          {callState.type === 'audio' && (
            <div className="call-background-pattern absolute inset-0 opacity-10"
                 style={{ backgroundImage: 'radial-gradient(circle, #405CFF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          )}

          {/* Connecting State */}
          {callState.status === 'connecting' && (
            <div className="call-connecting text-center z-10">
              <div className="call-avatar-container relative mb-6">
                <div className="call-avatar-wrapper w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <img
                    src={findUserById(selectedContact)?.avatarUrl || ''}
                    alt="Contact"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                  />
                </div>
                <div className="call-ping-ring absolute inset-0 rounded-full border-4 border-blue-400/50 animate-ping" />
              </div>
              <h3 className="call-title text-white text-xl font-medium mb-2">
                Calling {findUserById(selectedContact)?.name}...
              </h3>
              <p className="call-subtitle text-white/70 text-sm">
                {callState.type === 'video' ? 'Video call' : 'Voice call'} • {callState.isMuted ? 'Muted' : 'Speaking'}
              </p>
            </div>
          )}

          {/* Active Call State */}
          {callState.status === 'active' && (
            <>
              {/* Remote video / avatar */}
              <div className="call-remote-video-container relative z-10 mb-8">
                {callState.type === 'video' ? (
                  <div className="call-remote-video w-72 h-96 bg-slate-700 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Mock remote video - replace with <video> later */}
                    <div className="call-remote-placeholder w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800">
                      <div className="text-center">
                        <img
                          src={findUserById(selectedContact)?.avatarUrl || ''}
                          alt="Remote"
                          className="w-24 h-24 rounded-full mx-auto mb-4 opacity-80"
                        />
                        <p className="text-white/80 text-sm">Remote video stream</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Audio call avatar
                  <div className="call-audio-avatar w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <img
                      src={findUserById(selectedContact)?.avatarUrl || ''}
                      alt="Contact"
                      className="w-28 h-28 rounded-full object-cover border-4 border-white/30"
                    />
                  </div>
                )}

                {/* Online indicator */}
                <div className="call-online-indicator absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-slate-900" />
              </div>

              {/* Caller name & timer */}
              <div className="call-info text-center z-10 mb-8">
                <h3 className="call-name text-white text-2xl font-semibold mb-1">
                  {findUserById(selectedContact)?.name}
                </h3>
                <p className="call-type text-white/70 text-sm mb-3">
                  {callState.type === 'video' ? 'Video call' : 'Voice call'}
                </p>
                <div className="call-timer inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <span className="text-white font-mono text-lg">{formatDuration(callDuration)}</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Local video preview (video calls only) */}
              {callState.type === 'video' && !callState.isCameraOff && (
                <div className="call-local-video absolute bottom-24 right-6 w-32 h-24 bg-slate-700 rounded-xl overflow-hidden shadow-lg border border-white/20 z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Fallback for mock */}
                  {!localVideoRef.current?.srcObject && (
                    <div className="call-local-fallback absolute inset-0 flex items-center justify-center bg-slate-600/50">
                      <span className="text-white/70 text-xs">Local preview</span>
                    </div>
                  )}
                </div>
              )}

              {/* Camera off indicator */}
              {callState.type === 'video' && callState.isCameraOff && (
                <div className="call-camera-off-indicator absolute bottom-24 right-6 w-32 h-24 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-white/20 z-20">
                  <div className="text-center">
<VideoOff className="w-8 h-8 text-white/50 mx-auto mb-1" />
                    <span className="text-white/70 text-xs">Camera off</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Control Bar */}
          <div className="call-controls fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="call-controls-bar flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-full border border-white/10 shadow-xl">
              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className={`call-mute-button p-3 rounded-full transition-all ${
                  callState.isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={callState.isMuted ? 'Unmute' : 'Mute'}
              >
                {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Toggle (video only) */}
              {callState.type === 'video' && (
                <button
                  onClick={toggleCamera}
                  className={`call-camera-button p-3 rounded-full transition-all ${
                    callState.isCameraOff
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={callState.isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {callState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Speaker Toggle (mock) */}
              <button
                className="call-speaker-button p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                title="Speaker"
              >
<Volume2 className="w-5 h-5" />
              </button>

              {/* Divider */}
              <div className="call-controls-divider w-px h-6 bg-white/20 mx-1" />

              {/* Hang Up */}
              <button
                onClick={endCall}
                className="call-end-button p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg hover:shadow-red-500/25 active:scale-95"
                title="End call"
              >
<X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Status Toast */}
          {(callState.isMuted || callState.isCameraOff) && callState.status === 'active' && (
            <div className="call-status-toast fixed top-6 left-1/2 -translate-x-1/2 z-30">
              <div className="call-status-message bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                {callState.isMuted && <span>Muted </span>}
                {callState.isCameraOff && callState.type === 'video' && <span>| Camera off</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
