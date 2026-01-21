
import React from 'react';
import { X, ShieldAlert, EyeOff, Activity } from 'lucide-react';

interface InterventionProps {
  onClose: () => void;
  domain: string;
}

export const Intervention: React.FC<InterventionProps> = ({ onClose, domain }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-end p-6 pointer-events-none">
       {/* Simulation Container to mimick floating over a website */}
       <div className="w-[380px] bg-black/90 backdrop-blur-xl border border-zinc-700 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-top-10 fade-in duration-500">
          
          {/* Header */}
          <div className="bg-[#4DFFBC] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-black font-bold">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Echo Intervention</span>
              </div>
              <button onClick={onClose} className="text-black/60 hover:text-black transition-colors">
                  <X className="w-5 h-5" />
              </button>
          </div>

          {/* Content */}
          <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-2">Tracking Detected</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  <span className="text-white font-medium">{domain}</span> is attempting to run 3 invisible scripts that collect your device ID and location.
              </p>

              <div className="flex items-center gap-3 mb-6">
                 <div className="flex-1 bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex flex-col items-center">
                    <span className="text-xs text-zinc-500 mb-1">Risk</span>
                    <span className="text-[#FF4D4D] font-bold">High</span>
                 </div>
                 <div className="flex-1 bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex flex-col items-center">
                    <span className="text-xs text-zinc-500 mb-1">Entity</span>
                    <span className="text-white font-bold">AdTech</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                      Allow Once
                  </button>
                  <button onClick={onClose} className="bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      Block Request
                  </button>
              </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-3 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Protected by Echo
              </span>
              <button onClick={onClose} className="text-xs text-[#4DFFBC] font-medium hover:underline">
                  View Full Report
              </button>
          </div>
       </div>
    </div>
  );
};
