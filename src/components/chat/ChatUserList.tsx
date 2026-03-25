import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { ChatConversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { findUserById } from '../../data/users';
import { useAuth } from '../../context/AuthContext';

interface ChatUserListProps {
  conversations: ChatConversation[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;

  const handleSelectUser = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="chat-user-list-container bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="chat-user-list-header py-4">
        <h2 className="chat-user-list-title px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>

        <div className="chat-user-list-items space-y-1">
          {conversations.length > 0 ? (
            conversations.map(conversation => {
              // Get the other participant (not the current user)
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
                    'chat-user-list-item px-4 py-3 flex cursor-pointer transition-colors duration-200',
                    isActive
                      ? 'chat-user-item-active bg-primary-50 border-l-4 border-primary-600'
                      : 'chat-user-item-default hover:bg-gray-50 border-l-4 border-transparent'
                  )}
                  onClick={() => handleSelectUser(otherUser.id)}
                >
                  <Avatar
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                    size="md"
                    status={otherUser.isOnline ? 'online' : 'offline'}
                    className="chat-user-avatar mr-3 flex-shrink-0"
                  />

                  <div className="chat-user-info flex-1 min-w-0">
                    <div className="chat-user-name-row flex justify-between items-baseline">
                      <h3 className="chat-user-name text-sm font-medium text-gray-900 truncate">
                        {otherUser.name}
                      </h3>

                      {lastMessage && (
                        <span className="chat-user-last-message-time text-xs text-gray-500">
                          {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>

                    <div className="chat-user-last-message-row flex justify-between items-center mt-1">
                      {lastMessage && (
                        <p className="chat-user-last-message text-xs text-gray-600 truncate">
                          {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      )}

                      {lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser.id && (
                        <Badge variant="primary" size="sm" rounded>New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="chat-empty-state px-4 py-8 text-center">
              <p className="chat-empty-state-text text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};