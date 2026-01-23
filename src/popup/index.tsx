import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { ExtensionPopup } from './components/ExtensionPopup'; 
import { TrackerEvent } from '../shared/types';

const PopupApp = () => {
  // FIX: Start as 'null' to prevent flashing "On" if it's actually "Off"
  const [isProtectionOn, setProtectionOnState] = useState<boolean | null>(null);
  const [realTrackers, setRealTrackers] = useState<TrackerEvent[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  // 1. LOAD STATE FROM STORAGE ON STARTUP
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['detectedTrackers', 'trackersBlocked', 'isProtectionOn'], (result) => {
        setRealTrackers(result.detectedTrackers || []);
        setBlockedCount(result.trackersBlocked || 0);
        // FIX: If undefined, default to true, otherwise use saved value
        setProtectionOnState(result.isProtectionOn !== undefined ? result.isProtectionOn : true);
      });
    } else {
        // Fallback for non-extension environments
        setProtectionOnState(true);
    }
  }, []);

  // 2. WRAPPER TO SAVE STATE WHEN CHANGED
  const handleToggleProtection = (newValue: boolean) => {
      setProtectionOnState(newValue);
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ isProtectionOn: newValue });
      }
  };

  // FIX: Show nothing until we know the real state to prevent flash
  if (isProtectionOn === null) {
      return <div className="w-[286px] h-[462px] bg-bg-canvas border border-border-subtle shadow-2xl"></div>;
  }

  return (
    <div className="w-[286px] h-[462px] bg-bg-canvas text-text-primary overflow-hidden border border-border-subtle shadow-2xl">
      <ExtensionPopup 
        trackers={realTrackers}
        blockedCount={blockedCount}
        isProtectionOn={isProtectionOn}
        setProtectionOn={handleToggleProtection}
        onOpenDashboard={(tab) => {
            const targetUrl = `dashboard.html#${tab}`;
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: targetUrl });
            } else {
                window.open(targetUrl, '_blank');
            }
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><PopupApp /></React.StrictMode>);