
import React, { useState, useEffect } from 'react';
import { Homescreen } from './components/Homescreen';
import { Dashboard, DashboardTab, PrivacyLevel } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { Intervention } from './components/Intervention';
import { EntityDetail, PersonaDetail } from './components/Details';
import { TutorialOverlay } from './components/TutorialOverlay';
import { BlockedScreen } from './components/BlockedScreen';
import { MOCK_USER_PROFILE, MOCK_REPORTS_DATA } from './services/mockData';
import { RiskLevel } from './types';

// Domain pool for simulation
const MOCK_DOMAINS = [
  'analytics.google.com', 'facebook.net', 'criteo.com', 'doubleclick.net', 'tiktok.com', 'hotjar.com', 'bing.com', 'adservice.google.com'
];
const MOCK_CATEGORIES = ['Marketing', 'Analytics', 'Social'];

export default function App() {
  // --- GLOBAL NAVIGATION STATE ---
  const [view, setView] = useState<'popup' | 'dashboard'>('popup');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // --- MODAL STATE ---
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [showPersonaDetail, setShowPersonaDetail] = useState(false);
  
  // --- NEW: EDUCATION & SIMULATION STATE ---
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [showBlockedScreen, setShowBlockedScreen] = useState(false);

  // --- GLOBAL APP STATE ---
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('balanced');
  const [reportsData, setReportsData] = useState(MOCK_REPORTS_DATA);
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);

  // --- ACTIONS ---
  const handleOpenDashboard = (tab: DashboardTab) => {
    setDashboardTab(tab);
    setView('dashboard');
  };

  const handleClearData = () => {
    setReportsData([]);
    setProfile({ ...profile, confidenceScore: 0, persona: "Unknown Entity" });
  };

  // --- MOCK ENGINE: LIVE SIMULATION ---
  useEffect(() => {
    if (!isProtectionOn) return; // Stop simulation if protection is off

    const interval = setInterval(() => {
        // 1. Create new event
        const randomDomain = MOCK_DOMAINS[Math.floor(Math.random() * MOCK_DOMAINS.length)];
        const randomCategory = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)];
        const isBlocked = Math.random() > 0.3; // 70% chance to block
        
        const newEvent = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            domain: randomDomain,
            source: 'browsing-session',
            category: randomCategory,
            action: isBlocked ? 'Blocked' : 'Allowed',
            riskLevel: isBlocked ? RiskLevel.WARNING : RiskLevel.SAFE
        };

        // 2. Add to state
        setReportsData(prev => [newEvent, ...prev]);

    }, 8000); // Every 8 seconds

    return () => clearInterval(interval);
  }, [isProtectionOn]);

  // Calculate live stats for passing down
  const totalBlocked = reportsData.filter(r => r.action === 'Blocked').length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 p-4 font-sans">
        
        {/* APP CONTAINER */}
        {/* Dynamic Width: Fits 'Popup' (350px) or 'Dashboard' (Full) */}
        <div 
          className={`relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black transition-all duration-500 ease-in-out
            ${view === 'popup' ? 'w-[350px] h-[550px]' : 'w-full max-w-[1400px] min-h-[800px]'}`}
        >
            
            {/* --- LAYERS (Z-INDEX ORDER) --- */}

            {/* LAYER 5: STRICT BLOCK SCREEN (Highest Priority Simulation) */}
            {showBlockedScreen && (
                <BlockedScreen 
                    onGoBack={() => setShowBlockedScreen(false)}
                    onProceed={() => setShowBlockedScreen(false)}
                />
            )}

            {/* LAYER 4: TUTORIAL OVERLAY */}
            {activeTutorial && (
                <TutorialOverlay 
                    tutorialId={activeTutorial}
                    onClose={() => setActiveTutorial(null)}
                />
            )}

            {/* LAYER 3: INTERVENTION OVERLAY SIMULATION */}
            {showIntervention && (
                <Intervention 
                    domain="homechef.com" 
                    onClose={() => setShowIntervention(false)} 
                />
            )}

            {/* LAYER 2: DETAIL MODALS */}
            {selectedEntity && (
                <EntityDetail 
                    event={selectedEntity} 
                    onClose={() => setSelectedEntity(null)} 
                />
            )}
            {showPersonaDetail && (
                <PersonaDetail 
                    profile={profile} 
                    onClose={() => setShowPersonaDetail(false)} 
                />
            )}

            {/* LAYER 1: MAIN CONTENT */}
            {!hasOnboarded && view === 'dashboard' ? (
                // --- ONBOARDING FLOW ---
                <div className="w-full h-full">
                    <Onboarding onComplete={() => setHasOnboarded(true)} />
                </div>
            ) : view === 'popup' ? (
                // --- EXTENSION POPUP VIEW ---
                <Homescreen 
                    trackers={reportsData} // Pass live data
                    blockedCount={totalBlocked}
                    isProtectionOn={isProtectionOn}
                    setProtectionOn={setIsProtectionOn}
                    onOpenDashboard={handleOpenDashboard} 
                />
            ) : (
                // --- FULL DASHBOARD VIEW ---
                <Dashboard 
                    profile={profile}
                    reportsData={reportsData}
                    privacyLevel={privacyLevel}
                    setPrivacyLevel={setPrivacyLevel}
                    isProtectionOn={isProtectionOn}
                    onClearData={handleClearData}
                    onClose={() => setView('popup')}
                    activeTab={dashboardTab}
                    onTabChange={setDashboardTab}
                    onOpenEntity={setSelectedEntity}
                    onOpenPersona={() => setShowPersonaDetail(true)}
                    onTriggerIntervention={() => setShowIntervention(true)}
                    onStartTutorial={setActiveTutorial}
                    onTriggerStrictBlock={() => setShowBlockedScreen(true)}
                />
            )}

        </div>
    </div>
  );
}
