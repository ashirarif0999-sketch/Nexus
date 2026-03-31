import { Message, ChatConversation } from '../types';

// localStorage keys
const MESSAGES_STORAGE_KEY = 'nexuso_messages';
const STARRED_MESSAGES_KEY = 'nexuso_starred_messages';

// Default seed messages for demo
const DEFAULT_MESSAGES: Message[] = [
  // Conversation between Sarah (e1) and Michael (i1)
  {
    id: 'm1',
    senderId: 'e1',
    receiverId: 'i1',
    content: 'Thanks for connecting. I\'d love to discuss how our AI platform can revolutionize financial analytics for SMBs.',
    timestamp: '2023-08-15T10:15:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm2',
    senderId: 'i1',
    receiverId: 'e1',
    content: 'I\'m interested in learning more about your tech stack and ML models. Are you available for a call this week?',
    timestamp: '2023-08-15T10:30:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm3',
    senderId: 'e1',
    receiverId: 'i1',
    content: 'Absolutely! I can walk you through our technology and current traction. How does Thursday at 2pm PT work?',
    timestamp: '2023-08-15T10:45:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm4',
    senderId: 'i1',
    receiverId: 'e1',
    content: 'Thursday works great. I\'ll send a calendar invite. Looking forward to it!',
    timestamp: '2023-08-15T11:00:00Z',
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },

  // Conversation between Maya (e3) and Jennifer (i2)
  {
    id: 'm5',
    senderId: 'i2',
    receiverId: 'e3',
    content: 'I saw your pitch for HealthPulse and I\'m intrigued by your approach to mental healthcare accessibility.',
    timestamp: '2023-08-16T09:00:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm6',
    senderId: 'e3',
    receiverId: 'i2',
    content: 'Thank you, Jennifer! Mental health services need to be more accessible, especially in underserved communities.',
    timestamp: '2023-08-16T09:15:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm7',
    senderId: 'i2',
    receiverId: 'e3',
    content: 'I completely agree. Could you share more about your user acquisition strategy and current metrics?',
    timestamp: '2023-08-16T09:30:00Z',
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },

  // Conversation between David (e2) and Robert (i3)
  {
    id: 'm8',
    senderId: 'e2',
    receiverId: 'i3',
    content: 'Hello Robert, I noticed you invest in healthcare. While GreenLife is focused on sustainable packaging, we have some applications in medical supplies.',
    timestamp: '2023-08-17T14:00:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm9',
    senderId: 'i3',
    receiverId: 'e2',
    content: 'Interesting crossover, David. I\'d be interested in learning more about your biodegradable materials and how they could be used in healthcare.',
    timestamp: '2023-08-17T15:30:00Z',
    isRead: true,
    reactions: [],
    isStarred: false,
    isDeleted: false
  },
  {
    id: 'm10',
    senderId: 'e2',
    receiverId: 'i3',
    content: 'Great! We\'ve been developing materials that can safely package medical devices while being eco-friendly. Our tests show 40% less environmental impact.',
    timestamp: '2023-08-17T16:45:00Z',
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  }
];

// Initialize messages from localStorage or use defaults
export const loadMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all messages have the new fields
      return parsed.map((m: Message) => ({
        ...m,
        reactions: m.reactions || [],
        isStarred: m.isStarred || false,
        isDeleted: m.isDeleted || false
      }));
    }
    // Initialize with default messages
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
    return DEFAULT_MESSAGES;
  } catch (error) {
    console.error('Error loading messages from localStorage:', error);
    return DEFAULT_MESSAGES;
  }
};

// Save messages to localStorage
export const saveMessages = (messages: Message[]): void => {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to localStorage:', error);
  }
};

