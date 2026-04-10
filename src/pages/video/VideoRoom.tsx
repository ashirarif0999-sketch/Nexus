import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
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
  MoreVertical,
  Layout,
  X,
  Send,
  Smile,
  Hand,
  Pin,
  Maximize2,
  Minimize2,
  Info,
  ShieldCheck,
  Captions,
  ArrowLeft,
  Copy,
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
type ViewMode = 'grid' | 'spotlight';
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

// Extend Window for PiP window properties
interface PiPWindow extends Window {
  pipContent?: HTMLElement;
  participants?: Participant[];
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

interface VideoTileProps {
  participant: Participant;
  isLocal?: boolean;
  isFocused?: boolean;
  layoutMode: LayoutMode;
  onTogglePin: (id: string) => void;
  onResize: (id: string, width: number) => void;
  currentWidth?: number;
}

// ============================================
// UTILITY & CONFIG
// ============================================
const cn = (...classes: (string | undefined | null | false)[]) => twMerge(clsx(...classes));

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
  // Added more mock participants to demonstrate > 5 layout
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
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  activeSpeakerId: string;
}

const MeetingContext = createContext<MeetingContextType | null>(null);

const useMeeting = () => {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within MeetingProvider');
  return ctx;
};

// ============================================
// ATOMS
// ============================================
const Tooltip = ({ children, text }: { children: ReactNode; text: string }) => {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant = 'default' }: { children: ReactNode; variant?: 'muted' | 'live' | 'screen-share' | 'default' }) => {
  const styles = {
    muted: 'bg-red-500/90 text-white',
    live: 'bg-red-600 text-white animate-pulse',
    'screen-share': 'bg-emerald-500/90 text-white',
    default: 'bg-gray-700/80 text-gray-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm', styles[variant])}>
      {children}
    </span>
  );
};

