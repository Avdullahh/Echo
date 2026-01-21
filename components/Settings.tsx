import React, { useState } from 'react';
import { Trash2, Shield, Bell, CheckCircle2, Sliders } from 'lucide-react';
import { PrivacyLevel } from './Dashboard';

interface SettingsProps {
    currentLevel: PrivacyLevel;
    setLevel: (level: PrivacyLevel) => void;
    onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentLevel, setLevel, onClearData }) => {
  const [toggles, setToggles] = useState({
      marketing: true,
      analytics: true,
      notifications: true
  });

  const toggleSwitch = (key: keyof typeof toggles) => {
      setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="pb-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
          <p className="text-zinc-500 text-base mt-1">Manage how Echo protects your data.</p>
        </div>

        {/* 1. Privacy Mode Selector */}
        <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-4">Protection Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['strict', 'balanced', 'custom'] as PrivacyLevel[]).map((level) => {
                    const isActive = currentLevel === level;
                    return (
                        <button
                            key={level}
                            onClick={() => setLevel(level)}
                            className={`relative p-6 rounded-2xl text-left transition-all duration-200
                                ${isActive 
                                ? 'bg-[#4DFFBC] ring-2 ring-[#4DFFBC] ring-offset-2 ring-offset-black' 
                                : 'bg-zinc-900 hover:bg-zinc-800'
                                }`}
                        >
                            <div className={`mb-4 ${isActive ? 'text-black' : 'text-zinc-500'}`}>
                                {level === 'strict' && <Shield className="w-8 h-8" />}
                                {level === 'balanced' && <CheckCircle2 className="w-8 h-8" />}
                                {level === 'custom' && <Sliders className="w-8 h-8" />}
                            </div>
                            
                            <div className={`font-bold text-lg mb-1 capitalize ${isActive ? 'text-black' : 'text-white'}`}>{level}</div>
                            <div className={`text-xs font-medium leading-relaxed ${isActive ? 'text-black/70' : 'text-zinc-500'}`}>
                                {level === 'strict' && 'Best for privacy. May break some websites.'}
                                {level === 'balanced' && 'Recommended. Blocks trackers, keeps sites working.'}
                                {level === 'custom' && 'You choose exactly what to block.'}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* 2. Toggle List */}
        <div className="bg-zinc-900 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
                <h3 className="font-bold text-white">Blocking Rules</h3>
            </div>
            <div className="divide-y divide-zinc-800">
                {/* Marketing Cookies */}
                <div className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                    <div>
                        <div className="font-bold text-white text-base">Block Marketing</div>
                        <div className="text-sm text-zinc-500 mt-0.5">Stops ads from following you around.</div>
                    </div>
                    <button 
                        onClick={() => toggleSwitch('marketing')}
                        className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none flex items-center px-1
                            ${toggles.marketing ? 'bg-[#4DFFBC]' : 'bg-zinc-700'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${toggles.marketing ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Analytics Trackers */}
                <div className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                    <div>
                        <div className="font-bold text-white text-base">Block Analytics</div>
                        <div className="text-sm text-zinc-500 mt-0.5">Prevents sites from recording your mouse clicks.</div>
                    </div>
                    <button 
                        onClick={() => toggleSwitch('analytics')}
                        className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none flex items-center px-1
                            ${toggles.analytics ? 'bg-[#4DFFBC]' : 'bg-zinc-700'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${toggles.analytics ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                 {/* Notifications */}
                 <div className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                    <div>
                        <div className="font-bold text-white text-base">Show Notifications</div>
                        <div className="text-sm text-zinc-500 mt-0.5">Get a friendly pop-up when we block something.</div>
                    </div>
                    <button 
                        onClick={() => toggleSwitch('notifications')}
                        className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none flex items-center px-1
                            ${toggles.notifications ? 'bg-[#4DFFBC]' : 'bg-zinc-700'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${toggles.notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>
        </div>

        {/* 3. Danger Zone */}
        <div className="bg-[#FF4D4D]/10 rounded-3xl p-6 flex items-center justify-between border border-[#FF4D4D]/20">
            <div>
                <h3 className="font-bold text-[#FF4D4D] mb-0.5">Reset Echo</h3>
                <p className="text-sm text-[#FF4D4D]/70">
                    This will clear all your history and preferences.
                </p>
            </div>
            <button 
                onClick={onClearData}
                className="flex items-center gap-2 px-6 py-3 bg-[#FF4D4D] text-black font-bold rounded-full hover:opacity-90 transition-all"
            >
                <Trash2 className="w-4 h-4" />
                Reset Data
            </button>
        </div>
    </div>
  );
};