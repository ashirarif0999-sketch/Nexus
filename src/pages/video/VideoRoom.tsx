import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
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
  Grid,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';
import { ROUTES } from '../../config/routes';

// ============================================
// ATOMS - Base UI Primitives
// ============================================

// Icon Button Atom
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  isDanger?: boolean;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  isActive = false,
  isDanger = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const activeClasses = isDanger
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : isActive
    ? 'bg-gray-600 hover:bg-gray-500 text-white'
    : 'bg-gray-700 hover:bg-gray-600 text-white';

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full transition-all duration-200 transform hover:scale-105 ${activeClasses} shadow-lg`}
    >
      {icon}
    </button>
  );
};

// Badge Atom
interface BadgeProps {
  variant: 'muted' | 'active' | 'screen-share';
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  const variants = {
    muted: 'bg-red-500 text-white',
    active: 'bg-primary-500 text-white',
    'screen-share': 'bg-green-500 text-white',
  };

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Avatar Atom
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isMuted?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', isMuted = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-primary-600 flex items-center justify-center font-bold text-white`}>
        {name.charAt(0)}
      </div>
      {isMuted && (
        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
          <MicOff className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

// ============================================
// MOLECULES - Combinations of Atoms
// ============================================

// Control Button Molecule
interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  isDanger?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onClick,
  isActive = false,
  isDanger = false,
}) => {
  return (
    <div className="flex flex-col items-center space-y-1">
      <IconButton
        icon={icon}
        onClick={onClick}
        isActive={isActive}
        isDanger={isDanger}
        size="lg"
      />
      <span className="text-xs text-white/70 font-medium">{label}</span>
    </div>
  );
};

// Video Overlay Molecule
interface VideoOverlayProps {
  name: string;
  isMuted: boolean;
  role: string;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  name,
  isMuted,
  role,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium text-sm">{name}</span>
          <span className="text-white/60 text-xs capitalize">({role})</span>
          {isMuted && (
            <Badge variant="muted">
              <MicOff className="w-3 h-3" />
            </Badge>
          )}
        </div>

      </div>
    </div>
  );
};

// Participant List Item Molecule
interface ParticipantItemProps {
  name: string;
  role: string;
  isMuted: boolean;
  isVideoOn: boolean;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({
  name,
  role,
  isMuted,
  isVideoOn,
}) => {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-xl transition-colors bg-gray-50">
      <Avatar name={name} size="sm" isMuted={isMuted} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 capitalize">{role}</p>
      </div>
      <div className="flex items-center space-x-1">
        {isMuted ? (
          <MicOff className="w-4 h-4 text-red-500" />
        ) : (
          <Mic className="w-4 h-4 text-gray-400" />
        )}
        {isVideoOn ? (
          <Video className="w-4 h-4 text-gray-400" />
        ) : (
          <VideoOff className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

// ============================================
// ORGANISMS - Complex Sections
// ============================================

// Video Tile Organism
interface VideoTileProps {
  participant: {
    id: string;
    name: string;
    role: 'entrepreneur' | 'investor';
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing?: boolean;
  };
  isLocal?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isLocal = false,
}) => {

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700 transition-all duration-300"
    >
      {/* Video Feed or Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        {participant.isVideoOn ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Avatar name={participant.name} size="lg" isMuted={participant.isMuted} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-2">
              <VideoOff className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">Camera off</p>
          </div>
        )}
      </div>

      {/* Video Overlay */}
      <VideoOverlay
        name={isLocal ? 'You' : participant.name}
        isMuted={participant.isMuted}
        role={participant.role}
      />

      {/* Local Indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-gray-900/80 rounded-md text-xs text-white font-medium">
            You
          </span>
        </div>
      )}
    </div>
  );
};

// Floating Control Bar Organism
interface ControlBarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  showParticipants: boolean;
  showChat: boolean;
  callDuration: number;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isVideoOn,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onToggleParticipants,
  onToggleChat,
  showParticipants,
  showChat,
  callDuration,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
      {/* Call Duration */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-gray-900/90 px-4 py-2 rounded-full">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
      </div>

      {/* Control Bar */}
      <div className="flex items-center space-x-2 bg-gray-800/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl border border-gray-700">
        <ControlButton
          icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          label={isMicOn ? 'Mute' : 'Unmute'}
          onClick={onToggleMic}
          isDanger={!isMicOn}
        />

        <ControlButton
          icon={isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          label={isVideoOn ? 'Stop Video' : 'Start Video'}
          onClick={onToggleVideo}
          isDanger={!isVideoOn}
        />

        <ControlButton
          icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          label={isScreenSharing ? 'Stop Share' : 'Share'}
          onClick={onToggleScreenShare}
          isActive={isScreenSharing}
        />

        <div className="w-px h-12 bg-gray-600 mx-2" />

        <ControlButton
          icon={<Users className="w-5 h-5" />}
          label="People"
          onClick={onToggleParticipants}
          isActive={showParticipants}
        />

        <ControlButton
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chat"
          onClick={onToggleChat}
          isActive={showChat}
        />

        <div className="w-px h-12 bg-gray-600 mx-2" />

        <ControlButton
          icon={<PhoneOff className="w-5 h-5" />}
          label="End"
          onClick={onEndCall}
          isDanger={true}
        />
      </div>
    </div>
  );
};

// Video Grid Organism
interface VideoGridProps {
  participants: Array<{
    id: string;
    name: string;
    role: 'entrepreneur' | 'investor';
    isMuted: boolean;
    isVideoOn: boolean;
  }>;
  localParticipant: {
    id: string;
    name: string;
    role: 'entrepreneur' | 'investor';
    isMuted: boolean;
    isVideoOn: boolean;
  };
}

const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  localParticipant,
}) => {
  // Dynamic grid calculation based on participant count
  const gridClasses = useMemo(() => {
    const totalParticipants = participants.length + 1; // +1 for local

    switch (totalParticipants) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  }, [participants.length]);

  // Standard grid layout
  return (
    <div className={`grid ${gridClasses} gap-4 h-full auto-rows-fr`}>
      {/* Local participant first */}
      <VideoTile
        participant={localParticipant}
        isLocal={true}
      />
      
      {/* Remote participants */}
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
        />
      ))}
    </div>
  );
};

