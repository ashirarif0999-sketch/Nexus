import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ChevronRight, Mic, Video, Speaker } from 'lucide-react';

export const MeetingSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [micDevice, setMicDevice] = useState('Default Microphone');
  const [speakerDevice, setSpeakerDevice] = useState('Default Speaker');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <SettingGroup icon={<Mic className="w-4 h-4" />} label="Microphone" value={micDevice} onChange={setMicDevice} options={['Default Microphone', 'Logitech H151', 'MacBook Pro Mic']} />
          <SettingGroup icon={<Speaker className="w-4 h-4" />} label="Speakers" value={speakerDevice} onChange={setSpeakerDevice} options={['Default Speaker', 'AirPods Pro']} />
          <SettingGroup icon={<Video className="w-4 h-4" />} label="Camera" value="FaceTime HD Camera" onChange={() => {}} options={['FaceTime HD Camera', 'Logitech C920']} />
        </div>

        <div className="p-4 bg-gray-950/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Done</button>
        </div>
      </motion.div>
    </div>
  );
};

const SettingGroup = ({ icon, label, value, options, onChange }: any) => (
  <div className="relative">
    <label className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-1">{icon}{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
    >
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <ChevronRight className="absolute right-3 bottom-[6px] w-4 h-4 text-gray-500 pointer-events-none rotate-90" />
  </div>
);

export default MeetingSettingsModal;