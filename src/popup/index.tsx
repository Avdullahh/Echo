import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { ExtensionPopup } from './components/ExtensionPopup'; 
import { TrackerEvent } from '../shared/types';

const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState(true);
  const [realTrackers, setRealTrackers] = useState<TrackerEvent[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  // FETCH REAL DATA ON MOUNT
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['detectedTrackers', 'trackersBlocked'], (result) => {
        setRealTrackers(result.detectedTrackers || []);
        setBlockedCount(result.trackersBlocked || 0);
      });
    }
  }, []);

  return (
    // Style: 286px x 462px (10% larger), Sharp Edges, Filled Background
    <div className="w-[286px] h-[462px] bg-bg-canvas text-text-primary overflow-hidden border border-border-subtle shadow-2xl">
      <ExtensionPopup 
        trackers={realTrackers} // <--- PASSING REAL DATA
        blockedCount={blockedCount} // <--- PASSING REAL COUNT
        isProtectionOn={isProtectionOn}
        setProtectionOn={setProtectionOn}
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