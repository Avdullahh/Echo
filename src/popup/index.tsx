import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { ExtensionPopup } from './components/ExtensionPopup'; 
import { MOCK_REPORTS_DATA } from '../shared/services/mockData';

const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState(true);

  return (
    // Style: 286px x 462px (10% larger), Sharp Edges, Filled Background
    <div className="w-[286px] h-[462px] bg-bg-canvas text-text-primary overflow-hidden border border-border-subtle shadow-2xl">
      <ExtensionPopup 
        trackers={MOCK_REPORTS_DATA}
        blockedCount={14}
        isProtectionOn={isProtectionOn}
        setProtectionOn={setProtectionOn}
        onOpenDashboard={(tab) => {
            // FIX: We explicitly build the URL with the hash (e.g., #reports)
            const targetUrl = `dashboard.html#${tab}`;

            // FIX: We use chrome.tabs.create because it respects the specific URL hash
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: targetUrl });
            } else {
                // Fallback for local testing
                window.open(targetUrl, '_blank');
            }
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><PopupApp /></React.StrictMode>);