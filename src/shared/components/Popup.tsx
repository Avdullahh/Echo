// src/shared/components/Popup.tsx
import React from 'react';
import { Shield, Activity, Settings, Power } from 'lucide-react';

interface PopupProps {
  trackers: any[];
  blockedCount: number;
  isProtectionOn: boolean;
  setProtectionOn: (val: boolean) => void;
  onOpenDashboard: () => void;
}

export const Popup: React.FC<PopupProps> = ({ 
  trackers, 
  blockedCount, 
  isProtectionOn, 
  setProtectionOn, 
  onOpenDashboard 
}) => {
  return (
    <div className="flex flex-col h-[600px] w-[350px] bg-black border border-zinc-800 font-mono">
      {/* 1. Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isProtectionOn ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          <span className="text-xs font-bold tracking-widest text-zinc-400">ECHO_SYSTEM</span>
        </div>
        <div className="px-2 py-1 text-[10px] bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
          V.1.0.0
        </div>
      </div>

      {/* 2. Main Status (The Traffic Light Vibe) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className={`absolute inset-0 opacity-10 ${isProtectionOn ? 'bg-emerald-900' : 'bg-red-900'} blur-3xl`} />
        
        <div className="relative z-10 text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            {blockedCount}
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">Threats Neutralized</p>
        </div>

        {/* The Toggle (Big Interaction) */}
        <button 
          onClick={() => setProtectionOn(!isProtectionOn)}
          className={`group relative flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 ${
            isProtectionOn 
              ? 'border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'border-red-500/30 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
          }`}
        >
            <Power className={`w-8 h-8 transition-colors ${isProtectionOn ? 'text-emerald-500' : 'text-red-500'}`} />
        </button>
      </div>

      {/* 3. Footer Actions (The Dashboard Link) */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-3">
        {/* Status Line */}
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Active Session</span>
          <span className={isProtectionOn ? 'text-emerald-500' : 'text-zinc-600'}>
            {isProtectionOn ? 'SECURE' : 'VULNERABLE'}
          </span>
        </div>

        {/* Dashboard Button */}
        <button 
          onClick={onOpenDashboard}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
        >
          <Activity size={14} />
          Open Full Dashboard
        </button>
      </div>
    </div>
  );
};