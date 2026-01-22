import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { Dashboard } from '../shared/components/Dashboard';

// Initial Empty State
const INITIAL_PROFILE = {
  persona: 'Analyzing...',
  tags: [],
  trackersBlockedToday: 0,
  confidenceScore: 0
};

const DashboardApp = () => {
  // 1. STATE: Allow the tab to change
  const [activeTab, setActiveTab] = useState<any>('home');
  const [privacyLevel, setPrivacyLevel] = useState<any>('balanced');
  
  // 2. DATA: Store the real profile and reports
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [reports, setReports] = useState<any[]>([]);

  // 3. LOAD: Fetch from Background Script (The Brain)
  useEffect(() => {
    if (chrome && chrome.storage && chrome.storage.local) {
       chrome.storage.local.get(['trackersBlocked', 'detectedTrackers'], (data) => {
          setReports(data.detectedTrackers || []);
          setProfile(prev => ({
             ...prev,
             trackersBlockedToday: data.trackersBlocked || 0
          }));
       });
    }
  }, []);

  return (
    <div className="bg-black min-h-screen text-zinc-200">
       <Dashboard 
          profile={profile}
          reportsData={reports}
          privacyLevel={privacyLevel}
          setPrivacyLevel={setPrivacyLevel}
          isProtectionOn={true}
          
          // Fix: Pass the state and the setter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          
          // Handlers
          onClearData={() => console.log('Clear Data')}
          onClose={() => window.close()}
          showToast={(msg) => console.log(msg)}
          onOpenEntity={() => {}}
          onOpenPersona={() => {}}
          onTriggerIntervention={() => {}}
          onStartTutorial={() => console.log("Start Tutorial")} 
          onTriggerStrictBlock={() => console.log("Strict Block")}
       />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><DashboardApp /></React.StrictMode>);