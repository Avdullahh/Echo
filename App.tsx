import React, { useState, useEffect } from 'react';
import { Homescreen } from './components/Homescreen';
import { Dashboard, DashboardTab, PrivacyLevel } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { Intervention } from './components/Intervention';
import { EntityDetail, PersonaDetail } from './components/Details';
import { TutorialOverlay } from './components/TutorialOverlay';
import { BlockedScreen } from './components/BlockedScreen';
import { MOCK_USER_PROFILE, MOCK_REPORTS_DATA } from './services/mockData';
import { buildProfileFromEvents } from './shared/services/profileUtils';
import { RiskLevel } from './types';

// ---------------------------------------------------------------------------
// Dev-mode simulation pool (used ONLY when chrome.storage is not available)
// ---------------------------------------------------------------------------
const MOCK_DOMAINS = [
  'analytics.google.com', 'facebook.net', 'criteo.com', 'doubleclick.net',
  'tiktok.com', 'hotjar.com', 'bing.com', 'adservice.google.com'
];

// Extended category pool so dev simulation produces varied profiles
const MOCK_CATEGORIES = [
  'Marketing', 'Analytics', 'Social', 'Video', 'Shopping', 'News', 'Tech'
];

const IS_EXTENSION = typeof chrome !== 'undefined' && !!chrome?.storage?.local;

// ---------------------------------------------------------------------------

export default function App() {
  // --- GLOBAL NAVIGATION STATE ---
  const [view, setView] = useState<'popup' | 'dashboard'>('popup');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // --- MODAL STATE ---
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [showPersonaDetail, setShowPersonaDetail] = useState(false);

  // --- EDUCATION & SIMULATION STATE ---
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [showBlockedScreen, setShowBlockedScreen] = useState(false);

  // --- GLOBAL APP STATE ---
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('balanced');
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);

  // ---------------------------------------------------------------------------
  // REAL DATA: Load from chrome.storage on mount + subscribe to live changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!IS_EXTENSION) return;

    // Initial load
    chrome.storage.local.get(
      ['detectedTrackers', 'trackersBlocked', 'isProtectionOn'],
      (result) => {
        const stored: any[] = result.detectedTrackers || [];
        setReportsData(stored);
        const derived = buildProfileFromEvents(stored);
        if (derived) setProfile({ ...MOCK_USER_PROFILE, ...derived });
        if (result.isProtectionOn !== undefined) {
          setIsProtectionOn(result.isProtectionOn);
        }
      }
    );

    // Live updates — background script writes new events to storage
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local') return;

      if (changes.detectedTrackers) {
        const updated: any[] = changes.detectedTrackers.newValue || [];
        setReportsData(updated);
        const derived = buildProfileFromEvents(updated);
        if (derived) setProfile({ ...MOCK_USER_PROFILE, ...derived });
      }

      if (changes.isProtectionOn) {
        setIsProtectionOn(changes.isProtectionOn.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ---------------------------------------------------------------------------
  // DEV-MODE FALLBACK: Seed with mock data + run simulation interval
  // Only runs when chrome.storage is NOT available (Vite dev server)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (IS_EXTENSION) return;
    setReportsData(MOCK_REPORTS_DATA);
    setProfile(MOCK_USER_PROFILE);
  }, []);

  useEffect(() => {
    if (IS_EXTENSION) return;
    if (!isProtectionOn) return;

    const interval = setInterval(() => {
      const randomDomain = MOCK_DOMAINS[Math.floor(Math.random() * MOCK_DOMAINS.length)];
      const randomCategory = MOCK_CATEGORIES[Math.floor(Math.random() * MOCK_CATEGORIES.length)];
      const isBlocked = Math.random() > 0.3;

      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        domain: randomDomain,
        source: 'browsing-session',
        category: randomCategory,
        action: isBlocked ? 'Blocked' : 'Allowed',
        riskLevel: isBlocked ? RiskLevel.WARNING : RiskLevel.SAFE
      };

      setReportsData(prev => [newEvent, ...prev]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isProtectionOn]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const handleOpenDashboard = (tab: DashboardTab) => {
    setDashboardTab(tab);
    setView('dashboard');
  };

  const handleClearData = () => {
    setReportsData([]);
    setProfile({ ...MOCK_USER_PROFILE, confidenceScore: 0, persona: 'Unknown Entity' });

    if (IS_EXTENSION) {
      chrome.storage.local.set({ detectedTrackers: [], trackersBlocked: 0 });
      chrome.action?.setBadgeText?.({ text: '' });
    }
  };

  const totalBlocked = reportsData.filter(r => r.action === 'Blocked').length;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 p-4 font-sans">

      <div
        className={`relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black transition-all duration-500 ease-in-out
          ${view === 'popup' ? 'w-[350px] h-[550px]' : 'w-full max-w-[1400px] min-h-[800px]'}`}
      >

        {/* LAYER 5: STRICT BLOCK SCREEN */}
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

        {/* LAYER 3: INTERVENTION OVERLAY
            Note: domain is hardcoded for simulation purposes only.
            This is a demo trigger — in production this would receive
            the actual active tab's hostname from chrome.tabs. */}
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
          <div className="w-full h-full">
            <Onboarding onComplete={() => setHasOnboarded(true)} />
          </div>
        ) : view === 'popup' ? (
          <Homescreen
            trackers={reportsData}
            blockedCount={totalBlocked}
            isProtectionOn={isProtectionOn}
            setProtectionOn={setIsProtectionOn}
            onOpenDashboard={handleOpenDashboard}
            profile={profile}
          />
        ) : (
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