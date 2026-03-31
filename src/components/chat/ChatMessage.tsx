import React, { useState, useRef, useEffect, memo } from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Message } from '../../types';
import { Avatar } from '../ui/Avatar';
import { findUserById } from '../../data/users';
import toast from 'react-hot-toast';
import { Reply, Copy, Forward, Star, Trash2, MoreVertical, CheckCheck } from 'lucide-react';
import joypixels from 'emoji-toolkit';
import './MessagingPremium.css';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onCopy?: (message: Message) => void;
  currentUserId?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = memo(function ChatMessage({
  message,
  isCurrentUser,
  onReaction,
  onDelete,
  onStar,
  onReply,
  onForward,
  onCopy,
  currentUserId
}) {
  const [showActions, setShowActions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0, alignRight: false });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const user = findUserById(message.senderId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showContextMenu || showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu, showActions]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const chatWindow = document.querySelector('.chat-messages-container');
    if (!chatWindow) return;

    const chatRect = chatWindow.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 220;

    let x = e.clientX - chatRect.left;
    let y = e.clientY - chatRect.top;

    // Boundary Detection
    const alignRight = x + menuWidth > chatRect.width;
    const alignBottom = y + menuHeight > chatRect.height;

    if (alignRight) x = x - menuWidth;
    if (alignBottom) y = y - (menuHeight / 2); // Center if possible upward

    setMenuPos({ x, y, alignRight });
    setShowContextMenu(true);
    setShowActions(false);
  };

  if (!user) return null;

  const closeMenus = () => {
    setShowContextMenu(false);
    setShowActions(false);
  };

  const handleAction = (fn?: (msg: Message) => void, copyText?: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fn) fn(message);
    else if (copyText) {
      navigator.clipboard.writeText(copyText);
      toast.success('Copied to clipboard');
    }
    closeMenus();
  };

  const uniqueReactions = message.reactions?.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
    }
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.userId);
    return acc;
  }, {} as Record<string, { emoji: string; count: number; users: string[] }>) || {};

  return (
    <article
      ref={containerRef}
      className={clsx(
        'nexus-message-item group relative flex w-full mb-6 transition-all duration-300 px-4',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      <figure className={clsx('nexus-message-avatar flex-shrink-0', isCurrentUser ? 'ml-3' : 'mr-3')}>
        <Avatar 
          src={user.avatarUrl} 
          alt={user.name} 
          size="sm" 
          className="border-2 border-white shadow-sm" 
        />
      </figure>

      {/* Message Bubble Column */}
      <div className={clsx('nexus-message-content flex flex-col max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
        {/* Actions Trigger */}
        <div className={clsx(
          "nexus-message-actions absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
          isCurrentUser ? "right-[13%] -top-4" : "left-[13%] -top-4"
        )}>
          <button 
            onClick={() => setShowActions(!showActions)}
            className="nexus-message-actions-toggle p-1 px-2 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-1"
          >
            <MoreVertical size={14} />
          </button>

          {showActions && (
            <nav 
              ref={dropdownRef}
              className={clsx(
                "nexus-message-actions-menu absolute top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[200] animate-in fade-in slide-in-from-top-2",
                isCurrentUser ? "right-0" : "left-0"
              )}
            >
              <button onClick={handleAction(onReply)} className="message-action flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
                <Reply size={16} /> Reply
              </button>
              <button onClick={handleAction(onCopy, message.content)} className="message-action flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
                <Copy size={16} /> Copy
              </button>
              <button onClick={handleAction(onForward)} className="message-action flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
                <Forward size={16} /> Forward
              </button>
              <button 
                onClick={handleAction(() => onStar && onStar(message.id))} 
                className={clsx("message-action flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-sm font-medium border-t border-slate-100 mt-1", message.isStarred ? 'text-amber-500' : 'text-slate-600')}
              >
                <Star size={16} fill={message.isStarred ? 'currentColor' : 'none'} /> {message.isStarred ? 'Unstar' : 'Star'}
              </button>
              {isCurrentUser && (
                <button onClick={handleAction(() => onDelete && onDelete(message.id))} className="message-action flex items-center gap-3 w-full px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium border-t border-slate-100 mt-1">
                  <Trash2 size={16} /> Delete
                </button>
              )}
              <div className="message-action-emojis message-action flex items-center gap-1.5 px-3 py-2 border-t border-slate-100 mt-1">
                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => onReaction && onReaction(message.id, emoji)}
                    className="p-1 hover:bg-slate-100 rounded-md transition-all grayscale hover:grayscale-0 text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>

        {/* Bubble */}
        <div className={clsx(
          'nexus-message-bubble relative px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium transition-all duration-200',
          isCurrentUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
        )}
          dangerouslySetInnerHTML={{ __html: joypixels.toImage(message.content) }}
        />

        {/* Footer */}
        <footer className="nexus-message-timestamp flex items-center gap-2 mt-1 px-1 opacity-60">
          <time className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-slate-400">
            {format(new Date(message.timestamp), 'HH:mm')}
          </time>
          {message.isStarred && <Star size={10} className="text-amber-400 fill-current" />}
          {isCurrentUser && message.isDelivered && <CheckCheck size={14} className="text-indigo-400" />}
        </footer>

        {/* Reactions */}
        {Object.keys(uniqueReactions).length > 0 && (
          <ul className="nexus-message-reactions flex flex-wrap gap-1 mt-2">
            {Object.values(uniqueReactions).map(r => (
              <li 
                key={r.emoji} 
                className={clsx(
                  "px-2 py-0.5 border rounded-full text-[10px] font-bold flex items-center gap-1 transition-all",
                  r.users.includes(currentUserId || '') 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" 
                    : "bg-slate-100 border-slate-200 text-slate-600"
                )}
              >
                {r.emoji} {r.count > 1 && r.count}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <nav
          ref={contextMenuRef}
          className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-2 w-48 z-[200] animate-in fade-in zoom-in-95"
          style={{ 
            left: `${menuPos.x + document.querySelector('.chat-messages-container')!.getBoundingClientRect().left}px`,
            top: `${menuPos.y + document.querySelector('.chat-messages-container')!.getBoundingClientRect().top}px`
          }}
        >
          <button onClick={handleAction(onReply)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
            <Reply size={16} /> Reply
          </button>
          <button onClick={handleAction(onCopy, message.content)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
            <Copy size={16} /> Copy
          </button>
          <button onClick={handleAction(onForward)} className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium">
            <Forward size={16} /> Forward
          </button>
        </nav>
      )}
    </article>
  );
});
