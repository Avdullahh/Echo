import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css'; 
import { Homescreen } from '../shared/components/Homescreen';
import { MOCK_REPORTS_DATA } from '../shared/services/mockData';

const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState(true);

  return (
    <div className="w-[350px] h-[600px] bg-black">
      <Homescreen 
        trackers={MOCK_REPORTS_DATA}
        blockedCount={14}
        isProtectionOn={isProtectionOn}
        setProtectionOn={setProtectionOn}
        onOpenDashboard={() => {
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