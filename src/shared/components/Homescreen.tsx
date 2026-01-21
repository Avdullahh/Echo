import React, { useState, useRef, useEffect } from 'react';
import { TrackerEvent } from '../types';
import { Power, Menu, ChevronRight, LayoutDashboard, Settings, Activity, Shield, Home } from 'lucide-react';
import { DashboardTab } from './Dashboard';

interface HomescreenProps {
  trackers: TrackerEvent[];
  blockedCount: number;
  isProtectionOn: boolean;
  setProtectionOn: (val: boolean) => void;
  onOpenDashboard: (tab: DashboardTab) => void;
}

export const Homescreen: React.FC<HomescreenProps> = ({ 
    trackers, 
    blockedCount, 
    isProtectionOn, 
    setProtectionOn, 
    onOpenDashboard 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="w-[350px] h-[550px] flex flex-col font-sans text-white overflow-hidden relative bg-black selection:bg-[#4DFFBC] selection:text-black">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-[#4DFFBC]/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* HEADER */}
      <div className="relative z-30 px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-[#4DFFBC]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Echo</span>
        </div>
        
        {/* HAMBURGER MENU */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isMenuOpen ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
                <Menu className="w-5 h-5" />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-zinc-900 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2 border border-zinc-800">
                     <button 
                        onClick={() => { onOpenDashboard('home'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-black hover:bg-[#4DFFBC] rounded-xl transition-colors flex items-center gap-3"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </button>
                    <button 
                        onClick={() => { onOpenDashboard('overview'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-black hover:bg-[#4DFFBC] rounded-xl transition-colors flex items-center gap-3"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </button>
                    <button 
                        onClick={() => { onOpenDashboard('settings'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-black hover:bg-[#4DFFBC] rounded-xl transition-colors flex items-center gap-3"
                    >
                       <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* POWER BUTTON */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-6">
        <button 
            onClick={() => setProtectionOn(!isProtectionOn)}
            className="group relative focus:outline-none z-10"
        >
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 
               ${isProtectionOn ? 'bg-[#4DFFBC]/20' : 'bg-transparent'}`}></div>

            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 relative
                ${isProtectionOn 
                    ? 'bg-[#4DFFBC] shadow-[0_10px_40px_-10px_rgba(77,255,188,0.4)] scale-100' 
                    : 'bg-zinc-900 scale-95'
                }`}
            >
                <Power className={`w-16 h-16 transition-colors duration-300 stroke-[2.5px]
                    ${isProtectionOn ? 'text-black' : 'text-zinc-600'}`} 
                />
            </div>
        </button>
        
        <div className="text-center mt-8 space-y-1">
             <h2 className="text-2xl font-bold text-white tracking-tight">
                {isProtectionOn ? 'Echo is On' : 'Echo is Off'}
             </h2>
             <p className="text-zinc-500 font-medium">
                {isProtectionOn ? 'Protection active' : 'Tap to resume protection'}
             </p>
        </div>
      </div>

      {/* ACTION CARDS */}
      <div className="relative z-20 px-6 pb-8 space-y-3">
        
        {/* Card 1: Live Status -> Reports */}
        <button 
            onClick={() => onOpenDashboard('reports')}
            className="w-full bg-zinc-900 rounded-3xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-all group border border-transparent hover:border-zinc-700"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-[#FF4D4D]">
                    <Activity className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-medium text-zinc-400 mb-0.5">Live Status</div>
                    <div className="text-base font-bold text-white">
                        {isProtectionOn ? `${blockedCount} Trackers Blocked` : 'System Paused'}
                    </div>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                 <ChevronRight className="w-5 h-5" />
            </div>
        </button>

        {/* Card 2: Dashboard Home -> Home */}
        <button 
            onClick={() => onOpenDashboard('home')}
            className="w-full bg-zinc-900 rounded-3xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-all group border border-transparent hover:border-zinc-700"
        >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-[#4DFFBC]">
                    <Shield className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-medium text-zinc-400 mb-0.5">Dashboard</div>
                    <div className="text-base font-bold text-white">
                        Open App & Tutorials
                    </div>
                </div>
            </div>
             <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                 <ChevronRight className="w-5 h-5" />
            </div>
        </button>
      </div>
    </div>
  );
};