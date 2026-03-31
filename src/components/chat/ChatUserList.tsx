import React, { memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { ChatConversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { findUserById, getAllUsers } from '../../data/users';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/routes';
import './MessagingPremium.css';

interface ChatUserListProps {
  conversations: ChatConversation[];
  onUserSelect?: (userId: string) => void;
}

export const ChatUserList: React.FC<ChatUserListProps> = memo(function ChatUserList({ conversations, onUserSelect }) {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;

  const handleSelectUser = (userId: string) => {
    if (onUserSelect) onUserSelect(userId);
    else navigate(ROUTES.CHAT.CONVERSATION(userId));
  };

  const hasExistingConversations = conversations.length > 0;
  const allUsers = getAllUsers();
  const displayConversations = hasExistingConversations
    ? conversations
    : allUsers
        .filter(u => u.id !== currentUser.id)
        .map(user => ({
          id: `new-${user.id}`,
          participants: [currentUser.id, user.id],
          lastMessage: undefined,
          updatedAt: new Date().toISOString()
        }));

  return (
    <div className="chat-user-list-container h-full overflow-y-auto w-full custom-scrollbar bg-white">
      <div className="chat-user-list-header py-6">
        <h2 className="px-6 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
          {hasExistingConversations ? 'Recent Messages' : 'Start Conversation'}
        </h2>

        <div className="chat-user-list-items space-y-1 px-3">
          {displayConversations.length > 0 ? (
            displayConversations.map(conversation => {
              const otherParticipantId = conversation.participants.find(id => id !== currentUser.id);
              if (!otherParticipantId) return null;

              const otherUser = findUserById(otherParticipantId);
              if (!otherUser) return null;

              const lastMessage = conversation.lastMessage;
              const isActive = activeUserId === otherParticipantId;

              return (
                <div
                  key={conversation.id}
                  className={clsx(
                    'chat-user-item px-4 py-3 flex items-center cursor-pointer transition-all duration-200 group border border-transparent',
                    isActive
                      ? 'bg-indigo-50/80 border-indigo-100 shadow-sm'
                      : 'hover:bg-slate-50'
                  )}
                  onClick={() => handleSelectUser(otherUser.id)}
                >
                  <div className="relative mr-3 flex-shrink-0">
                    <Avatar
                      src={otherUser.avatarUrl}
                      alt={otherUser.name}
                      size="md"
                      className={clsx(
                        'chat-user-avatar border-2 transition-transform duration-200 group-hover:scale-105',
                        isActive ? 'border-indigo-500 shadow-sm' : 'border-slate-100'
                      )}
                    />
                    {otherUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm z-10" />
                    )}
                  </div>

                  <div className="chat-user-info flex-1 min-w-0">
                    <div className="chat-user-name-row flex justify-between items-baseline mb-0.5">
                      <h3 className={clsx(
                        'text-sm font-bold truncate transition-colors duration-200',
                        isActive ? 'text-indigo-700' : 'text-slate-900 group-hover:text-indigo-600'
                      )}>
                        {otherUser.name}
                      </h3>
                      {lastMessage && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>

                    <div className="chat-user-last-message-row flex justify-between items-center">
                      <p className={clsx(
                        "text-xs line-clamp-1 transition-all duration-200",
                        lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id 
                          ? "text-slate-900 font-bold" 
                          : "text-slate-500 font-medium"
                      )}>
                        {lastMessage ? (lastMessage.senderId === currentUser.id ? 'You: ' : '') + lastMessage.content : 'New chat'}
                      </p>
                      {lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id && (
                        <div className="ml-2 w-2 h-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 m-3">
              <p className="text-sm text-slate-400 font-medium">No active connections</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
