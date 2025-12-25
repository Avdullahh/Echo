import React from 'react';
import { Homescreen } from './components/Homescreen';
import { MOCK_TRACKERS } from './services/mockData';

// This App component now serves as the standalone viewer for the Extension Homescreen
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 p-4">
        {/* 
           This container simulates the actual size of the Chrome Extension window (Homescreen)
           that appears when clicking the extension icon.
        */}
        <div className="relative">
            <div className="absolute -top-8 left-0 text-zinc-500 text-xs font-mono uppercase tracking-widest">
                Extension Homescreen (350x450)
            </div>
            
            <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
                <Homescreen 
                    trackers={MOCK_TRACKERS} 
                    onOpenDashboard={() => alert("This would open the full-screen Dashboard tab.")} 
                />
            </div>
        </div>
    </div>
  );
}