import React, { useState } from 'react';
import { TrackerEvent } from '../types';

interface HomescreenProps {
  trackers: TrackerEvent[];
  onOpenDashboard: () => void;
}

export const Homescreen: React.FC<HomescreenProps> = ({ trackers, onOpenDashboard }) => {
  const [isProtectionOn, setProtectionOn] = useState(true);

  // Calculate stats for the "Live Analysis" preview text
  const blockedCount = isProtectionOn ? trackers.length : 0;

  return (
    <div className="w-[350px] h-[450px] flex flex-col font-sans text-slate-800 overflow-hidden relative bg-white">
      
      {/* 
         VIBRANT BACKGROUND: GRADIENT MESH
         Created using overlapping, highly blurred orbs of color to simulate a mesh.
         The colors (Indigo, Fuchsia, Blue, Violet) blend to form a dynamic, living surface.
      */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-white">
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
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300/30 rounded-full blur-3xl transition-all duration-700 ${isProtectionOn ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}></div>

      {/* HEADER */}
      {/* 
          Updated Styling:
          - Removed background color (bg-transparent) for better visibility of the pulse.
          - Adjusted blur (backdrop-blur-sm) for a subtle glass effect.
      */}
      <div className="relative z-10 px-5 py-3 flex justify-between items-center bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Custom App Icon: "The Resonance Core" */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 ${isProtectionOn ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/30' : 'bg-slate-400 shadow-slate-400/30'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6">
                {/* 
                    ICON: "The Resonance Core"
                    A central node protected by spiraling active shields. 
                    Represents: Privacy, Active Scanning, Echo/Sonar.
                */}
                
                {/* The Core (User Identity) */}
                <circle cx="12" cy="12" r="3" fill="currentColor" />

                {/* Upper Shield Arc */}
                <path 
                    d="M12 2C6.48 2 2 6.48 2 12" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    className="opacity-90"
                />

                {/* Lower Shield Arc (Offset for spiraling effect) */}
                <path 
                    d="M12 22c5.52 0 10-4.48 10-10" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    className="opacity-90"
                />
                
                {/* Echo Pulse Accents */}
                <circle cx="20" cy="5" r="1.5" fill="currentColor" className="opacity-75" />
                <circle cx="4" cy="19" r="1.5" fill="currentColor" className="opacity-75" />
            </svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-800">Echo</span>
        </div>
        
        {/* Settings / Menu Icon */}
        <button className="text-slate-500 hover:text-indigo-600 transition-colors bg-white/40 p-2 rounded-full hover:bg-white shadow-sm hover:shadow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>
      </div>

      {/* HERO SECTION: MASTER TOGGLE */}
      {/* Centering adjustments: justify-center, gap-5 to space out button and text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 pb-2">
        
        {/* The Toggle Button */}
        <button 
            onClick={() => setProtectionOn(!isProtectionOn)}
            className="group relative focus:outline-none"
        >
            {/* 
                ACTIVE STATE EFFECTS:
                - Subtle multi-colored ambient glow (Indigo/Fuchsia)
                - Ping animation
            */}
            {isProtectionOn && (
                <>
                     {/* Ambient Glow matching background */}
                    <div className="absolute -inset-6 bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/30 rounded-full blur-2xl animate-pulse"></div>
                    
                    {/* Sharp Ping Ring */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                </>
            )}
            
            {/* Button Surface - Adjusted size to w-32 h-32 for better proportion */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-4 relative z-10
                ${isProtectionOn 
                    ? 'bg-gradient-to-br from-indigo-500 via-violet-600 to-indigo-700 border-indigo-400/50 shadow-[0_0_50px_-10px_rgba(139,92,246,0.5)] ring-4 ring-indigo-500/10' 
                    : 'bg-slate-100 border-slate-200 shadow-inner'
                }`}
            >
                {/* 
                   Power Icon 
                   Update: Darkened the OFF state color to text-slate-400 for better visibility.
                */}
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
            <h2 className={`text-xl font-bold transition-colors duration-300 ${isProtectionOn ? 'text-indigo-900' : 'text-slate-500'}`}>
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
        <button className="w-full bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:bg-white transition-all group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {/* Activity Pulse Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                </div>
                <div className="text-left">
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">Live Analysis</div>
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
            className="w-full bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:bg-white transition-all group"
        >
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {/* New Abstract Network Identity Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        {/* Central Node */}
                        <circle cx="12" cy="12" r="3" />
                        
                        {/* Surrounding Data Points */}
                        <circle cx="18" cy="6" r="1.5" />
                        <circle cx="6" cy="18" r="1.5" />
                        <circle cx="18" cy="18" r="1.5" />
                        <circle cx="6" cy="6" r="1.5" />
                        
                        {/* Connections */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 14.5L17 17" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5L7 7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5L17 7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5L7 17" />
                    </svg>
                </div>
                <div className="text-left">
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">Digital Identity</div>
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