// Side Drawer Organism
interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'chat' | 'participants';
  participants: Array<{
    id: string;
    name: string;
    role: string;
    isMuted: boolean;
    isVideoOn: boolean;
  }>;
}

const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  participants,
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: string; time: string }>>([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: message,
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMessage('');
  };

  return (
    <div
      className={`fixed md:relative right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {mode === 'participants' ? 'People (2)' : 'Chat'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-130px)] overflow-y-auto p-4">
        {mode === 'participants' ? (
          <div className="space-y-2">
            {participants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                name={participant.name}
                role={participant.role}
                isMuted={participant.isMuted}
                isVideoOn={participant.isVideoOn}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-gray-400 text-xs">Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{msg.sender}</span>
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{msg.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Message Input (Chat mode only) */}
      {mode === 'chat' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 bg-primary-600 rounded-xl text-white hover:bg-primary-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// TEMPLATES - Page Layout
// ============================================

// Mock participant data
const mockParticipants = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'entrepreneur' as const,
    isMuted: false,
    isVideoOn: true,
  },
  {
    id: '2',
    name: 'Michael Roberts',
    role: 'investor' as const,
    isMuted: false,
    isVideoOn: true,
  },
];

// Main Video Room Template
export const VideoRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Call state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(true);

  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInCall) {
        setCallDuration((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isInCall]);

  // Handlers
  const handleEndCall = () => {
    setIsInCall(false);
    navigate(-1);
  };

  const handleToggleParticipants = () => {
    setShowParticipants(!showParticipants);
    if (!showParticipants) setShowChat(false);
  };

  const handleToggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) setShowParticipants(false);
  };

  // Local participant (you)
  const localParticipant = {
    id: 'local',
    name: 'You',
    role: 'entrepreneur' as const,
    isMuted: !isMicOn,
    isVideoOn,
  };

  // If not in call, show ended screen
  if (!isInCall) {
    return (
      <div className="video-call-ended-screen page-fullscreen flex items-center justify-center h-screen bg-gray-900">
        <div className="call-ended-content text-center">
          <div className="call-ended-icon animate-pulse mb-4">
            <PhoneOff className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="call-ended-title text-xl font-semibold text-white mb-2">Call Ended</h2>
          <p className="call-ended-duration text-gray-400">Duration: {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}</p>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD.ENTREPRENEUR)}
            className="return-to-dashboard-button mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room-page page-fullscreen flex flex-col h-screen bg-gray-900 overflow-hidden">
      {/* Main Content Area */}
      <div className="video-room-content main-content flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <div className={`video-grid-container flex-1 p-4 transition-all duration-300 ${showParticipants || showChat ? 'mr-0 md:mr-0' : ''}`}>
          <VideoGrid
            participants={mockParticipants}
            localParticipant={localParticipant}
          />
        </div>

        {/* Side Drawer */}
        <SideDrawer
          isOpen={showParticipants || showChat}
          onClose={() => {
            setShowParticipants(false);
            setShowChat(false);
          }}
          mode={showParticipants ? 'participants' : 'chat'}
          participants={[
            { ...localParticipant, role: 'entrepreneur' },
            ...mockParticipants,
          ]}
        />
      </div>

      {/* Floating Control Bar */}
      <ControlBar
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={() => setIsMicOn(!isMicOn)}
        onToggleVideo={() => setIsVideoOn(!isVideoOn)}
        onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
        onEndCall={handleEndCall}
        onToggleParticipants={handleToggleParticipants}
        onToggleChat={handleToggleChat}
        showParticipants={showParticipants}
        showChat={showChat}
        callDuration={callDuration}
      />
    </div>
  );
};

export default VideoRoom;
