import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { Homescreen } from '../shared/components/Homescreen';
import { MOCK_REPORTS_DATA } from '../shared/services/mockData';

const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState(true);

  return (
    // Updated container to match new Design System tokens
    <div className="w-[350px] h-[600px] bg-bg-canvas text-text-primary">
      <Homescreen 
        trackers={MOCK_REPORTS_DATA}
        blockedCount={14}
        isProtectionOn={isProtectionOn}
        setProtectionOn={setProtectionOn}
        onOpenDashboard={(tab) => {
            // Updated to handle tab strings safely
            const section = typeof tab === 'string' ? tab : 'home';
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(`/dashboard.html#${section}`, '_blank');
            }
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><PopupApp /></React.StrictMode>);