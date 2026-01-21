
import React, { useState, useEffect } from 'react';
import { Homescreen } from './components/Homescreen';
import { Dashboard, DashboardTab, PrivacyLevel } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { Intervention } from './components/Intervention';
import { EntityDetail, PersonaDetail } from './components/Details';
import { MOCK_USER_PROFILE, MOCK_REPORTS_DATA } from './services/mockData';
import { RiskLevel } from './types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

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

  // --- GLOBAL APP STATE ---
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('balanced');
  const [reportsData, setReportsData] = useState(MOCK_REPORTS_DATA);
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);
  
  // --- NOTIFICATION SYSTEM ---
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'alert' | 'success'} | null>(null);

  const showToast = (msg: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- ACTIONS ---
  const handleOpenDashboard = (tab: DashboardTab) => {
    setDashboardTab(tab);
    setView('dashboard');
  };

  const handleClearData = () => {
    setReportsData([]);
    setProfile({ ...profile, confidenceScore: 0, persona: "Unknown Entity" });
    showToast("All tracking history has been wiped.", 'alert');
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

        // 3. Trigger Toast occasionally
        if (isBlocked && Math.random() > 0.7) {
            showToast(`Echo blocked ${randomDomain}`, 'info');
        }

    }, 8000); // Every 8 seconds

    return () => clearInterval(interval);
  }, [isProtectionOn]);

  // Calculate live stats for passing down
  const totalBlocked = reportsData.filter(r => r.action === 'Blocked').length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 p-4 font-sans">
        
        {/* GLOBAL TOAST OVERLAY */}
        {toast && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border
                    ${toast.type === 'alert' ? 'bg-red-950/90 border-[#FF4D4D] text-[#FF4D4D]' : 
                      toast.type === 'success' ? 'bg-zinc-900/90 border-[#4DFFBC] text-[#4DFFBC]' :
                      'bg-zinc-900 border-zinc-700 text-white'}`}>
                    {toast.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span className="font-medium text-sm">{toast.msg}</span>
                </div>
            </div>
        )}

        {/* APP CONTAINER */}
        <div className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black w-full max-w-[1400px]">
            
            {/* INTERVENTION OVERLAY SIMULATION */}
            {showIntervention && (
                <Intervention 
                    domain="homechef.com" 
                    onClose={() => setShowIntervention(false)} 
                />
            )}

            {/* MODALS */}
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

            {!hasOnboarded && view === 'dashboard' ? (
                // --- ONBOARDING FLOW ---
                <div className="w-full h-[800px]">
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
                    setPrivacyLevel={(level) => {
                        setPrivacyLevel(level);
                        showToast(`Privacy mode set to ${level}`, 'success');
                    }}
                    isProtectionOn={isProtectionOn}
                    onClearData={handleClearData}
                    onClose={() => setView('popup')}
                    activeTab={dashboardTab}
                    onTabChange={setDashboardTab}
                    showToast={showToast}
                    onOpenEntity={setSelectedEntity}
                    onOpenPersona={() => setShowPersonaDetail(true)}
                    onTriggerIntervention={() => setShowIntervention(true)}
                />
            )}

        </div>
    </div>
  );
}
