import React, { useState } from 'react';
import { Homescreen } from './components/Homescreen';
import { Dashboard } from './components/Dashboard';
import { MOCK_TRACKERS, MOCK_USER_PROFILE } from './services/mockData';

// This App component now serves as the standalone viewer for the Extension Homescreen
export default function App() {
  const [view, setView] = useState<'popup' | 'dashboard'>('popup');

  // If in dashboard view, render the full-screen dashboard component
  if (view === 'dashboard') {
    return (
      <Dashboard 
        profile={MOCK_USER_PROFILE} 
        onClose={() => setView('popup')} 
      />
    );
  }

  // Otherwise, render the simulated Extension Popup
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 p-4">
        {/* 
           This container simulates the actual size of the Chrome Extension window (Homescreen)
           that appears when clicking the extension icon.
        */}
        <div className="relative">
            <div className="absolute -top-8 left-0 text-zinc-500 text-xs font-mono uppercase tracking-widest flex justify-between w-full">
                <span>Extension Homescreen (350x450)</span>
                <span className="text-zinc-600">Interactive Preview</span>
            </div>
            
            <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
                <Homescreen 
                    trackers={MOCK_TRACKERS} 
                    onOpenDashboard={() => setView('dashboard')} 
                />
            </div>
        </div>
    </div>
  );
}