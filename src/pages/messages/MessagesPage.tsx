import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getConversationsForUser } from '../../data/messages';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { MessageCircle, Plus } from 'lucide-react';
import './MessagesPage.css';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const conversations = getConversationsForUser(user.id);
  
  return (
    <div className="messages-page-container">
      <div className="messages-page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Messages</h1>
          <p className="text-sm text-slate-500 font-medium">Connect and collaborate with your network</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="messages-content-card bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {conversations.length > 0 ? (
          <ChatUserList conversations={conversations} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-indigo-50/50">
              <MessageCircle size={32} className="text-indigo-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              No Messages Yet
            </h2>
            <p className="text-slate-500 max-w-sm mx-auto text-base font-medium leading-relaxed mb-8">
              Reach out to entrepreneurs or investors to start your first professional conversation.
            </p>
            
            <button 
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              onClick={() => window.location.hash = '#/investors'}
            >
              Explore Community
            </button>
          </div>
        )}
      </div>
    </div>
  );
};