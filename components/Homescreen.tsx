import React, { useState, useEffect, useRef } from 'react';
import { TrackerEvent } from '../types';

interface HomescreenProps {
  trackers: TrackerEvent[];
  onOpenDashboard: () => void;
}

export const Homescreen: React.FC<HomescreenProps> = ({ trackers, onOpenDashboard }) => {
  const [isProtectionOn, setProtectionOn] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  // Calculate stats for the "Live Analysis" preview text
  const blockedCount = isProtectionOn ? trackers.length : 0;

  return (
    <div className="w-[350px] h-[450px] flex flex-col font-sans text-slate-800 overflow-hidden relative bg-white">
      
      {/* 
         VIBRANT BACKGROUND: GRADIENT MESH
         Created using overlapping, highly blurred orbs of color to simulate a mesh.
         The colors (Indigo, Fuchsia, Blue, Violet) blend to form a dynamic, living surface.
         
         UPDATE: Added conditional grayscale and opacity transition for "Paused" state.
      */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden bg-white transition-all duration-1000 ease-in-out ${isProtectionOn ? 'opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}>
          {/* Top-Left: Deep Indigo Base */}
          <div className="absolute -top-[120px] -left-[100px] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[90px]" />
          
          {/* Top-Right: Vibrant Fuchsia Highlight */}
          <div className="absolute top-[20px] -right-[120px] w-[300px] h-[300px] rounded-full bg-fuchsia-500/10 blur-[80px]" />
          
          {/* Bottom-Left: Cool Blue Foundation */}
          <div className="absolute -bottom-[80px] -left-[60px] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[80px]" />
          
          {/* Bottom-Right: Rich Violet Anchor */}
          <div className="absolute -bottom-[100px] -right-[80px] w-[300px] h-[300px] rounded-full bg-violet-500/15 blur-[90px]" />
      </div>
      
      {/* Decorative Blob behind the main button for depth (Reacts to State) */}
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl transition-all duration-700 
          ${isProtectionOn 
            ? 'bg-indigo-300/30 scale-100 opacity-100' 
            : 'bg-slate-300/30 scale-90 opacity-50'
          }`}>
      </div>

      {/* HEADER */}
      <div className="relative z-30 px-5 py-3 flex justify-between items-center bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Custom App Icon: "The Resonance Core" */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-500 ${isProtectionOn ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/30' : 'bg-slate-500 shadow-slate-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6">
                {/* The Core (User Identity) */}
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                {/* Upper Shield Arc */}
                <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-90"/>
                {/* Lower Shield Arc (Offset for spiraling effect) */}
                <path d="M12 22c5.52 0 10-4.48 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-90"/>
                {/* Echo Pulse Accents */}
                <circle cx="20" cy="5" r="1.5" fill="currentColor" className="opacity-75" />
                <circle cx="4" cy="19" r="1.5" fill="currentColor" className="opacity-75" />
            </svg>
          </div>
          <span className={`font-extrabold text-2xl tracking-tight transition-colors duration-500 ${isProtectionOn ? 'text-slate-800' : 'text-slate-600'}`}>Echo</span>
        </div>
        
        {/* Settings / Menu Icon with Dropdown */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`text-slate-500 hover:text-indigo-600 transition-colors bg-white/40 p-2 rounded-full hover:bg-white shadow-sm hover:shadow ${isMenuOpen ? 'bg-white text-indigo-600 ring-2 ring-indigo-100' : ''}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white/95 backdrop-blur-xl border border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        <button 
                            onClick={() => {
                                onOpenDashboard();
                                setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            Dashboard
                        </button>
                        <button 
                            onClick={() => {
                                setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* HERO SECTION: MASTER TOGGLE */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 pb-2">
        
        {/* The Toggle Button */}
        <button 
            onClick={() => setProtectionOn(!isProtectionOn)}
            className="group relative focus:outline-none"
        >
            {/* 
                ACTIVE STATE EFFECTS
            */}
            {isProtectionOn && (
                <>
                     {/* Ambient Glow */}
                    <div className="absolute -inset-6 bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 rounded-full blur-2xl animate-pulse"></div>
                    {/* Sharp Ping Ring */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                </>
            )}

            {/* 
                PAUSED STATE EFFECTS 
                Subtle warning ring that fades in/out
            */}
            {!isProtectionOn && (
                <div className="absolute -inset-2 rounded-full border border-amber-500/20 animate-pulse"></div>
            )}
            
            {/* Button Surface */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-4 relative z-10
                ${isProtectionOn 
                    ? 'bg-gradient-to-br from-indigo-500 via-violet-600 to-indigo-700 border-indigo-400/50 shadow-[0_0_50px_-10px_rgba(139,92,246,0.5)] ring-4 ring-indigo-500/10' 
                    : 'bg-slate-50 border-slate-300 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] ring-4 ring-slate-100'
                }`}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className={`w-12 h-12 transition-all duration-300 ${isProtectionOn ? 'text-white drop-shadow-md scale-100' : 'text-slate-400 scale-95'}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                </svg>
            </div>
        </button>

        <div className="text-center space-y-1">
            <h2 className={`text-xl font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${isProtectionOn ? 'text-indigo-900' : 'text-slate-500'}`}>
                {!isProtectionOn && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                {isProtectionOn ? 'Protection Active' : 'Echo Paused'}
            </h2>
            <p className="text-sm text-slate-500 font-medium px-8 leading-snug">
                {isProtectionOn 
                    ? 'We are masking your digital footprint.' 
                    : 'Tracking data is currently visible.'}
            </p>
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <div className="relative z-20 px-4 py-6 space-y-3">
        
        {/* Link 1: Live Analysis */}
        <button className={`w-full backdrop-blur-sm p-3 rounded-2xl border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-lg transition-all group ${isProtectionOn ? 'bg-white/80 border-white hover:border-indigo-200 hover:shadow-indigo-500/10 hover:bg-white' : 'bg-slate-50/80 border-slate-100 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 ${isProtectionOn ? 'bg-orange-50 text-orange-500 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                </div>
                <div className="text-left">
                    <div className={`font-semibold text-sm transition-colors ${isProtectionOn ? 'text-slate-800 group-hover:text-indigo-700' : 'text-slate-500'}`}>Live Analysis</div>
                    <div className="text-xs text-slate-500 font-medium">
                        {isProtectionOn ? <span className="text-green-600">{blockedCount} trackers blocked</span> : 'System paused'}
                    </div>
                </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-300 group-hover:text-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </button>

        {/* Link 2: Dashboard */}
        <button 
            onClick={onOpenDashboard}
            className={`w-full backdrop-blur-sm p-3 rounded-2xl border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-lg transition-all group ${isProtectionOn ? 'bg-white/80 border-white hover:border-indigo-200 hover:shadow-indigo-500/10 hover:bg-white' : 'bg-slate-50/80 border-slate-100 hover:bg-slate-50'}`}
        >
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 ${isProtectionOn ? 'bg-indigo-50 text-indigo-600 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="18" cy="6" r="1.5" />
                        <circle cx="6" cy="18" r="1.5" />
                        <circle cx="18" cy="18" r="1.5" />
                        <circle cx="6" cy="6" r="1.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 14.5L17 17" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5L7 7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5L17 7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5L7 17" />
                    </svg>
                </div>
                <div className="text-left">
                    <div className={`font-semibold text-sm transition-colors ${isProtectionOn ? 'text-slate-800 group-hover:text-indigo-700' : 'text-slate-500'}`}>Digital Identity</div>
                    <div className="text-xs text-slate-500 font-medium">View your persona</div>
                </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-300 group-hover:text-indigo-500 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </button>
      </div>
    </div>
  );
};
