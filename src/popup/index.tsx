import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
// We use Homescreen because that is your actual "Traffic Light" UI
import { Homescreen } from '../shared/components/Homescreen';

const PopupApp = () => {
  // 1. Initialize with ZERO data (No Mock Data)
  const [blockedCount, setBlockedCount] = useState(0);
  const [isProtectionOn, setProtectionOn] = useState(true);

  // 2. Load real stats from Chrome Storage (The Brain)
  useEffect(() => {
    // Check if we are actually in Chrome (not localhost)
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['trackersBlocked'], (data) => {
        setBlockedCount(data.trackersBlocked || 0);
      });
    }
  }, []);

  return (
    <div className="w-[350px] h-[550px] bg-black">
      <Homescreen 
        trackers={[]} // Empty array for now (No Mock Data)
        blockedCount={blockedCount}
        isProtectionOn={isProtectionOn}
        setProtectionOn={setProtectionOn}
        onOpenDashboard={() => {
            // This button opens your full dashboard.html
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open('/dashboard.html', '_blank');
            }
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><PopupApp /></React.StrictMode>);