import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SendHorizontal, Mic, MicOff, Video, VideoOff, Volume2, X, PanelLeftClose, PanelLeftOpen, Phone, Search, MoreVertical, User, Maximize2, Reply, ArrowRight, Star, Edit2, Copy, Trash2, Plus } from 'lucide-react';
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
  deleteMessageCustom,
  updateMessageCustom
} from '../../utils/messagesDB';

export const MessagesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { contactId } = useParams<{ contactId: string }>();
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, messageId: string | null }>({ 
    x: 0, 
    y: 0, 
    visible: false,
    messageId: null
  });
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState<Message | null>(null);

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  useDropzone({
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

        // Auto-select conversation based on URL param or first available
        if (contactId) {
          setSelectedContact(contactId);
        } else if (userConversations.length > 0) {
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
    setContextMenu({ x, y, visible: true, messageId });
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

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setActiveMessageId(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleStarMessage = async (activeMessageId: string) => {
    if (!activeMessageId) return;
    const message = messages.find(m => m.id === activeMessageId);
    if (!message) return;
    try {
      const updatedMessage = {
        ...message,
        isStarred: !message.isStarred
      };
      const success = await updateMessageCustom(updatedMessage);
      if (success) {
        setMessages(prev => prev.map(m => m.id === message.id ? updatedMessage : m));
        showToast(updatedMessage.isStarred ? 'Message starred' : 'Message unstarred', 'success');
      }
    } catch (err) {
      showToast('Failed to update message', 'error');
    }
    setActiveMessageId(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    setReplyingTo(null);
    setActiveMessageId(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !newMessage.trim()) return;

    try {
      const updatedMessage = {
        ...editingMessage,
        content: newMessage.trim(),
        isEdited: true
      };

      const success = await updateMessageCustom(updatedMessage);
      if (success) {
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? updatedMessage : m));
        setEditingMessage(null);
        setNewMessage('');
        showToast('Message edited');
      } else {
        showToast('Failed to save edit', 'error');
      }
    } catch (err) {
      console.error('Error editing message:', err);
      showToast('Failed to edit message', 'error');
    }
  };

  const handleForwardMessage = (message: Message) => {
    setShowForwardModal(message);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleForwardToContact = async (targetContactId: string) => {
    if (!showForwardModal || !currentUser) return;

    try {
      const originalSender = findUserById(showForwardModal.senderId);
      const forwardedMessage: Omit<Message, "id" | "timestamp" | "isRead" | "reactions" | "isStarred" | "isDeleted"> = {
        senderId: currentUser.id,
        receiverId: targetContactId,
        content: showForwardModal.content,
        attachmentUrl: showForwardModal.attachmentUrl,
        attachmentType: showForwardModal.attachmentType,
        attachmentName: showForwardModal.attachmentName,
        attachmentSize: showForwardModal.attachmentSize,
        isForwarded: true,
        forwardedFrom: originalSender?.name || 'Unknown'
      };

      const sent = await sendMessageCustom(forwardedMessage);

      if (targetContactId === selectedContact) {
        setMessages(prev => [...prev, sent]);
      }

      setShowForwardModal(null);
      showToast('Message forwarded');
    } catch (err) {
      console.error('Error forwarding message:', err);
      showToast('Failed to forward', 'error');
    }
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
    if ((!newMessage.trim() && pendingFiles.length === 0) || !selectedContact || !currentUser) return;

    if (editingMessage) {
      handleSaveEdit();
      return;
    }

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
    return null;
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
                  className={`conversation-item h-[72px] flex items-center px-3 gap-3 cursor-pointer transition-colors border-b border-[#F0F2F5] last:border-0 ${isActive ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6]'
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
                        <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isOwn ? 'right-[-3%]' : 'left-[-3%]'
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
                        <div className={`message-bubble relative px-3 py-2 shadow-sm max-w-[65%] rounded-[8px] text-[#111B21] text-[14.2px] leading-[19px] ${isOwn
                          ? 'bg-[#D9FDD3] rounded-tr-[0px] ml-auto'
                          : 'bg-[#FFFFFF] rounded-tl-[0px] mr-auto'
                          }`}>
                          {/* Forward indicator */}
                          {message.isForwarded && (
                            <div className="forward-indicator flex items-center gap-1.5 mb-1.5 opacity-70 italic text-[12.5px] text-[#667781]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-forward"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                              <span>Forwarded from {message.forwardedFrom || 'Unknown'}</span>
                            </div>
                          )}

                          {/* Reply indicator */}
                          {message.replyTo && (
                            <div className="reply-indicator mb-2 p-2 bg-gray-50 border-l-4 border-gray-300 rounded">
                              <p className="reply-to-text text-xs text-gray-600 font-semibold">
                                Replying to {findUserById(messages.find(m => m.id === message.replyTo)?.senderId || '')?.name}
                              </p>
                              <p className="reply-content text-xs text-gray-500 truncate">{message.replyContent}</p>
                            </div>
                          )}

                          <div className="message-content whitespace-pre-wrap break-words">
                            <span>{message.content}</span>
                            {message.isEdited && (
                              <span className="edited-badge text-[10px] text-[#667781] ml-1.5 italic">(Edited)</span>
                            )}
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
                            {message.isStarred && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-star mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            )}
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

          <div className="input-area bg-[#F0F2F5] border-t border-[#E9EDEF] px-2 py-3 lg:px-6 shrink-0 z-20">
            <div className="input-container-inner flex items-end gap-3 max-w-[1200px] mx-auto">
              {/* Plus Action Button */}
              <button
                onClick={handleAttachment}
                className="p-2 mb-1 text-[#405CFF] hover:bg-[#E1E6E9] rounded-full transition-all active:scale-90"
              >
                <Plus size={28} />
              </button>

              {/* Central Input Box with Reply Slate */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E9EDEF] overflow-hidden flex flex-col transition-all duration-200">
                {/* 1. Reply Slate (Pixel-perfect redesign) */}
                {replyingTo && (
                  <div className="reply-slate bg-[#F8F9FA]/80 backdrop-blur-sm p-3 border-b border-[#F0F2F5] relative group animate-in slide-in-from-bottom-1 duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-6 border-l-[3px] border-[#405CFF] pl-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#405CFF] font-semibold text-[13px] tracking-tight">
                            {findUserById(replyingTo.senderId)?.name}
                          </span>
                          <span className="text-[#8696A0] text-[11px] font-normal">
                            {new Date(replyingTo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#667781] text-[13px] truncate mt-0.5 leading-tight italic">
                          "{replyingTo.content}"
                        </p>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-[#8696A0] hover:text-[#111B21] transition-colors p-1"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Edit Indicator (Optional, but good for UX) */}
                {editingMessage && (
                  <div className="edit-slate bg-[#FFF9EE] p-3 border-b border-[#FBE9D0] relative animate-in slide-in-from-bottom-1 duration-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[#E68A00]">
                        <Edit2 size={14} />
                        <span className="text-[13px] font-medium">Editing message</span>
                      </div>
                      <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-[#E68A00]"><X size={14} /></button>
                    </div>
                  </div>
                )}

                {/* 3. Attachment Preview */}
                {pendingFiles.length > 0 && (
                  <div className="px-3 pt-3 flex flex-wrap gap-2 border-b border-[#F0F2F5]">
                    {pendingFiles.map((file, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        {previewUrls[idx] ? (
                          <img src={previewUrls[idx]} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-gray-400">
                            {file.name.split('.').pop()}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setPendingFiles(prev => prev.filter((_, i) => i !== idx));
                            setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Main Textarea */}
                <div className="flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    className="message-textarea w-full px-4 py-3 bg-transparent border-none text-[15px] text-[#111B21] placeholder:text-[#8696A0] resize-none overflow-y-auto"
                    style={{ minHeight: '44px', maxHeight: '160px', height: '44px' }}
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-3 text-[#54656F] hover:text-[#405CFF] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-[10%] right-4 mb-2 z-[60] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                      <Picker
                        data={data}
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
                </div>
              </div>

              {/* Send or Voice Button */}
              {newMessage.trim() || pendingFiles.length > 0 ? (
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 mb-1 bg-[#405CFF] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                >
                  <SendHorizontal size={22} className="ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleMicToggle}
                  className="w-12 h-12 mb-1 text-[#54656F] hover:bg-[#E1E6E9] rounded-full flex items-center justify-center transition-all"
                >
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
        </section>
      </main>

      {contextMenu.visible && (
        <div
          className="context-menu-wrapper fixed inset-0 z-[100] transition-opacity"
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <div
            className="context-menu fixed bg-[#FFFFFF] shadow-xl rounded-lg py-2 w-48 border border-[#E9EDEF] z-[101] animate-in slide-in-from-top-1 duration-150"
            style={{
              top: `${Math.min(contextMenu.y, window.innerHeight - 300)}px`,
              left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reaction-row flex items-center justify-between px-4 pb-2 mb-2 border-b border-[#F5F6F6]">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-[#F0F2F5]"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const targetId = contextMenu.messageId || activeMessageId;
                const msg = messages.find(m => m.id === targetId);
                if (msg) handleReply(msg);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#111B21] transition-colors"
            >
              <Reply size={18} className="text-[#54656F]" />
              <span>Reply</span>
            </button>
            <button
              onClick={() => {
                const targetId = contextMenu.messageId || activeMessageId;
                const msg = messages.find(m => m.id === targetId);
                if (msg) handleForwardMessage(msg);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#111B21] transition-colors"
            >
              <ArrowRight size={18} className="text-[#54656F]" />
              <span>Forward</span>
            </button>
            <button
              onClick={() => {
                const targetId = contextMenu.messageId || activeMessageId;
                if (targetId) handleStarMessage(targetId);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#111B21] transition-colors"
            >
              <Star
                size={18}
                className={messages.find(m => m.id === (contextMenu.messageId || activeMessageId))?.isStarred ? 'text-[#FF9F00] fill-[#FF9F00]' : 'text-[#54656F]'}
              />
              <span>{messages.find(m => m.id === (contextMenu.messageId || activeMessageId))?.isStarred ? 'Unstar' : 'Star'}</span>
            </button>
            <button
              onClick={() => {
                const targetId = contextMenu.messageId || activeMessageId;
                const msg = messages.find(m => m.id === targetId);
                if (msg) {
                  if (msg.senderId === currentUser?.id) handleEditMessage(msg);
                  else showToast('Can only edit own messages', 'error');
                }
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#111B21] transition-colors"
            >
              <Edit2 size={18} className="text-[#54656F]" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                handleCopy();
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#111B21] transition-colors"
            >
              <Copy size={18} className="text-[#54656F]" />
              <span>Copy</span>
            </button>
            <button
              onClick={() => {
                const targetId = contextMenu.messageId || activeMessageId;
                if (targetId) setShowDeleteConfirm(targetId);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className="menu-item w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F5F6F6] text-[#EA0038] transition-colors"
            >
              <Trash2 size={18} className="text-[#EA0038]" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForwardModal(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E9EDEF] flex items-center justify-between shrink-0">
              <h3 className="text-[18px] font-semibold text-[#111B21]">Forward message</h3>
              <button
                onClick={() => setShowForwardModal(null)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-3 bg-[#F8F9FA] border-b border-[#E9EDEF] shrink-0">
              <p className="text-[13px] text-[#667781] line-clamp-2 px-2 italic">
                "{showForwardModal.content}"
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <p className="px-4 py-2 text-[12px] font-semibold text-[#667781] uppercase tracking-wider">Recent chats</p>
              <div className="space-y-1">
                {conversations.map(conv => {
                  const otherId = conv.participants.find(p => p !== currentUser?.id);
                  const user = otherId ? findUserById(otherId) : null;
                  if (!user) return null;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleForwardToContact(user.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#F5F6F6] rounded-lg transition-colors group"
                    >
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-medium text-[#111B21]">{user.name}</p>
                        <p className="text-[13px] text-[#667781] truncate">{user.role}</p>
                      </div>
                      <ArrowRight size={18} className="text-[#405CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative bg-white w-full max-w-[400px] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center text-[#111B21]">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Message?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call UI */}
      {callState.status !== 'idle' && selectedContact && (
        <div className={`meet-call-overlay fixed inset-0 z-[500] flex flex-col items-center justify-center transition-all duration-500 ${callState.status === 'ended' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } bg-[#202124]`}>
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="meet-remote-video-wrap w-full h-full relative">
              <div className="w-full h-full bg-[#3c4043] flex items-center justify-center">
                <div className="text-center">
                  <img
                    src={findUserById(selectedContact)?.avatarUrl || ''}
                    alt="Remote"
                    className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white/10"
                  />
                  <p className="text-white/60 text-lg font-medium">{findUserById(selectedContact)?.name}</p>
                </div>
              </div>

              {!callState.isCameraOff && callState.type === 'video' && (
                <div className="meet-local-preview absolute bottom-24 right-6 w-48 h-32 md:w-64 md:h-44 bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-20 group transition-all hover:scale-[1.02]">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="meet-call-controls fixed bottom-8 left-0 right-0 flex justify-center z-[501]">
            <div className="meet-controls-pill flex items-center gap-4 bg-[#3c4043]/90 backdrop-blur-xl px-6 py-4 rounded-full border border-white/10 shadow-2xl">
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${callState.isMuted ? 'bg-red-500 text-white' : 'bg-[#e8eaed]/10 text-white hover:bg-[#e8eaed]/20'
                  }`}
              >
                {callState.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {callState.type === 'video' && (
                <button
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${callState.isCameraOff ? 'bg-red-500 text-white' : 'bg-[#e8eaed]/10 text-white hover:bg-[#e8eaed]/20'
                    }`}
                >
                  {callState.isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              <button
                onClick={endCall}
                className="w-14 h-14 bg-[#ea4335] text-white hover:bg-[#d93025] rounded-full flex items-center justify-center shadow-lg active:scale-90"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification fixed bottom-4 right-4 z-[2000] px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
