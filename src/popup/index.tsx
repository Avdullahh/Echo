import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { ExtensionPopup } from './components/ExtensionPopup'; 
import { TrackerEvent } from '../shared/types';

const PopupApp = () => {
  // CHANGE 1: Start with null to represent "Loading"
  const [isProtectionOn, setProtectionOn] = useState<boolean | null>(null);
  const [realTrackers, setRealTrackers] = useState<TrackerEvent[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['detectedTrackers', 'trackersBlocked', 'isProtectionOn'], (result) => {
        setRealTrackers(result.detectedTrackers || []);
        setBlockedCount(result.trackersBlocked || 0);
        // CHANGE 2: If undefined, default to true, otherwise use saved value
        setProtectionOn(result.isProtectionOn !== undefined ? result.isProtectionOn : true);
      });
    } else {
        setProtectionOn(true); // Fallback for dev mode
    }
  }, []);

  // CHANGE 3: Wrapper to save state immediately when toggled
  const handleToggle = (val: boolean) => {
      setProtectionOn(val);
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ isProtectionOn: val });
      }
  };

  // CHANGE 4: Prevent rendering until state is known
  if (isProtectionOn === null) return null; 

  return (
    <div className="w-[286px] h-[462px] bg-bg-canvas text-text-primary overflow-hidden border border-border-subtle shadow-2xl">
      <ExtensionPopup 
        trackers={realTrackers}
        blockedCount={blockedCount}
        isProtectionOn={isProtectionOn}
        setProtectionOn={handleToggle}
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