// Get messages between two users (excluding deleted)
export const getMessagesBetweenUsers = (user1Id: string, user2Id: string): Message[] => {
  const messages = loadMessages();
  return messages
    .filter(m => !m.isDeleted && (
      (m.senderId === user1Id && m.receiverId === user2Id) ||
      (m.senderId === user2Id && m.receiverId === user1Id)
    ))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// Get all conversations for a user (only with non-deleted messages)
export const getConversationsForUser = (userId: string): ChatConversation[] => {
  const messages = loadMessages();
  
  // Get unique conversation partners (from non-deleted messages)
  const conversationPartners = new Set<string>();
  messages
    .filter(m => !m.isDeleted)
    .forEach(message => {
      if (message.senderId === userId) {
        conversationPartners.add(message.receiverId);
      }
      if (message.receiverId === userId) {
        conversationPartners.add(message.senderId);
      }
    });

  // Create conversation objects
  return Array.from(conversationPartners).map(partnerId => {
    const conversationMessages = getMessagesBetweenUsers(userId, partnerId);
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    
    return {
      id: `conv-${userId}-${partnerId}`,
      participants: [userId, partnerId],
      lastMessage,
      updatedAt: lastMessage?.timestamp || new Date().toISOString()
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

// Send a new message
export const sendMessage = (newMessage: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'reactions' | 'isStarred' | 'isDeleted'>): Message => {
  const messages = loadMessages();
  
  // Generate unique ID
  const maxId = messages.reduce((max, m) => {
    const num = parseInt(m.id.replace('m', ''));
    return num > max ? num : max;
  }, 0);
  
  const message: Message = {
    ...newMessage,
    id: `m${maxId + 1}`,
    timestamp: new Date().toISOString(),
    isRead: false,
    reactions: [],
    isStarred: false,
    isDeleted: false
  };
  
  messages.push(message);
  saveMessages(messages);
  
  return message;
};

// Add reaction to a message
export const addReaction = (messageId: string, emoji: string, userId: string): Message | null => {
  const messages = loadMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex === -1) return null;
  
  const message = messages[messageIndex];
  if (!message.reactions) {
    message.reactions = [];
  }
  
  // Remove existing reaction from this user with same emoji
  message.reactions = message.reactions.filter(
    r => !(r.userId === userId && r.emoji === emoji)
  );
  
  // Add new reaction
  message.reactions.push({
    emoji,
    userId,
    createdAt: new Date().toISOString()
  });
  
  messages[messageIndex] = message;
  saveMessages(messages);
  
  return message;
};

// Remove reaction from a message
export const removeReaction = (messageId: string, emoji: string, userId: string): Message | null => {
  const messages = loadMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex === -1) return null;
  
  const message = messages[messageIndex];
  if (message.reactions) {
    message.reactions = message.reactions.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );
  }
  
  messages[messageIndex] = message;
  saveMessages(messages);
  
  return message;
};

// Toggle star on a message
export const toggleStarMessage = (messageId: string): Message | null => {
  const messages = loadMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex === -1) return null;
  
  messages[messageIndex].isStarred = !messages[messageIndex].isStarred;
  saveMessages(messages);
  
  return messages[messageIndex];
};

// Mark message as read
export const markMessageAsRead = (messageId: string): void => {
  const messages = loadMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex !== -1) {
    messages[messageIndex].isRead = true;
    saveMessages(messages);
  }
};

// Mark all messages in a conversation as read
export const markConversationAsRead = (userId: string, partnerId: string): void => {
  const messages = loadMessages();
  let hasChanges = false;
  
  messages.forEach((m, index) => {
    if (!m.isRead && (
      (m.senderId === partnerId && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === partnerId)
    )) {
      messages[index].isRead = true;
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveMessages(messages);
  }
};

// Delete a message (soft delete)
export const deleteMessage = (messageId: string): boolean => {
  const messages = loadMessages();
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex === -1) return false;
  
  messages[messageIndex].isDeleted = true;
  saveMessages(messages);
  
  return true;
};

// Get starred messages for a user
export const getStarredMessages = (userId: string): Message[] => {
  const messages = loadMessages();
  return messages
    .filter(m => m.isStarred && (
      m.senderId === userId || m.receiverId === userId
    ))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Get unread message count
export const getUnreadCount = (userId: string): number => {
  const messages = loadMessages();
  return messages.filter(m => !m.isRead && m.receiverId === userId).length;
};
