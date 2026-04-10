import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Captions, Phone, ArrowLeft } from 'lucide-react';

export const PreJoinScreen: React.FC<{ onJoin: () => void; onBack: () => void; roomId: string }> = ({ onJoin, onBack, roomId }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [captions, setCaptions] = useState(false);

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
      {/* Header */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-auto flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors touch-manipulation"><ArrowLeft className="w-5 h-5" /></button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">Investment Discussion - TechWave AI</h1>
          <p className="text-sm text-gray-400">Meeting ID: {roomId}</p>
        </div>
      </div>

      {/* Camera Preview */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative"
      >
        {camOn ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
            {/* Simulated Camera Feed */}
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">ME</div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <VideoOff className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-medium">Camera is off</p>
          </div>
        )}

        {/* Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-3">
          <ControlButton icon={micOn ? <Mic /> : <MicOff />} active={micOn} onClick={() => setMicOn(!micOn)} />
          <ControlButton icon={camOn ? <Video /> : <VideoOff />} active={camOn} onClick={() => setCamOn(!camOn)} />
          <ControlButton icon={<Captions />} active={captions} onClick={() => setCaptions(!captions)} />
        </div>
      </motion.div>

      {/* Join Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 sm:mt-8 px-4 sm:px-0 flex gap-3"
      >
        <button
          onClick={onJoin}
          className="px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2 touch-manipulation min-h-[48px]"
        >
          <Phone className="w-5 h-5" />
          Join now
        </button>
      </motion.div>
    </div>
  );
};

const ControlButton = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`p-3 rounded-full transition-all ${active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/90 text-white hover:bg-red-600'}`}>
    {icon}
  </button>
);

export default PreJoinScreen;