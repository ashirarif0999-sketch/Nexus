import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Settings, MoreVertical, Sparkles, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { playJoinCall } from '../../utils/audioManager';

const cn = (...classes: (string | undefined | null | false)[]) => twMerge(clsx(...classes));

interface PreJoinProps {
  onJoin: () => void;
  onBack: () => void;
  roomId: string;
}

export const PreJoinScreen: React.FC<PreJoinProps> = ({ onJoin, onBack, roomId }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);



  return (
    <div className="fixed inset-0 bg-[#202124] flex items-center justify-center p-4 sm:p-8 z-50 font-sans text-[#f1f3f4]">
      {/* Top Left Back Button/Info (Meet style) */}
      <div className="absolute top-4 left-6 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        
        {/* LEFT: Video Preview */}
        <div className="flex-1 w-full max-w-[640px]">
          <div className="relative aspect-video bg-[#3c4043] rounded-lg overflow-hidden border border-[#5f6368] shadow-2xl group">
            {camOn ? (
              <div className="w-full h-full bg-[#1e1f21] flex items-center justify-center relative">
                {/* Simulated Camera Feed */}
                <div className="w-24 h-24 rounded-full bg-[#8ab4f8] flex items-center justify-center text-[#202124] text-3xl font-bold shadow-lg">
                  ME
                </div>
                
                {/* Visual indicator for "You" */}
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-xs font-medium border border-white/10 backdrop-blur-md">
                  Your preview
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#202124]">
                <div className="w-24 h-24 rounded-full bg-[#3c4043] flex items-center justify-center text-gray-500 mb-4 border border-[#5f6368]">
                  <VideoOff className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium text-gray-400 font-medium">Camera is off</p>
              </div>
            )}

            {/* In-Video Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
              <button
                onClick={() => setMicOn(!micOn)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
                  micOn ? "bg-transparent border-[#5f6368] text-white hover:bg-white/10" : "bg-[#ea4335] border-[#ea4335] text-white hover:bg-[#d93025]"
                )}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
                  camOn ? "bg-transparent border-[#5f6368] text-white hover:bg-white/10" : "bg-[#ea4335] border-[#ea4335] text-white hover:bg-[#d93025]"
                )}
              >
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Effects/Blur floating button (Top right like meet) */}
            <button className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md border border-white/10 transition-colors">
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quick Settings icons below video */}
          <div className="mt-4 flex justify-center gap-6 text-[#9aa0a6]">
             <button className="flex items-center gap-2 text-xs hover:text-white transition-colors">
               <Settings className="w-4 h-4" />
               Check your audio and video
             </button>
          </div>
        </div>

        {/* RIGHT: Join Actions */}
        <div className="flex-1 w-full max-w-[400px] flex flex-col items-center lg:items-start text-center lg:text-left">
          <h2 className="text-3xl font-normal mb-1 text-[#e8eaed]">Ready to join?</h2>
          <p className="text-[#9aa0a6] text-sm mb-8">No one else is here yet</p>
          
          <div className="w-full space-y-4">
            <button
              onClick={() => {
                playJoinCall();
                onJoin();
              }}
              className="w-full sm:w-auto px-10 py-3 bg-[#8ab4f8] hover:bg-[#aecbff] text-[#202124] font-medium rounded-full transition-all text-sm tracking-wide shadow-md active:scale-95"
            >
              Join now
            </button>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 lg:mt-6 w-full">
              <button className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-full border border-[#5f6368] hover:bg-[#3c4043] text-[#8ab4f8] text-sm font-medium transition-all w-full sm:w-auto">
                <Monitor className="w-4 h-4" />
                Present
              </button>
              
              <button className="p-2.5 rounded-full border border-[#5f6368] hover:bg-[#3c4043] transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <div className="pt-8 border-t border-[#5f6368] w-full text-xs text-[#9aa0a6] flex flex-col gap-3">
              <p>Other joining options</p>
              <button className="text-[#8ab4f8] hover:underline text-left">Use Companion Mode</button>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-[#9aa0a6]">
            Joined as <strong>Entrepreneur</strong> • {roomId}
          </div>
        </div>
      </div>


    </div>
  );
};

export default PreJoinScreen;