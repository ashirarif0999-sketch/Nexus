import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Phone, Globe, ShieldCheck } from 'lucide-react';

export const MeetingInfoModal: React.FC<{ isOpen: boolean; onClose: () => void; meetingCode: string }> = ({ isOpen, onClose, meetingCode }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white">Meeting info</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Meeting code</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white tracking-widest">{meetingCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(meetingCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click the icon above to copy the link.</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" />Secure</span>
            <span className="text-gray-300">Only invited users can join</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-200">Join by phone</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              <span>+1 212-555-0199</span>
              <span className="bg-white/5 px-1 rounded">US</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              <span>+44 20 7946 0958</span>
              <span className="bg-white/5 px-1 rounded">UK</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeetingInfoModal;