import { Message, ChatConversation } from '../types';

export interface ChatConfig {
  // Sidebar dimensions
  sidebar: {
    width: string;
    widthMobile: string;
    widthTablet: string;
    widthDesktop: string;
  };
  
  // Avatar sizes
  avatar: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    indicator: string;
    infoPanel: string;
    emptyState: string;
  };
  
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xl2?: string;
  };
  
  // Typography
  font: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  // Border radius
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  // Z-index layers
  zIndex: {
    header: number;
    search: number;
    picker: number;
  };
  
  // Animation
  animation: {
    spin: string;
    fadeIn: string;
  };
  
  // Input constraints
  input: {
    minHeight: number;
    maxHeight: number;
    maxAttachments: number;
  };
  
  // Search
  search: {
    maxHeight: string;
    maxWidth: string;
  };
  
  // Emoji picker
  emojiPicker: {
    height: string;
    gridCols: number;
  };
  
  // Media grid
  media: {
    gridCols: number;
    aspectRatio: string;
  };
  
  // Colors
  colors: {
    primary: string;
    success: string;
    glass: {
      bg: string;
      border: string;
      highlight: string;
      accent: string;
    };
    obsidian: {
      [key: number]: string;
    };
    gray: {
      [key: number]: string;
    };
  };
}

// Default configuration
export const chatConfig: ChatConfig = {
  sidebar: {
    width: 'w-80',
    widthMobile: 'w-full',
    widthTablet: 'md:w-96',
    widthDesktop: 'lg:w-[420px]',
  },
  
  avatar: {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24',
    indicator: 'w-3 h-3',
    infoPanel: 'w-24 h-24',
    emptyState: 'w-32 h-32',
  },
  
  spacing: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
  },
  
  font: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  },
  
  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },
  
  zIndex: {
    header: 10,
    search: 20,
    picker: 30,
  },
  
  animation: {
    spin: 'animate-spin',
    fadeIn: 'animate-fade-in',
  },
  
  input: {
    minHeight: 48,
    maxHeight: 120,
    maxAttachments: 5,
  },
  
  search: {
    maxHeight: 'max-h-64',
    maxWidth: 'max-w-2xl',
  },
  
  emojiPicker: {
    height: 'h-48',
    gridCols: 8,
  },
  
  media: {
    gridCols: 3,
    aspectRatio: 'aspect-square',
  },
  
  colors: {
    primary: 'indigo-600',
    success: 'green-500',
    glass: {
      bg: 'rgba(26, 29, 33, 0.7)',
      border: 'rgba(255, 255, 255, 0.1)',
      highlight: 'rgba(255, 255, 255, 0.05)',
      accent: 'linear-gradient(135deg, #4466ffff 0%, #556df7ff 100%)',
    },
    obsidian: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#1a1d21',
    },
    gray: {
      50: 'bg-gray-50',
      100: 'bg-gray-100',
      200: 'border-gray-200',
      400: 'text-gray-400',
      500: 'text-gray-500',
      700: 'text-gray-700',
      900: 'text-gray-900',
    },
  },
};

export interface ChatState {
  messages: Message[];
  conversations: ChatConversation[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  isTyping: boolean;
  selectedMessage: Message | null;
  showEmojiPicker: boolean;
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number };
  showSearch: boolean;
  searchQuery: string;
  searchResults: Message[];
  isArchived: boolean;
  isPinned: boolean;
  showSettings: boolean;
  showInfo: boolean;
}

export interface MessageDraft {
  content: string;
  attachments: File[];
  replyingTo: Message | null;
}

export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
}

// Dynamic emoji categories - can be fetched from API
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { name: 'Smileys', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'] },
  { name: 'Gestures', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'] },
  { name: 'Hearts', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '😻', '💑', '💏', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💌', '💒', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩'] },
  { name: 'Objects', icon: '📱', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '鼠标', '鼠标', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '💡', '🔦', '🕯️', '🪔', '🧯'] },
  { name: 'Symbols', icon: '✨', emojis: ['✨', '⭐', '🌟', '💫', '💥', '💢', '💦', '💧', '🔥', '💤', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🔇', '🔈', '🔉', '🔊', '📶', '🛜', '✉️', '📩', '📨', '📧', '💌'] },
  { name: 'Nature', icon: '🌸', emojis: ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞'] },
  { name: 'Food', icon: '🍔', emojis: ['🍔', '🍟', '🍕', '🌭', '🥪', '塑造', '卷饼', '卷饼', '中东口袋饼', '炸豆丸子', '蛋', '煎炸', '锅', '面条', '碗', '沙拉', '锅', '干酪火锅', '拉面', '炖菜', '咖喱', '寿司', '盒饭', '饺子', '牡蛎', '天妇罗', '饭团', '米饭', '饼干', '鱼', '幸运饼干', '月饼', '串', '团子', '刨冰', '冰淇淋', '雪糕', '派', '纸杯蛋糕', '蛋糕', '蛋糕'] },
  { name: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', 'Baseball', 'Baseball', '网球', '排球', 'Rugby', 'Frisbee', '🎱', 'Yo-yo', '乒乓球', '羽毛球', '曲棍球', '曲棍球', '长曲棍球', '板球', 'Boomerang', 'Goal', '高尔夫', '风筝', '🏹', '钓鱼', 'Diving', 'Boxing', 'Martial arts', 'Running', 'Skateboard', 'Roller Skates', 'Sled', 'Ice Skates', 'Curling', 'Skis', 'Skis', 'Snowboard', 'Parachute', 'Weightlift', 'Wrestle', 'Gymanstics', 'Basketball', 'Fencing', 'Handball', 'Golf', 'Jockey', 'Yoga'] },
];