const Avatar = ({ name, size = 'md', isMuted = false }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; isMuted?: boolean }) => {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' };
  const color = getAvatarColor(name);
  return (
    <div className={cn('relative rounded-full flex items-center justify-center font-semibold text-white', sizeMap[size], color)}>
      {name.charAt(0).toUpperCase()}
      {isMuted && (
        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-gray-900">
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md text-sm font-medium',
            toast.type === 'info' ? 'bg-gray-800/90 text-white' :
            toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-50 border border-emerald-500/30' :
            toast.type === 'warning' ? 'bg-amber-900/90 text-amber-50 border border-amber-500/30' :
            'bg-red-900/90 text-red-50 border border-red-500/30'
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
  label,
  onClick,
  active = false,
  danger = false,
  badge,
  tooltipText,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  badge?: number | string;
  tooltipText?: string;
}) => {
  const btn = (
    <Tooltip text={tooltipText || label}>
      <button
        onClick={onClick}
        className={cn(
          'relative flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400/50 touch-manipulation',
          danger ? 'bg-red-600 hover:bg-red-700 text-white' :
          active ? 'bg-white/15 text-white backdrop-blur-sm' :
          'bg-white/10 hover:bg-white/20 text-gray-200'
        )}
      >
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-600 text-[10px] font-bold text-white rounded-full px-1">
            {badge}
          </span>
        )}
      </button>
    </Tooltip>
  );
  return (
    <div className="flex flex-col items-center gap-1">
      {btn}
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
    </div>
  );
};

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isMe = message.senderName === 'You';
  return (
    <div className={cn('flex flex-col max-w-[85%]', isMe ? 'self-end' : 'self-start')}>
      {!isMe && <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{message.senderName}</span>}
      <div className={cn(
        'px-3 py-2 rounded-2xl text-sm shadow-sm',
        isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-700/80 text-gray-100 rounded-tl-sm'
      )}>
        {message.text}
        <span className={cn('text-[10px] text-gray-500 mt-0.5', isMe ? 'self-end mr-1' : 'self-start ml-1')}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const ParticipantRow = ({ participant, isLocal }: { participant: Participant; isLocal: boolean }) => (
  <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <Avatar name={isLocal ? 'You' : participant.name} size="sm" isMuted={participant.isMuted} />
      <div>
        <p className="text-sm font-medium text-gray-200">{isLocal ? 'You' : participant.name}</p>
        <p className="text-[10px] text-gray-500 capitalize">{participant.role}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {participant.isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
      <span className="text-xs text-gray-500">
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
  isFocused = false,
  layoutMode,
  onTogglePin,
  onResize,
  currentWidth = 0,
}: VideoTileProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = tileRef.current?.offsetWidth || 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      onResize(participant.id, Math.max(160, Math.min(startWidth + dx, 800)));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [participant.id, onResize]);

  return (
    <motion.div
      ref={tileRef}
      className={cn(
        'relative bg-gray-900/40 rounded-2xl overflow-hidden border group h-full',
        participant.isSpeaking ? 'ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-gray-700/50',
        isFocused && 'ring-2 ring-blue-400/50',
        isResizing && 'cursor-col-resize'
      )}
      style={{ width: currentWidth ? `${currentWidth}px` : '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Video Feed / Placeholder */}
      {participant.isVideoOn ? (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          {/* In a real app, this would be a <video> tag */}
          <Avatar name={isLocal ? 'You' : participant.name} size="xl" isMuted={participant.isMuted} />
        </div>
      ) : (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-2">
          <Avatar name={isLocal ? 'You' : participant.name} size="xl" isMuted={participant.isMuted} />
          <span className="text-gray-500 text-sm">Camera is off</span>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {isLocal && <Badge variant="default">You</Badge>}
        {participant.isScreenSharing && <Badge variant="screen-share">Sharing</Badge>}
        {participant.isPinned && (
          <Badge variant="default"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
          <span className="text-sm font-medium text-white truncate max-w-[120px]">{isLocal ? 'You' : participant.name}</span>
          {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip text={participant.isPinned ? 'Unpin' : 'Pin'}>
            <button
              onClick={() => onTogglePin(participant.id)}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-md backdrop-blur-sm transition-colors"
            >
              <Pin className={cn('w-3.5 h-3.5', participant.isPinned ? 'text-blue-400' : 'text-white')} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/30 transition-colors opacity-0 group-hover:opacity-100"
      />
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
  onTogglePiP,
  isPiPActive,
  chatUnread,
  onToggleLayout,
  layoutMode,
  onOpenReactions,
  callDuration,
}: any) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 100, opacity: 0 }}
    className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw]"
  >
    <div className="flex flex-wrap items-center justify-center gap-1 px-2 sm:px-4 py-2 bg-gray-900/85 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
      <Tooltip text="Meeting Info">
        <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Info className="w-5 h-5" />
        </button>
      </Tooltip>

      <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />

      <ControlButton icon={micOn ? <Mic /> : <MicOff />} label="Mute" onClick={onToggleMic} active={micOn} danger={!micOn} />
      <ControlButton icon={cameraOn ? <Video /> : <VideoOff />} label="Camera" onClick={onToggleCamera} active={cameraOn} danger={!cameraOn} />
      <ControlButton icon={screenSharing ? <MonitorOff /> : <Monitor />} label="Present" onClick={onToggleScreen} active={screenSharing} />
      <ControlButton icon={<Captions />} label="Captions" onClick={() => {}} />

      <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />

      <ControlButton icon={<Smile />} label="React" onClick={onOpenReactions} />
      <ControlButton icon={<Users />} label="People" onClick={onTogglePeople} badge={3} />
      <ControlButton icon={<MessageSquare />} label="Chat" onClick={onToggleChat} badge={chatUnread} />
      {/* Layout toggle disabled - always using grid layout */}
      {/*  <ControlButton icon={<Layout />} label="Layout" onClick={onToggleLayout} tooltipText={`Switch to ${layoutMode === 'grid' ? 'Spotlight' : 'Grid'}`} /> */}
      <ControlButton icon={isPiPActive ? <Minimize2 /> : <Maximize2 />} label="PiP" onClick={onTogglePiP} />

      <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />

      <ControlButton icon={<PhoneOff className="text-red-400" />} label="Leave" onClick={onEndCall} danger tooltipText="End call" />
    </div>

    {/* Call Duration */}
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {formatDuration(callDuration)}
    </div>
  </motion.div>
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
}: any) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex gap-2">
            {(['people', 'chat', 'activities'] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                  activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {activeTab === 'people' && (
            <>
              <ParticipantRow participant={localParticipant} isLocal />
              {participants.map((p: Participant) => (
                <ParticipantRow key={p.id} participant={p} isLocal={false} />
              ))}
            </>
          )}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-3 mb-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((m: ChatMessage) => <ChatBubble key={m.id} message={m} />)
                )}
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-white/10">
                <input
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      onSendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button onClick={() => {
                  const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    onSendMessage(input.value);
                    input.value = '';
                  }
                }} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Recent Reactions</h4>
                <div className="flex flex-wrap gap-2">
                  {REACTION_EMOJIS.map((emoji) => (
                    <span key={emoji} className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Raise Hand</h4>
                <p className="text-xs text-gray-400 mb-2">Notify others that you'd like to speak.</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg w-full justify-center transition-colors">
                  <Hand className="w-4 h-4" />
                  Raise Hand
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ReactionPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.8, opacity: 0, y: 20 }}
    className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-50 shadow-2xl"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-200">Reactions</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md"> <X className="w-4 h-4 text-gray-400" /> </button>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="p-2 text-2xl hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-90"
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
    className="fixed bottom-32 right-4 w-64 h-44 bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-40 cursor-grab active:cursor-grabbing"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
      <Avatar name={participant.name} size="lg" isMuted={participant.isMuted} />
    </div>
    <div className="absolute top-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white font-medium backdrop-blur-sm">
      Screen Sharing
    </div>
    <button
      onClick={onClose}
      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-colors"
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-white mb-2">Leave meeting?</h3>
          <p className="text-gray-400 mb-6">
            {isHost ? 'Are you sure you want to end the meeting for all participants, or just leave?' : 'You will disconnect from this meeting.'}
          </p>
          <div className="space-y-3">
            {isHost && (
              <button
                onClick={onEndForAll}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                End meeting for everyone
              </button>
            )}
            <button
              onClick={onLeave}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 font-medium rounded-xl transition-colors"
            >
              Leave meeting
            </button>
            <button onClick={onClose} className="mt-2 text-sm text-gray-500 hover:text-gray-300 transition-colors w-full text-center">
              Cancel
            </button>
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
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-center p-6"
  >
    <motion.div
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="max-w-md w-full"
    >
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">Meeting Ended</h2>
      <div className="flex items-center justify-center gap-4 text-gray-400 mb-8">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <button
        onClick={onRedirect}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20"
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

  // Core State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant>({
    id: 'local', name: 'You', role: 'host' as ParticipantRole, isMuted: false, isVideoOn: true, isScreenSharing: false, isPinned: false, isSpeaking: false, avatarColor: getAvatarColor('You')
  });
  const [activeSpeakerId, setActiveSpeakerId] = useState('');
  const [layoutMode, setLayoutMode] = useState('auto');
  const [viewMode, setViewMode] = useState('grid');
  const [callDuration, setCallDuration] = useState(0);
  const [callEnded, setCallEnded] = useState(false);

  // UI State
  const [isPreJoin, setIsPreJoin] = useState(true); // Start with pre-join screen
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
  const [pipActive, setPipActive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tileWidths, setTileWidths] = useState<Record<string, number>>({});
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);
  const toastCounterRef = useRef(0);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [pipWindow, setPipWindow] = useState<PiPWindow | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Init Mock Data
  useEffect(() => {
    const initial = MOCK_PARTICIPANTS.map((p) => ({ ...p, avatarColor: getAvatarColor(p.name), isSpeaking: false }));
    setParticipants(initial);
    addToast('info', 'Connected to meeting');
    addToast('success', `Sarah Chen joined`);
  }, []);

  // Simulate Speaking & Activity
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

  // Timer
  useEffect(() => {
    if (!callEnded) {
      const t = setInterval(() => setCallDuration((d) => d + 1), 1000);
      return () => clearInterval(t);
    }
  }, [callEnded]);

  // Toast Manager
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${toastCounterRef.current++}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // Screen Sharing Functions
  const startScreenShare = useCallback(async () => {
    try {
      // Check if PiP is active and warn user
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

      console.log('Screen share stream obtained:', stream);
      setScreenStream(stream);
      setScreenSharing(true);
      setLocalParticipant(prev => ({ ...prev, isScreenSharing: true }));


      addToast('success', 'Screen sharing started - others can now see your screen');

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      if (error.name === 'NotAllowedError') {
        addToast('error', 'Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        addToast('error', 'No screen sharing sources found. Make sure you have a screen or window to share.');
      } else if (error.name === 'NotReadableError') {
        addToast('error', 'Screen sharing is already in use by another application.');
      } else {
        addToast('error', `Failed to start screen sharing: ${error.message || 'Unknown error'}`);
      }
    }
  }, [addToast, isPiPActive]);

  // Set up video stream when screenSharing becomes true
  useEffect(() => {
    if (screenSharing && screenStream && screenVideoRef.current) {
      console.log('Setting screen share stream to video element:', screenStream);
      screenVideoRef.current.srcObject = screenStream;

      // Add event listeners for debugging
      const videoElement = screenVideoRef.current;
      videoElement.addEventListener('loadedmetadata', () => {
        console.log('Screen share video loaded metadata');
      });

      videoElement.addEventListener('canplay', () => {
        console.log('Screen share video can play');
      });

      videoElement.addEventListener('playing', () => {
        console.log('Screen share video is playing');
      });

      // Ensure video plays (handle autoplay restrictions)
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Screen share video started playing successfully');
        }).catch(error => {
          console.error('Error playing screen share video:', error);
          // Try to play again after user interaction
          const handleUserInteraction = () => {
            screenVideoRef.current?.play().catch(e => console.error('Retry play failed:', e));
            document.removeEventListener('click', handleUserInteraction);
          };
          document.addEventListener('click', handleUserInteraction);
          addToast('warning', 'Click anywhere to start screen sharing');
        });
      }

      // Cleanup function
      return () => {
        videoElement.removeEventListener('loadedmetadata', () => {});
        videoElement.removeEventListener('canplay', () => {});
        videoElement.removeEventListener('playing', () => {});
      };
    }
  }, [screenSharing, screenStream, addToast]);

  // Combine local and remote participants for grid calculation
  const allParticipants = useMemo(() => {
    return [localParticipant, ...participants];
  }, [localParticipant, participants]);

  // Sort participants: Pinned -> Speaking -> Others
  const sortedParticipants = useMemo(() => {
    const pinned = allParticipants.filter((p) => p.isPinned);
    const active = allParticipants.filter((p) => p.isSpeaking && !p.isPinned);
    const others = allParticipants.filter((p) => !p.isPinned && !p.isSpeaking);
    return [...pinned, ...active, ...others];
  }, [allParticipants]);

  // Clean up PiP when call ends
  useEffect(() => {
    if (callEnded && pipWindow && !pipWindow.closed) {
      pipWindow.close();
      setPipWindow(null);
      setIsPiPActive(false);
    }
  }, [callEnded, pipWindow]);

  // Update PiP window when participants or screen sharing change
  useEffect(() => {
    if (pipWindow && !pipWindow.closed && pipWindow.pipContent) {
      console.log('Updating PiP window - screenSharing:', screenSharing, 'screenStream:', !!screenStream);
      const content = pipWindow.pipContent;
      const allParticipants = [localParticipant, ...sortedParticipants];

      // Clear existing content
      content.innerHTML = '';

      // Rebuild content
      allParticipants.forEach(participant => {
        const tile = pipWindow.document.createElement('div');
        tile.className = 'pip-tile';

        if (participant.id === 'local' && screenSharing && screenStream) {
          console.log('Showing screen share in PiP for local participant');
          // Show screen share for local participant
          const video = pipWindow.document.createElement('video');
          video.className = 'pip-video';
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.controls = false;
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.backgroundColor = '#000';
          video.srcObject = screenStream;

          // Ensure video plays
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('PiP update screen share video playing successfully');
            }).catch(error => {
              console.error('PiP update screen share video play failed:', error);
            });
          }

          tile.appendChild(video);
        } else {
          // Show avatar for other participants or local when not sharing
          const avatar = pipWindow.document.createElement('div');
          avatar.className = 'pip-avatar';
          avatar.textContent = participant.name.charAt(0).toUpperCase();
          tile.appendChild(avatar);
        }

        const name = pipWindow.document.createElement('div');
        name.className = 'pip-name';
        name.textContent = participant.name;
        tile.appendChild(name);

        if (participant.isSpeaking) {
          const indicator = pipWindow.document.createElement('div');
          indicator.className = 'speaking-indicator';
          tile.appendChild(indicator);
        }

        content.appendChild(tile);
      });
    }
  }, [pipWindow, localParticipant, sortedParticipants, screenSharing, screenStream]);

  // Clean up on unmount
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
    console.log('Stopping screen share');
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      setScreenStream(null);
    }

    setScreenSharing(false);
    setLocalParticipant(prev => ({ ...prev, isScreenSharing: false }));

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
      screenVideoRef.current.pause();
    }

    addToast('info', 'Screen sharing stopped');
  }, [screenStream, addToast]);

  const toggleScreenShare = useCallback(() => {
    console.log('Toggle screen share called. Current state:', screenSharing, 'PiP active:', isPiPActive);
    if (screenSharing) {
      console.log('Stopping screen share');
      stopScreenShare();
    } else {
      console.log('Starting screen share');
      startScreenShare();
    }
  }, [screenSharing, startScreenShare, stopScreenShare, isPiPActive]);

  // Picture-in-Picture Functions
  const openPictureInPicture = useCallback(async () => {
    try {
      // Check if documentPictureInPicture API is supported
      if ('documentPictureInPicture' in window) {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 400,
          height: 300,
          disallowReturnToOpener: false,
        });

        setPipWindow(pipWindow);
        setIsPiPActive(true);

        // Create the PiP window content
        const pipDocument = pipWindow.document;

        // Add styles
        const style = pipDocument.createElement('style');
        style.textContent = `
          body {
            margin: 0;
            padding: 8px;
            background: #0f0f11;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
          }
          .pip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            font-weight: 500;
          }
          .pip-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 4px;
            height: calc(100vh - 40px);
          }
          .pip-tile {
            background: #1a1a1c;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
            aspect-ratio: 16/9;
          }
          .pip-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .pip-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .pip-name {
            position: absolute;
            bottom: 2px;
            left: 2px;
            right: 2px;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 10px;
            padding: 1px 2px;
            border-radius: 2px;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .speaking-indicator {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 1s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `;
        pipDocument.head.appendChild(style);

        // Create content
        const header = pipDocument.createElement('div');
        header.className = 'pip-header';
        header.innerHTML = `
          <span>Meeting Overlay</span>
          <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">×</button>
        `;

        const content = pipDocument.createElement('div');
        content.className = 'pip-content';

        // Add participants to PiP window
        const allParticipants = [localParticipant, ...sortedParticipants];
        allParticipants.forEach(participant => {
          const tile = pipDocument.createElement('div');
          tile.className = 'pip-tile';

          if (participant.id === 'local' && screenSharing) {
            // Show screen share for local participant
            const video = pipWindow.document.createElement('video');
            video.className = 'pip-video';
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.controls = false;
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.backgroundColor = '#000';

            if (screenStream) {
              console.log('Setting screen stream to PiP video:', screenStream);
              video.srcObject = screenStream;

              // Ensure video plays
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  console.log('PiP screen share video playing successfully');
                }).catch(error => {
                  console.error('PiP screen share video play failed:', error);
                  // Fallback: try to play on user interaction
                  video.addEventListener('click', () => {
                    video.play().catch(e => console.error('Fallback play failed:', e));
                  });
                });
              }
            } else {
              console.log('No screen stream available for PiP');
            }
            tile.appendChild(video);
          } else {
            // Show avatar for other participants
            const avatar = pipDocument.createElement('div');
            avatar.className = 'pip-avatar';
            avatar.textContent = participant.name.charAt(0).toUpperCase();
            tile.appendChild(avatar);
          }

          const name = pipDocument.createElement('div');
          name.className = 'pip-name';
          name.textContent = participant.name;
          tile.appendChild(name);

          if (participant.isSpeaking) {
            const indicator = pipDocument.createElement('div');
            indicator.className = 'speaking-indicator';
            tile.appendChild(indicator);
          }

          content.appendChild(tile);
        });

        pipDocument.body.appendChild(header);
        pipDocument.body.appendChild(content);

        // Store references for updates
        pipWindow.pipContent = content;
        pipWindow.participants = allParticipants;

        // Handle window close
        pipWindow.addEventListener('pagehide', () => {
          setPipWindow(null);
          setIsPiPActive(false);
        });

        addToast('success', 'Picture-in-Picture mode activated');
      } else {
        // Fallback for browsers without documentPictureInPicture support
        addToast('warning', 'Picture-in-Picture not supported in this browser');
      }
    } catch (error) {
      console.error('Error opening Picture-in-Picture:', error);
      addToast('error', 'Failed to open Picture-in-Picture mode');
    }
  }, [localParticipant, sortedParticipants, screenSharing, screenStream, addToast]);

  const closePictureInPicture = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      setIsPiPActive(false);
      addToast('info', 'Picture-in-Picture mode closed');
    }
  }, [pipWindow, addToast]);

  const togglePiP = useCallback(() => {
    if (isPiPActive) {
      closePictureInPicture();
    } else {
      openPictureInPicture();
    }
  }, [isPiPActive, openPictureInPicture, closePictureInPicture]);

  // Layout Logic - Always use grid mode for static layout
  const effectiveViewMode = useMemo(() => {
    return 'grid'; // Always use grid layout
  }, []);

  // Dynamic Grid Logic based on count
  const gridCols = useMemo(() => {
    const count = sortedParticipants.length;
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'; // Stack on mobile, side-by-side on desktop
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [sortedParticipants.length]);

  // Handlers
  const handleTogglePin = useCallback((id: string) => {
    if (id === 'local') {
      setLocalParticipant(prev => ({ ...prev, isPinned: !prev.isPinned }));
      addToast('info', 'Pinned yourself');
    } else {
      setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
      addToast('info', 'Pinned participant');
    }
  }, [addToast]);

  const handleResize = useCallback((id: string, width: number) => {
    setTileWidths((prev) => ({ ...prev, [id]: width }));
  }, []);

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
    updateParticipant: (id: string, updates: Partial<Participant>) => setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p)),
    layoutMode: layoutMode as LayoutMode,
    setLayoutMode,
    activeSpeakerId,
  }), [addToast, participants, layoutMode, activeSpeakerId]);

  // Show pre-join screen before entering room
  if (isPreJoin) {
    return <PreJoinScreen roomId={roomId || ''} onJoin={() => setIsPreJoin(false)} onBack={() => navigate(-1)} />;
  }

  if (callEnded) {
    return <PostCallSummary duration={callDuration} onRedirect={handleRedirect} />;
  }

  return (
    <MeetingContext.Provider value={ctxValue}>
      <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden min-h-screen">
        {/* Top Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-white/5 z-20 gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-white truncate">Investment Discussion - TechWave AI</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure meeting • {roomId || 'ABC-1234'}</span>
                <button onClick={() => navigator.clipboard.writeText(roomId || 'ABC-1234')} className="hover:text-white transition-colors flex items-center gap-1 sm:ml-2">
                  <Copy className="w-3 h-3" /> Copy ID
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
              {allParticipants.length} people
            </span>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><Settings className="w-5 h-5" /></button>
            <button onClick={() => setShowInfo(true)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><Info className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Main Stage - Responsive Grid */}
        <main className="flex-1 relative flex items-center justify-center p-2 sm:p-4 pb-20 sm:pb-24 overflow-auto">
          <div className="w-full h-full grid gap-2 sm:gap-3 auto-rows-fr grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {/* Screen Share - Always rendered but only visible when active */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: screenSharing ? 1 : 0,
                scale: screenSharing ? 1 : 0.9,
                gridColumn: screenSharing ? 'span 1 / span 4' : 'span 1'
              }}
              className={`bg-gray-900/40 rounded-2xl overflow-hidden border relative group transition-opacity duration-300 ${
                screenSharing ? 'border-blue-400/50 col-span-1 md:col-span-2 lg:col-span-3' : 'border-transparent'
              }`}
              style={{ display: screenSharing ? 'block' : 'none' }}
            >
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                className="w-full h-full object-contain bg-black"
                style={{
                  minHeight: screenSharing ? '200px' : '0',
                  maxHeight: screenSharing ? '60vh' : '0',
                  borderRadius: '0.5rem'
                }}
                onLoadedData={() => console.log('Screen share video loaded data')}
                onLoadStart={() => console.log('Screen share video load start')}
                onError={(e) => console.error('Screen share video error:', e)}
              />
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  Screen Share
                </div>
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                  LIVE
                </div>
              </div>
              <button
                onClick={stopScreenShare}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Regular video tiles */}
            {sortedParticipants.map((participant) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                isLocal={participant.id === 'local'}
                layoutMode="grid"
                onTogglePin={handleTogglePin}
                onResize={handleResize}
                currentWidth={tileWidths[participant.id]}
              />
            ))}
          </div>

          {/* Overlays & Panels */}
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

          {pipActive && (
            <PiPWindow participant={localParticipant} onClose={() => setPipActive(false)} />
          )}

          <SidePanel
            isOpen={panelOpen}
            activeTab={activePanelTab}
            onTabChange={setActivePanelTab}
            onClose={() => setPanelOpen(false)}
            participants={participants}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            localParticipant={localParticipant}
          />
        </main>

        {/* Floating Control Bar */}
        <ControlBar
          micOn={micOn}
          cameraOn={cameraOn}
          screenSharing={screenSharing}
          onToggleMic={() => { setMicOn(!micOn); addToast('info', micOn ? 'Microphone muted' : 'Microphone unmuted'); }}
          onToggleCamera={() => setCameraOn(!cameraOn)}
          onToggleScreen={toggleScreenShare}
          onEndCall={handleEndCall}
          onToggleChat={() => { setActivePanelTab('chat'); setChatUnread(0); setPanelOpen(!panelOpen); }}
          onTogglePeople={() => { setActivePanelTab('people'); setPanelOpen(!panelOpen); }}
          onTogglePiP={togglePiP}
          isPiPActive={isPiPActive}
          chatUnread={chatUnread}
          onToggleLayout={() => setLayoutMode((prev) => (prev === 'grid' ? 'spotlight' : prev === 'spotlight' ? 'grid' : 'auto'))}
          layoutMode={layoutMode}
          onOpenReactions={() => setShowReactions(!showReactions)}
          callDuration={callDuration}
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

        {/* Modals */}
        <MeetingSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <MeetingInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} meetingCode={roomId || ''} />
      </div>
    </MeetingContext.Provider>
  );
};

export default VideoRoom;