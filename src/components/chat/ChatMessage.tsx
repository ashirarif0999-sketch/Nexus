import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { Message } from '../../types';
import { Avatar } from '../ui/Avatar';
import { findUserById } from '../../data/users';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser }) => {
  const user = findUserById(message.senderId);

  if (!user) return null;

  return (
    <div
      className={clsx('chat-message-container flex mb-4 animate-fade-in', isCurrentUser ? 'justify-end' : 'justify-start')}
    >
      {!isCurrentUser && (
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
          className="chat-avatar-sender mr-2 self-end"
        />
      )}

      <div className={clsx('chat-message-content flex flex-col', isCurrentUser ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'chat-message-bubble max-w-xs sm:max-w-md px-4 py-2 rounded-lg',
            isCurrentUser
              ? 'chat-bubble-sent bg-primary-600 text-white rounded-br-none'
              : 'chat-bubble-received bg-gray-100 text-gray-800 rounded-bl-none'
          )}
        >
          <p className="chat-message-text text-sm">{message.content}</p>
        </div>

        <span className="chat-message-timestamp text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>

      {isCurrentUser && (
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
          className="chat-avatar-receiver ml-2 self-end"
        />
      )}
    </div>
  );
};