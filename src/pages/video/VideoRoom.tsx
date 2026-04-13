import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  type ReactNode,
} from 'react';
import { PreJoinScreen } from '../../components/video/PreJoinScreen';
import { MeetingSettingsModal } from '../../components/video/MeetingSettingsModal';
import { MeetingInfoModal } from '../../components/video/MeetingInfoModal';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Settings,
  X,
  Send,
  Smile,
  Hand,
  Pin,
  Info,
  ShieldCheck,
  Captions,
  ArrowLeft,
  Check,
  Clock,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

// ============================================
// TYPES & INTERFACES
// ============================================
type LayoutMode = 'grid' | 'spotlight' | 'auto';
type ParticipantRole = 'host' | 'entrepreneur' | 'investor' | 'guest';
type PanelTab = 'people' | 'chat' | 'activities';
type ToastType = 'info' | 'success' | 'warning' | 'error';

// Extend Window interface for PiP functionality
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options: { width: number; height: number; disallowReturnToOpener: boolean }): Promise<Window>;
    };
  }
}

interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isPinned: boolean;
  avatarColor: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  icon?: ReactNode;
}

// ============================================
// UTILITY & CONFIG
// ============================================
const cn = (...classes: (string | undefined | null | false)[]) => twMerge(clsx(...classes));

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const MOCK_PARTICIPANTS: Omit<Participant, 'avatarColor' | 'isSpeaking'>[] = [
  { id: '1', name: 'Sarah Chen', role: 'investor', isMuted: false, isVideoOn: true, isScreenSharing: false, isPinned: false },
  { id: '2', name: 'Michael Roberts', role: 'entrepreneur', isMuted: true, isVideoOn: true, isScreenSharing: false, isPinned: false },
  { id: '3', name: 'David Kim', role: 'guest', isMuted: false, isVideoOn: false, isScreenSharing: false, isPinned: false },
  { id: '4', name: 'Elena Rodriguez', role: 'investor', isMuted: false, isVideoOn: true, isScreenSharing: true, isPinned: false },
  { id: '5', name: 'John Doe', role: 'guest', isMuted: true, isVideoOn: true, isScreenSharing: false, isPinned: false },
  { id: '6', name: 'Jane Smith', role: 'investor', isMuted: false, isVideoOn: true, isScreenSharing: false, isPinned: false },
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🚀', ''];

// ============================================
// CONTEXT & PROVIDERS
// ============================================
interface MeetingContextType {
  addToast: (type: ToastType, message: string) => void;
  participants: Participant[];
  screenStream: MediaStream | null;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  activeSpeakerId: string;
}

const MeetingContext = createContext<MeetingContextType | null>(null);

// ============================================
// ATOMS
// ============================================
const Tooltip = ({ children, text }: { children: ReactNode; text: string }) => {
  return (
    <div className="tooltip-container group relative inline-flex">
      {children}
      <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
        <div className="tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};


const Avatar = ({ name, size = 'md', isMuted = false }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; isMuted?: boolean }) => {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' };
  const color = getAvatarColor(name);
  return (
    <div className={cn('avatar avatar-' + size, 'relative rounded-full flex items-center justify-center font-semibold text-white', sizeMap[size], color)}>
      {name.charAt(0).toUpperCase()}
      {isMuted && (
        <div className="avatar-muted-indicator absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-gray-900">
          <MicOff className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

const FloatingReaction = ({ emoji }: { emoji: string }) => (
  <motion.div
    initial={{ y: 0, opacity: 1, scale: 0.5 }}
    animate={{ y: -200, opacity: 0, scale: 1.2 }}
    transition={{ duration: 2, ease: 'easeOut' }}
    className="fixed text-4xl pointer-events-none z-[100] left-1/2 bottom-20 -translate-x-1/2"
  >
    {emoji}
  </motion.div>
);

// ============================================
// TOAST SYSTEM
// ============================================
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={cn(
            'toast-item',
            toast.type === 'info' ? 'toast-info' :
              toast.type === 'success' ? 'toast-success' :
                toast.type === 'warning' ? 'toast-warning' :
                  'toast-error'
          )}
        >
          {toast.icon}
          {toast.message}
        </motion.div>
      ))}
    </div>
  );
};

// ============================================
// MOLECULES
// ============================================
const ControlButton = ({
  icon,
  onClick,
  active = false,
  danger = false,
  badge,
  variant = 'default',
  label,
}: {
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  badge?: number | string;
  variant?: 'default' | 'ghost' | 'circular' | 'danger-pill';
  label?: string;
}) => (
  <Tooltip text={label || ''}>
    <button
      onClick={onClick}
      className={cn(
        'meet-icon-btn',
        active && 'active',
        danger && 'danger',
        variant === 'danger-pill' && 'danger-pill',
        variant === 'ghost' && 'meet-btn-ghost',
        'relative'
      )}
    >
      {icon}
      {badge !== undefined && badge !== 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-500 text-[9px] font-bold text-white rounded-full px-1 border border-[#202124]">
          {badge}
        </span>
      )}
    </button>
  </Tooltip>
);

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isMe = message.senderName === 'You';
  return (
    <div className={cn('chat-bubble-container', 'flex flex-col max-w-[85%]', isMe ? 'self-end' : 'self-start')}>
      {!isMe && <span className="chat-bubble-sender text-[10px] text-gray-400 ml-1 mb-0.5">{message.senderName}</span>}
      <div className={cn(
        'chat-bubble-content px-3 py-2 rounded-2xl text-sm shadow-sm',
        isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-700/80 text-gray-100 rounded-tl-sm'
      )}>
        {message.text}
        <span className={cn('chat-bubble-timestamp text-[10px] text-gray-500 mt-0.5', isMe ? 'self-end mr-1' : 'self-start ml-1')}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const ParticipantRow = ({ participant, isLocal }: { participant: Participant; isLocal: boolean }) => (
  <div className="participant-row flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
    <div className="participant-info flex items-center gap-3">
      <Avatar name={isLocal ? 'You' : participant.name} size="sm" isMuted={participant.isMuted} />
      <div className="participant-details">
        <p className="participant-name text-sm font-medium text-gray-200">{isLocal ? 'You' : participant.name}</p>
        <p className="participant-role text-[10px] text-gray-500 capitalize">{participant.role}</p>
      </div>
    </div>
    <div className="participant-status flex items-center gap-2">
      {participant.isSpeaking && <span className="participant-speaking-indicator w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
      <span className="participant-audio-status text-xs text-gray-500">
        {participant.isMuted ? 'Muted' : 'Unmuted'}
      </span>
    </div>
  </div>
);

// ============================================
// ORGANISMS
// ============================================
const VideoTile = ({
  participant,
  isLocal = false,
  onTogglePin,
  isHandRaised,
}: {
  participant: Participant;
  isLocal?: boolean;
  onTogglePin: (id: string) => void;
  isHandRaised: boolean;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'meet-tile group',
        participant.isSpeaking && 'active-speaker'
      )}
    >
      {participant.isVideoOn ? (
        <div className="video-feed-container w-full h-full bg-[#1e1f21] flex items-center justify-center overflow-hidden">
          <Avatar name={isLocal ? 'You' : participant.name} size="xl" isMuted={participant.isMuted} />
          {/* In a real app, video would be here */}
        </div>
      ) : (
        <div className="meet-tile-placeholder">
          <Avatar name={isLocal ? 'You' : participant.name} size="xl" isMuted={participant.isMuted} />
        </div>
      )}

      {/* Meet-style overlays */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onTogglePin(participant.id)}
          className="p-1.5 bg-[#202124] hover:bg-[#3c4043] rounded-full text-white transition-colors border border-white/5 shadow-lg"
        >
          <Pin className={cn("w-4 h-4", participant.isPinned && "text-[#8ab4f8] fill-[#8ab4f8]")} />
        </button>
      </div>


      <div className="meet-tile-nameplate">
        <div className="flex items-center gap-2">
          {participant.id === 'local' && isHandRaised && (
            <div className="bg-[#8ab4f8] rounded-full p-1 shadow-lg animate-bounce">
              <Hand className="w-3 h-3 text-[#202124] fill-[#202124]" />
            </div>
          )}
          <span className="meet-tile-name">{isLocal ? 'You' : participant.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {participant.isMuted && (
            <MicOff className="w-3.5 h-3.5 text-[#ea4335]" />
          )}
          {participant.isScreenSharing && (
            <Monitor className="w-3.5 h-3.5 text-[#8ab4f8]" />
          )}
        </div>
      </div>


      {participant.isSpeaking && (
        <div className="absolute top-3 left-3 flex gap-0.5 items-end h-3">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{ height: [4, 12, 4] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
              className="w-0.5 bg-[#8ab4f8] rounded-full"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ControlBar = ({
  micOn,
  cameraOn,
  screenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onEndCall,
  onToggleChat,
  onTogglePeople,
  chatUnread,
  onOpenReactions,
  roomId,
}: any) => (
  <div className="meet-bottom-bar">
    <div className="meet-clock-info">
      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <div className="w-px h-4 bg-[#5f6368]" />
      <span className="text-sm tracking-tight">{roomId}</span>
    </div>

    <div className="meet-control-pill">
      <ControlButton
        label={micOn ? "Turn off microphone (ctrl + d)" : "Turn on microphone (ctrl + d)"}
        icon={micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        onClick={onToggleMic}
        active={micOn}
        danger={!micOn}
      />
      <ControlButton
        label={cameraOn ? "Turn off camera (ctrl + e)" : "Turn on camera (ctrl + e)"}
        icon={cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        onClick={onToggleCamera}
        active={cameraOn}
        danger={!cameraOn}
      />

      <ControlButton label="Captions" icon={<Captions className="w-5 h-5" />} onClick={() => { }} />
      <ControlButton label="Send a reaction" icon={<Smile className="w-5 h-5" />} onClick={onOpenReactions} />
      <ControlButton
        label={screenSharing ? "Stop presenting" : "Present now"}
        icon={screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        onClick={onToggleScreen}
        active={screenSharing}
      />
      <ControlButton
        label="More options"
        icon={<Settings className="w-5 h-5" />}
        onClick={() => { }}
      />

      <div className="mx-2" />

      <ControlButton
        label="Leave call"
        variant="danger-pill"
        icon={<PhoneOff className="w-6 h-6 rotate-[135deg]" />}
        onClick={onEndCall}
        danger
      />
    </div>

    <div className="meet-control-pill">
      <ControlButton variant="ghost" label="Meeting details" icon={<Info className="w-5 h-5" />} onClick={() => { }} />
      <ControlButton variant="ghost" label="Show everyone" icon={<Users className="w-5 h-5" />} onClick={onTogglePeople} badge={3} />
      <ControlButton variant="ghost" label="Chat with everyone" icon={<MessageSquare className="w-5 h-5" />} onClick={onToggleChat} badge={chatUnread} />
      <ControlButton variant="ghost" label="Activities" icon={<ShieldCheck className="w-5 h-5" />} onClick={() => { }} />
    </div>
  </div>
);

const SidePanel = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  participants,
  messages,
  onSendMessage,
  localParticipant,
  onTriggerReaction,
  isHandRaised,
  onToggleHand,
}: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="side-panel fixed right-0 top-0 bottom-0 w-full md:w-[360px] bg-[#1a1b1e] border-l border-white/5 z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="side-panel-header flex items-center justify-between p-4 border-b border-white/5">
          <div className="side-panel-tabs flex items-center bg-[#202124] rounded-full p-1 self-start">
            {(['people', 'chat', 'activities'] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  'px-4 py-1.5 text-[13px] font-medium rounded-full transition-all capitalize',
                  activeTab === tab 
                    ? 'bg-[#8ab4f8] text-[#202124] shadow-sm' 
                    : 'text-[#9aa0a6] hover:text-white hover:bg-white/5'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-[#9aa0a6] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'people' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <ParticipantRow participant={localParticipant} isLocal />
              <div className="h-px bg-white/5 my-4" />
              <div className="text-[11px] font-bold text-[#9aa0a6] uppercase tracking-wider mb-2 px-1">Meeting Participants ({participants.length + 1})</div>
              {participants.map((p: Participant) => (
                <ParticipantRow key={p.id} participant={p} isLocal={false} />
              ))}
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#5f6368] px-8 text-center">
                    <div className="w-16 h-16 bg-[#202124] rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-[#9aa0a6]">No messages yet</p>
                    <p className="text-xs mt-1 text-[#5f6368]">Messages can only be seen by people in the call and are deleted when the call ends.</p>
                  </div>
                ) : (
                  messages.map((m: ChatMessage) => <ChatBubble key={m.id} message={m} />)
                )}
              </div>
              
              {/* Chat Input Bar - Always visible at bottom of tab */}
              <div className="p-4 border-t border-white/5 bg-[#1a1b1e]">
                <div className="flex items-center gap-2 bg-[#202124] rounded-full pl-4 pr-1 py-1 group focus-within:ring-1 focus-within:ring-[#8ab4f8]">
                  <input
                    placeholder="Send a message to everyone"
                    className="flex-1 bg-transparent border-none text-[14px] text-white placeholder-[#5f6368] focus:outline-none py-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        onSendMessage(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button onClick={() => {
                    const input = (document.activeElement?.tagName === 'INPUT' ? document.activeElement : document.querySelector('input[placeholder="Send a message to everyone"]')) as HTMLInputElement;
                    if (input?.value.trim()) {
                      onSendMessage(input.value);
                      input.value = '';
                    }
                  }} className="p-2 text-[#8ab4f8] hover:bg-[#8ab4f8]/10 rounded-full transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'activities' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="bg-[#202124] p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Smile className="w-5 h-5 text-[#8ab4f8]" />
                  <h4 className="text-[15px] font-medium text-white">Recent Reactions</h4>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {REACTION_EMOJIS.filter(e => e).map((emoji) => (
                    <button 
                      key={emoji} 
                      onClick={() => onTriggerReaction(emoji)}
                      className="text-3xl p-2 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#202124] p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Hand className={cn("w-5 h-5", isHandRaised ? "text-[#8ab4f8]" : "text-[#9aa0a6]")} />
                  <h4 className="text-[15px] font-medium text-white">Raise Hand</h4>
                </div>
                <p className="text-[13px] text-[#9aa0a6] mb-5">Notify others that you'd like to speak.</p>
                <button 
                  onClick={onToggleHand}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3.5 rounded-full w-full justify-center font-medium transition-all",
                    isHandRaised 
                      ? "bg-[#8ab4f8] text-[#202124] shadow-lg shadow-[#8ab4f8]/20" 
                      : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
                  )}
                >
                  <Hand className="w-5 h-5" />
                  {isHandRaised ? "Lower Hand" : "Raise Hand"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ParticipantCarousel = ({
  participants,
  onTogglePin,
  orientation = 'horizontal',
  isHandRaised = false
}: {
  participants: Participant[];
  onTogglePin: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  isHandRaised?: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (orientation === 'horizontal') {
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
      } else {
        setShowLeft(scrollTop > 10);
        setShowRight(scrollTop < scrollHeight - clientHeight - 10);
      }
    }
  }, [orientation]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, participants.length]);

  const scroll = (direction: 'prev' | 'next') => {
    if (scrollRef.current) {
      const amount = orientation === 'horizontal' ? 300 : 200;
      scrollRef.current.scrollBy({
        [orientation === 'horizontal' ? 'left' : 'top']: direction === 'next' ? amount : -amount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn(
      'participant-carousel-container relative group overflow-hidden',
      orientation === 'vertical' ? 'h-full w-64' : 'w-full h-40'
    )}>
      {showLeft && (
        <button
          onClick={() => scroll('prev')}
          className={cn(
            'absolute z-10 bg-[#282a2d]/90 hover:bg-[#3c4043] text-white p-2 rounded-full shadow-xl transition-all flex items-center justify-center border border-white/10 active:scale-95',
            orientation === 'horizontal' ? 'left-2 top-1/2 -translate-y-1/2' : 'top-2 left-1/2 -translate-x-1/2'
          )}
        >
          {orientation === 'horizontal' ? <ArrowLeft className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 rotate-90" />}
        </button>
      )}
      {showRight && (
        <button
          onClick={() => scroll('next')}
          className={cn(
            'absolute z-10 bg-[#282a2d]/90 hover:bg-[#3c4043] text-white p-2 rounded-full shadow-xl transition-all flex items-center justify-center border border-white/10 active:scale-95',
            orientation === 'horizontal' ? 'right-2 top-1/2 -translate-y-1/2' : 'bottom-2 left-1/2 -translate-x-1/2'
          )}
        >
          {orientation === 'horizontal' ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4 -rotate-90" />}
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={cn(
          'flex gap-3 h-full overflow-hidden hover:overflow-auto scrollbar-none transition-all p-3',
          orientation === 'horizontal' ? 'flex-row overflow-x-auto items-center' : 'flex-col overflow-y-auto items-center'
        )}
      >
        {participants.map((p) => (
          <div 
            key={p.id} 
            className={cn(
              "flex-shrink-0 transition-all duration-300",
              orientation === 'horizontal' ? "w-64" : "w-full"
            )}
          >
            <VideoTile
              participant={p}
              isLocal={p.id === 'local'}
              onTogglePin={onTogglePin}
              isHandRaised={isHandRaised}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ReactionPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.8, opacity: 0, y: 20 }}
    className="reactions-panel fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-2xl p-4 z-50 shadow-2xl"
  >
    <div className="reactions-panel-header flex items-center justify-between mb-3">
      <span className="reactions-panel-title text-sm font-medium text-white">Reactions</span>
      <button onClick={onClose} className="reactions-panel-close-button p-1 hover:bg-white/10 rounded-md"> <X className="w-4 h-4 text-gray-400" /> </button>
    </div>
    <div className="reactions-panel-grid grid grid-cols-4 gap-3">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="reactions-panel-emoji-button p-2 text-2xl hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-90"
        >
          {emoji}
        </button>
      ))}
    </div>
  </motion.div>
);

const PiPWindow = ({ participant, onClose }: { participant: Participant; onClose: () => void }) => (
  <motion.div
    drag
    dragConstraints={{ left: 0, right: 0, top: -100, bottom: 100 }}
    dragElastic={0.1}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="pip-window fixed bottom-32 right-4 w-64 h-44 bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-40 cursor-grab active:cursor-grabbing"
  >
    <div className="pip-window-background absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
      <Avatar name={participant.name} size="lg" isMuted={participant.isMuted} />
    </div>
    <div className="pip-window-label absolute top-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white font-medium backdrop-blur-sm">
      Screen Sharing
    </div>
    <button
      onClick={onClose}
      className="pip-window-close-button absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors"
    >
      <X className="w-3 h-3 text-white" />
    </button>
  </motion.div>
);

const EndCallModal = ({
  isOpen,
  isHost,
  onLeave,
  onEndForAll,
  onClose,
}: {
  isOpen: boolean;
  isHost: boolean;
  onLeave: () => void;
  onEndForAll: () => void;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}

      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="meet-dialog-panel bg-[#282a2d] rounded-[28px] w-full max-w-[440px] p-10 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h3 className="text-[24px] font-semibold text-white mb-4">Leave meeting?</h3>
            <p className="text-[#9aa0a6] text-[15px] leading-relaxed mb-10 px-4">
              {isHost ? 'Are you sure you want to end the meeting for all participants, or just leave?' : 'You will disconnect from this meeting.'}
            </p>
            
            <div className="flex flex-col gap-3.5">
              {isHost && (
                <button
                  onClick={onEndForAll}
                  className="w-full py-4 bg-[#d93025] hover:bg-[#c5221f] text-white font-bold rounded-2xl transition-all duration-200"
                >
                  End meeting for everyone
                </button>
              )}
              <button
                onClick={onLeave}
                className="w-full py-4 bg-[#3c4043] hover:bg-[#4a4d51] text-white font-bold rounded-2xl transition-all duration-200"
              >
                Leave meeting
              </button>
              
              <button 
                onClick={onClose} 
                className="mt-4 text-[14px] text-[#9aa0a6] hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const PostCallSummary = ({ duration, onRedirect }: { duration: number; onRedirect: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#040b14] text-center p-6"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="max-w-md w-full"
    >
      <div className="w-24 h-24 bg-[#0d652d]/30 rounded-full flex items-center justify-center mx-auto mb-10">
        <div className="w-14 h-14 bg-[#1e8e3e] rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <Check className="w-8 h-8 text-white stroke-[3px]" />
        </div>
      </div>
      
      <h2 className="text-[40px] font-bold text-white mb-4 tracking-tight">Meeting Ended</h2>
      
      <div className="flex items-center justify-center gap-2 text-[#9aa0a6] mb-12">
        <Clock className="w-4 h-4 opacity-70" />
        <span className="text-sm font-medium opacity-80">{formatDuration(duration)}</span>
      </div>

      <button
        onClick={onRedirect}
        className="px-12 py-3.5 bg-[#1a73e8] hover:bg-[#1b66c9] text-white font-bold rounded-xl transition-all duration-200 shadow-xl shadow-blue-900/30 active:scale-95 text-base"
      >
        Return to Dashboard
      </button>
    </motion.div>
  </motion.div>
);



// ============================================
// MAIN COMPONENT
// ============================================
export const VideoRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant>({
    id: 'local', name: 'You', role: 'host' as ParticipantRole, isMuted: false, isVideoOn: true, isScreenSharing: false, isPinned: false, isSpeaking: false, avatarColor: getAvatarColor('You')
  });
  const [activeSpeakerId, setActiveSpeakerId] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);

  const [isPreJoin, setIsPreJoin] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [pipWindow, setPipWindow] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);
  const toastCounterRef = useRef(0);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initial = MOCK_PARTICIPANTS.map((p) => ({ ...p, avatarColor: getAvatarColor(p.name), isSpeaking: false }));
    setParticipants(initial);
    addToast('info', 'Connected to meeting');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) => {
        const randomIdx = Math.floor(Math.random() * prev.length);
        return prev.map((p, i) => ({
          ...p,
          isSpeaking: i === randomIdx ? !p.isSpeaking : false,
        }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!callEnded) {
      const t = setInterval(() => setCallDuration((d) => d + 1), 1000);
      return () => clearInterval(t);
    }
  }, [callEnded]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${toastCounterRef.current++}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const startScreenShare = useCallback(async () => {
    try {
      if (isPiPActive) {
        addToast('warning', 'Screen sharing may not work properly with Picture-in-Picture active. Try closing PiP first.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      if (screenVideoRef.current) {
        screenVideoRef.current.pause();
        screenVideoRef.current.srcObject = null;
      }
      if (pipWindow?.pipVideos) {
        pipWindow.pipVideos.forEach((v: any) => {
          if (v) {
            v.pause();
            v.srcObject = null;
          }
        });
      }
      setScreenStream(stream);
      setScreenSharing(true);
      setLocalParticipant(prev => ({ ...prev, isScreenSharing: true }));

      addToast('success', 'Screen sharing started');

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      addToast('error', 'Failed to start screen sharing');
    }
  }, [addToast, isPiPActive, pipWindow]);

  useEffect(() => {
    if (screenSharing && screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(console.error);
    }
  }, [screenSharing, screenStream]);

  const allParticipants = useMemo(() => {
    return [localParticipant, ...participants];
  }, [localParticipant, participants]);

  const sortedParticipants = useMemo(() => {
    const pinned = allParticipants.filter((p) => p.isPinned);
    const others = allParticipants.filter((p) => !p.isPinned);
    return [...pinned, ...others];
  }, [allParticipants]);

  useEffect(() => {
    if (callEnded && pipWindow && !pipWindow.closed) {
      pipWindow.close();
      setPipWindow(null);
      setIsPiPActive(false);
    }
  }, [callEnded, pipWindow]);

  useEffect(() => {
    if (screenStream) {
      if (screenVideoRef.current && !screenVideoRef.current.srcObject) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(console.error);
      }
      if (pipWindow?.pipVideos) {
        pipWindow.pipVideos?.forEach((video: any) => {
          if (video && !video.srcObject) {
            video.srcObject = screenStream;
            video.play().catch(console.error);
          }
        });
      }
      pipVideosRef.current.forEach(video => {
        if (video && !video.srcObject) {
          video.srcObject = screenStream;
          video.play().catch(console.error);
        }
      });
    }
  }, [screenStream, pipWindow]);

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
      }
    };
  }, [screenStream, pipWindow]);

  const stopScreenShare = useCallback(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.pause();
      screenVideoRef.current.srcObject = null;
    }
    if (pipWindow?.pipVideos) {
      pipWindow.pipVideos.forEach((v: any) => {
        if (v) {
          v.pause();
          v.srcObject = null;
        }
      });
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    setScreenSharing(false);
    setLocalParticipant(prev => ({ ...prev, isScreenSharing: false }));
    addToast('info', 'Screen sharing stopped');
  }, [screenStream, pipWindow, addToast]);

  const toggleScreenShare = useCallback(() => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [screenSharing, startScreenShare, stopScreenShare]);

  const openPictureInPicture = useCallback(async () => {
    try {
      if ('documentPictureInPicture' in window) {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 400,
          height: 300,
          disallowReturnToOpener: false,
        });

        setPipWindow(pipWindow);
        setIsPiPActive(true);

        const pipDocument = pipWindow.document;
        const style = pipDocument.createElement('style');
        style.textContent = `
          body { margin: 0; padding: 8px; background: #0f0f11; color: white; font-family: system-ui, sans-serif; overflow: hidden; }
          .pip-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; }
          .pip-tile { background: #1a1a1c; border-radius: 4px; overflow: hidden; position: relative; aspect-ratio: 16/9; }
          .pip-video { width: 100%; height: 100%; object-fit: cover; }
          .pip-avatar { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .pip-name { position: absolute; bottom: 2px; left: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; font-size: 10px; padding: 1px 2px; border-radius: 2px; text-align: center; }
        `;
        pipDocument.head.appendChild(style);

        const content = pipDocument.createElement('div');
        content.className = 'pip-content';

        const allParticipants = [localParticipant, ...sortedParticipants];
        allParticipants.forEach(participant => {
          const tile = pipDocument.createElement('div');
          tile.className = 'pip-tile';

          if (participant.id === 'local' && screenSharing) {
            const video = pipDocument.createElement('video');
            video.className = 'pip-video';
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            if (!pipWindow.pipVideos) pipWindow.pipVideos = [];
            pipWindow.pipVideos.push(video);
            pipVideosRef.current.push(video);
            tile.appendChild(video);
          } else {
            const avatar = pipDocument.createElement('div');
            avatar.className = 'pip-avatar';
            avatar.textContent = participant.name.charAt(0).toUpperCase();
            tile.appendChild(avatar);
          }

          const name = pipDocument.createElement('div');
          name.className = 'pip-name';
          name.textContent = participant.name;
          tile.appendChild(name);
          content.appendChild(tile);
        });

        pipDocument.body.appendChild(content);
        pipWindow.pipContent = content;
        pipWindow.participants = allParticipants;

        pipWindow.addEventListener('pagehide', () => {
          setPipWindow(null);
          setIsPiPActive(false);
        });

        addToast('success', 'Picture-in-Picture mode activated');
      } else {
        addToast('warning', 'Picture-in-Picture not supported');
      }
    } catch (error) {
      console.error('Error opening Picture-in-Picture:', error);
      addToast('error', 'Failed to open Picture-in-Picture mode');
    }
  }, [localParticipant, sortedParticipants, screenSharing, addToast]);

  const closePictureInPicture = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      setIsPiPActive(false);
    }
  }, [pipWindow]);

  const togglePiP = useCallback(() => {
    if (isPiPActive) {
      closePictureInPicture();
    } else {
      openPictureInPicture();
    }
  }, [isPiPActive, openPictureInPicture, closePictureInPicture]);

  const handleTogglePin = useCallback((id: string) => {
    if (id === 'local') {
      setLocalParticipant(prev => ({ ...prev, isPinned: !prev.isPinned }));
      addToast('info', 'Pinned yourself');
    } else {
      setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
      addToast('info', 'Pinned participant');
    }
  }, [addToast]);

  const handleSendMessage = useCallback((text: string) => {
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), senderId: 'local', senderName: 'You', text, timestamp: new Date() }]);
    setChatUnread(0);
  }, []);

  const triggerReaction = useCallback((emoji: string) => {
    setFloatingReactions((prev) => [...prev, { id: Date.now().toString(), emoji }]);
    setTimeout(() => setFloatingReactions((prev) => prev.slice(1)), 2000);
  }, []);

  const handleEndCall = useCallback(() => {
    setShowEndModal(true);
  }, []);

  const leaveMeeting = useCallback(() => {
    setCallEnded(true);
    setShowEndModal(false);
    addToast('info', 'Leaving meeting...');
  }, [addToast]);

  const endForAll = useCallback(() => {
    setCallEnded(true);
    setShowEndModal(false);
    addToast('warning', 'Meeting ended for all participants');
  }, [addToast]);

  const handleRedirect = useCallback(() => {
    navigate(ROUTES.DASHBOARD.ENTREPRENEUR);
  }, [navigate]);

  // Context Value
  const ctxValue = useMemo<MeetingContextType>(() => ({
    addToast,
    participants,
    screenStream,
    updateParticipant: (id: string, updates: Partial<Participant>) => setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p)),
    layoutMode: 'auto',
    setLayoutMode: () => { },
    activeSpeakerId,
  }), [addToast, participants, screenStream, activeSpeakerId]);

  // Show pre-join screen before entering room
  if (isPreJoin) {
    return <PreJoinScreen roomId={roomId || ''} onJoin={() => setIsPreJoin(false)} onBack={() => navigate(-1)} />;
  }

  if (callEnded) {
    return <PostCallSummary duration={callDuration} onRedirect={handleRedirect} />;
  }

  return (
    <MeetingContext.Provider value={ctxValue}>
      <div className="video-room-container">
        <main className="video-stage-area meet-scrollbar">
          {!screenSharing ? (
            <div 
              className="video-grid-adaptive"
              style={{
                gridTemplateColumns: `repeat(${
                  participants.length + 1 <= 1 ? 1 : 
                  participants.length + 1 <= 2 ? 2 : 
                  participants.length + 1 <= 4 ? 2 : 
                  participants.length + 1 <= 6 ? 3 : 
                  participants.length + 1 <= 9 ? 3 : 
                  participants.length + 1 <= 12 ? 4 : 5
                }, minmax(0, 1fr))`,
              }}
            >
              <VideoTile
                participant={localParticipant}
                isLocal
                onTogglePin={handleTogglePin}
                isHandRaised={isHandRaised}
              />
              {sortedParticipants.filter(p => p.id !== 'local').map((participant) => (
                <VideoTile
                  key={participant.id}
                  participant={participant}
                  onTogglePin={handleTogglePin}
                  isHandRaised={isHandRaised}
                />
              ))}
            </div>
          ) : (
            <div className={cn(
              "flex w-full h-full gap-4 transition-all duration-500",
              windowWidth > 850 ? "flex-row" : "flex-col"
            )}>
              <div className="relative w-[300px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-300">
                <video ref={screenVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
                <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                  <Monitor className="w-4 h-4 text-[#8ab4f8]" />
                  <span className="text-sm font-medium text-white">Your presentation</span>
                </div>
              </div>

              <div className={cn(
                "flex-1 h-full min-w-[300px]",
                windowWidth <= 850 && "h-40 min-h-[160px]"
              )}>
                <ParticipantCarousel
                  participants={allParticipants.filter(p => !p.isScreenSharing)}
                  onTogglePin={handleTogglePin}
                  orientation={windowWidth > 850 ? 'vertical' : 'horizontal'}
                  isHandRaised={isHandRaised}
                />
              </div>
            </div>
          )}

          <AnimatePresence>
            {showReactions && (
              <ReactionPicker onSelect={(e) => { triggerReaction(e); setShowReactions(false); }} onClose={() => setShowReactions(false)} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {floatingReactions.map((r) => (
              <FloatingReaction key={r.id} emoji={r.emoji} />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isPiPActive && (
              <PiPWindow participant={localParticipant} onClose={() => setIsPiPActive(false)} />
            )}
          </AnimatePresence>

          <SidePanel
            isOpen={panelOpen}
            activeTab={activePanelTab}
            onTabChange={setActivePanelTab}
            onClose={() => setPanelOpen(false)}
            participants={participants}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            localParticipant={localParticipant}
            onTriggerReaction={triggerReaction}
            isHandRaised={isHandRaised}
            onToggleHand={() => {
              const newState = !isHandRaised;
              setIsHandRaised(newState);
              if (newState) {
                addToast('info', 'You raised your hand');
              } else {
                addToast('info', 'You lowered your hand');
              }
            }}
          />

        </main>

        <ControlBar
          micOn={micOn}
          cameraOn={cameraOn}
          screenSharing={screenSharing}
          onToggleMic={() => { setMicOn(!micOn); addToast('info', micOn ? 'Microphone muted' : 'Microphone unmuted'); }}
          onToggleCamera={() => setCameraOn(!cameraOn)}
          onToggleScreen={toggleScreenShare}
          onEndCall={handleEndCall}
          onToggleChat={() => {
            if (activePanelTab === 'chat' && panelOpen) {
              setPanelOpen(false);
            } else {
              setPanelOpen(true);
              setActivePanelTab('chat');
              setChatUnread(0);
            }
          }}
          onTogglePeople={() => {
            if (activePanelTab === 'people' && panelOpen) {
              setPanelOpen(false);
            } else {
              setPanelOpen(true);
              setActivePanelTab('people');
            }
          }}
          onTogglePiP={togglePiP}
          isPiPActive={isPiPActive}
          chatUnread={chatUnread}
          onOpenReactions={() => setShowReactions(!showReactions)}
          roomId={roomId || 'abc-123-xyz'}
        />

        {/* Modals */}
        <EndCallModal
          isOpen={showEndModal}
          isHost={localParticipant.role === 'host'}
          onLeave={leaveMeeting}
          onEndForAll={endForAll}
          onClose={() => setShowEndModal(false)}
        />

        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <MeetingSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <MeetingInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} meetingCode={roomId || ''} />
      </div>
    </MeetingContext.Provider>
  );
};

export default VideoRoom;
