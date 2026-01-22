
import React from 'react';
import { UserProfile, RiskLevel } from '../types';
import { Overview } from './Overview';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { LogOut, LayoutDashboard, FileText, Settings as SettingsIcon, Home, User, Eye, Shield, ArrowRight, ShieldAlert, Lock } from 'lucide-react';

export type DashboardTab = 'home' | 'overview' | 'reports' | 'settings';
export type PrivacyLevel = 'strict' | 'balanced' | 'custom';

interface DashboardProps {
  profile: UserProfile;
  reportsData: any[];
  privacyLevel: PrivacyLevel;
  setPrivacyLevel: (level: PrivacyLevel) => void;
  isProtectionOn: boolean;
  onClearData: () => void;
  onClose: () => void;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  showToast: (msg: string, type?: 'info' | 'alert' | 'success') => void;
  onOpenEntity: (entity: any) => void;
  onOpenPersona: () => void;
  onTriggerIntervention: () => void;
  onStartTutorial: (id: string) => void;
  onTriggerStrictBlock: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    profile, 
    reportsData, 
    privacyLevel, 
    setPrivacyLevel,
    isProtectionOn,
    onClearData, 
    onClose, 
    activeTab, 
    onTabChange,
    onOpenEntity,
    onOpenPersona,
    onTriggerIntervention,
    onStartTutorial,
    onTriggerStrictBlock
}) => {
  
  // Calculate Stats for Overview
  const totalBlocked = reportsData.filter(r => r.action === 'Blocked').length;
  // Use first 5 items for recent activity list in Overview
  const recentActivity = reportsData.slice(0, 5).map(r => ({
      site: r.domain,
      status: r.action === 'Blocked' ? (r.category === 'Social' ? RiskLevel.CRITICAL : RiskLevel.WARNING) : RiskLevel.SAFE,
      trackers: 1,
      time: 'Just now'
  }));

  const TutorialCard = ({ icon: Icon, title, desc, id }: { icon: any, title: string, desc: string, id: string }) => (
    <button 
        onClick={() => onStartTutorial(id)}
        className="bg-zinc-900 hover:bg-zinc-800 p-6 rounded-3xl text-left transition-all border border-transparent hover:border-zinc-700 group h-full flex flex-col justify-between"
    >
        <div>
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-[#4DFFBC] mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[#4DFFBC] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Start Lesson <ArrowRight className="w-4 h-4" />
        </div>
    </button>
  );

  return (
    <div className="w-full min-h-[600px] h-full bg-black font-sans text-zinc-300 flex flex-col relative overflow-x-hidden selection:bg-[#4DFFBC] selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4DFFBC] rounded-full flex items-center justify-center text-black">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">Echo</span>
                </div>

                <nav className="hidden md:flex items-center gap-2 bg-zinc-900 p-1.5 rounded-full">
                    {(['home', 'overview', 'reports', 'settings'] as DashboardTab[]).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all capitalize flex items-center gap-2
                                ${activeTab === tab ? 'bg-[#4DFFBC] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {tab === 'home' && <Home className="w-4 h-4" />}
                            {tab === 'overview' && <LayoutDashboard className="w-4 h-4" />}
                            {tab === 'reports' && <FileText className="w-4 h-4" />}
                            {tab === 'settings' && <SettingsIcon className="w-4 h-4" />}
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={onClose} 
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* VIEW CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* --- HOME TAB --- */}
        {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero */}
                <div className="bg-zinc-900 rounded-[2.5rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4DFFBC]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Welcome to Echo. <br/>
                            <span className="text-zinc-500">Your digital footprint is secure.</span>
                        </h1>
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => onTabChange('overview')}
                                className="px-8 py-4 bg-[#4DFFBC] hover:opacity-90 text-black font-bold rounded-full transition-all flex items-center gap-2"
                            >
                                Quick Start Analysis <ArrowRight className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={onTriggerIntervention}
                                className="px-6 py-4 bg-black text-white hover:bg-zinc-800 font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-800"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Test Intervention
                            </button>
                             <button 
                                onClick={onTriggerStrictBlock}
                                className="px-6 py-4 bg-red-950/30 text-[#FF4D4D] hover:bg-red-900/40 border border-[#FF4D4D]/20 font-bold rounded-full transition-all flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Test Strict Block
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tutorial Carousel */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6 pl-2">Privacy Academy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
                        <TutorialCard 
                            id="identity"
                            icon={User} 
                            title="Digital Identity 101" 
                            desc="Learn how advertisers build a profile of you based on your clicks." 
                        />
                        <TutorialCard 
                            id="trackers"
                            icon={Eye} 
                            title="How Trackers Follow You" 
                            desc="Understand the invisible scripts that monitor your journey across the web." 
                        />
                        <TutorialCard 
                            id="modes"
                            icon={Shield} 
                            title="Privacy Modes Explained" 
                            desc="Discover the difference between Strict, Balanced, and Custom protection." 
                        />
                    </div>
                </div>
            </div>
        )}

        {/* --- OTHER TABS --- */}
        {activeTab === 'overview' && (
          <Overview 
            initialProfile={profile} 
            privacyLevel={privacyLevel}
            isDataCleared={reportsData.length === 0}
            recentActivity={recentActivity}
            totalBlocked={totalBlocked}
            onOpenPersona={onOpenPersona}
          />
        )}
        {activeTab === 'reports' && (
            <Reports 
                data={reportsData} 
                onOpenEntity={onOpenEntity}
            />
        )}
        {activeTab === 'settings' && (
          <Settings 
            currentLevel={privacyLevel} 
            setLevel={setPrivacyLevel}
            onClearData={onClearData}
          />
        )}
      </main>
    </div>
  );
};
