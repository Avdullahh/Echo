import React, { useEffect, useState } from 'react';
import { UserProfile, RiskLevel } from '../types';
import { TrafficLight } from './TrafficLight';
import { analyzePrivacyFootprint } from '../services/aiService';

interface DashboardProps {
  profile: UserProfile;
  onClose: () => void;
}

// --- MOCK DATA FOR CHARTS ---
const CATEGORY_DATA = [
  { label: 'Marketing', percent: 45, color: '#6366f1' }, // Indigo-500
  { label: 'Analytics', percent: 30, color: '#8b5cf6' }, // Violet-500
  { label: 'Social', percent: 15, color: '#ec4899' },    // Pink-500
  { label: 'Utility', percent: 10, color: '#94a3b8' },   // Slate-400
];

const COMPANY_DATA = [
  { name: 'Google LLC', count: 142, color: 'bg-blue-500' },
  { name: 'Meta Platforms', count: 85, color: 'bg-blue-600' },
  { name: 'Amazon.com', count: 48, color: 'bg-orange-500' },
  { name: 'Criteo SA', count: 24, color: 'bg-yellow-500' },
  { name: 'Oracle', count: 18, color: 'bg-red-500' },
];

const WEEKLY_ACTIVITY = [45, 62, 38, 74, 52, 29, 14]; // Mon-Sun blocked counts
const RECENT_ACTIVITY_DATA = [
    { site: 'homechef-shop.com', status: RiskLevel.WARNING, trackers: 3, time: 'Just now' },
    { site: 'dailynews.co.uk', status: RiskLevel.SAFE, trackers: 0, time: '2h ago' },
    { site: 'socialnet.com', status: RiskLevel.CRITICAL, trackers: 12, time: '5h ago' },
    { site: 'techradar.io', status: RiskLevel.WARNING, trackers: 5, time: '6h ago' },
    { site: 'banksecure.net', status: RiskLevel.SAFE, trackers: 0, time: 'Yesterday' },
    { site: 'onlinestore.com', status: RiskLevel.WARNING, trackers: 2, time: 'Yesterday' },
    { site: 'search-engine.com', status: RiskLevel.SAFE, trackers: 0, time: '2 days ago' },
];

// --- SUB-COMPONENTS ---

const DonutChart = () => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {CATEGORY_DATA.map((item, index) => {
          const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
          accumulatedPercent += item.percent;

          return (
            <circle
              key={item.label}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="10"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${mounted ? 'opacity-100' : 'opacity-0 stroke-0'}`}
              style={{ 
                  transitionDelay: `${index * 150}ms`,
                  strokeDasharray: mounted ? strokeDasharray : `0 ${circumference}`
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 animate-in fade-in zoom-in duration-700 delay-500">
        <span className="text-3xl font-bold">317</span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Blocked</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ profile, onClose }) => {
  const maxCount = Math.max(...COMPANY_DATA.map(c => c.count));
  const [animate, setAnimate] = useState(false);
  
  // AI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    // Add a slight artificial delay to make the "thinking" feel substantial if API is too fast
    const report = await analyzePrivacyFootprint(COMPANY_DATA, CATEGORY_DATA, RECENT_ACTIVITY_DATA);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* 
          WEB APP HEADER 
          Designed to look like a standalone SaaS application header.
      */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    {/* Brand Logo */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <circle cx="12" cy="12" r="3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12m10 10c5.52 0 10-4.48 10-10" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                         <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">Echo</span>
                         <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Privacy Suite</span>
                    </div>
                </div>

                {/* Navigation Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500 mr-4">
                        <span className="text-indigo-600 cursor-pointer">Overview</span>
                        <span className="hover:text-slate-800 cursor-pointer transition-colors">Reports</span>
                        <span className="hover:text-slate-800 cursor-pointer transition-colors">Settings</span>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Return to Extension Button */}
                    <button 
                        onClick={onClose} 
                        className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Close Dashboard and return to extension"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Return to Extension
                    </button>
                    
                    {/* Mock Profile Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Intro Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Digital Identity Overview</h2>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Real-time analysis of your online persona, tracker interactions, and exposure risks. 
                    This dashboard provides a detailed breakdown of the data collected by the extension.
                </p>
            </div>
        </div>

        {/* --- GEMINI INTELLIGENCE SECTION --- */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-sm p-1">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-indigo-500">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 15.03a.75.75 0 01.75.75v1.5H9.22a.75.75 0 010 1.5H7.72v1.5a.75.75 0 01-1.5 0v-1.5H4.72a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
            </div>
            
            <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-[20px] p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div className="max-w-2xl">
                         <div className="flex items-center gap-2 mb-2">
                             <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
                                </svg>
                                Gemini Intelligence
                             </span>
                         </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Deep Privacy Analysis</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Unlock advanced insights. Echo uses Gemini to analyze your tracking patterns, decode your algorithmic persona, and suggest concrete defense strategies.
                        </p>
                    </div>

                    {!aiReport && !isAnalyzing && (
                        <button 
                            onClick={handleRunAnalysis}
                            className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                            Run AI Audit
                        </button>
                    )}
                </div>

                {/* LOADING STATE */}
                {isAnalyzing && (
                    <div className="mt-6 p-4 border border-indigo-100 bg-white/50 rounded-xl flex items-center gap-4 animate-pulse">
                         <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                         <div className="space-y-2 flex-1">
                             <div className="h-4 bg-indigo-100 rounded w-1/4"></div>
                             <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                         </div>
                    </div>
                )}

                {/* RESULT STATE */}
                {aiReport && (
                    <div className="mt-6 bg-white rounded-xl border border-indigo-100 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="prose prose-sm prose-indigo max-w-none">
                            {/* Simple Markdown rendering by replacing newlines and bold syntax */}
                            {aiReport.split('\n').map((line, i) => {
                                // Simple header parsing
                                if (line.startsWith('###')) {
                                    return <h4 key={i} className="text-indigo-900 font-bold text-lg mt-4 first:mt-0 mb-2">{line.replace('###', '')}</h4>
                                }
                                // Simple list item
                                if (line.trim().startsWith('-')) {
                                     return <li key={i} className="ml-4 text-slate-700 mb-1 marker:text-indigo-400">{line.replace('-', '').trim()}</li>
                                }
                                // Bold parsing logic (basic)
                                const parts = line.split('**');
                                return (
                                    <p key={i} className="text-slate-600 mb-2 leading-relaxed">
                                        {parts.map((part, index) => 
                                            index % 2 === 1 ? <strong key={index} className="text-slate-900 font-semibold">{part}</strong> : part
                                        )}
                                    </p>
                                );
                            })}
                        </div>
                         <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                            <span className="text-[10px] text-slate-400 font-medium">Generated by Gemini 1.5 Flash</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Persona Card - The Hero Visualization */}
        <div className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white transform group-hover:scale-105 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-indigo-600 text-xs font-bold tracking-widest uppercase">Detected Persona</div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">HIGH CONFIDENCE</span>
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-900 mb-3">{profile.persona}</h3>
                    <p className="text-slate-600 max-w-2xl leading-relaxed">
                        Based on your browsing patterns, ad networks likely categorize you as a high-value target for 
                        <span className="font-semibold text-slate-800 bg-indigo-50 px-1 rounded mx-0.5">tech commodities</span> and 
                        <span className="font-semibold text-slate-800 bg-indigo-50 px-1 rounded mx-0.5">culinary products</span>. 
                        Your engagement with reviews and comparison sites suggests high purchase intent.
                    </p>
                </div>
            </div>
        </div>

        {/* VISUALIZATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Category Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-100 transition-colors">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                    Tracker Categories
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <DonutChart />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full px-4">
                        {CATEGORY_DATA.map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-slate-600">{item.label}</span>
                                </div>
                                <span className="font-semibold text-slate-900">{item.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart 2: Top Companies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:col-span-2 hover:border-indigo-100 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
                        Top Tracking Entities
                    </h3>
                    <div className="flex gap-2">
                        <button className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 font-medium transition-colors">Export Data</button>
                        <select className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-500 outline-none cursor-pointer">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                </div>
                
                <div className="flex-1 space-y-5">
                    {COMPANY_DATA.map((company, i) => (
                        <div key={company.name} className="group">
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-slate-700">{company.name}</span>
                                <span className="text-slate-500 text-xs">{company.count} attempts</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${company.color} transition-all duration-1000 ease-out group-hover:opacity-80 relative`} 
                                    style={{ width: animate ? `${(company.count / maxCount) * 100}%` : '0%' }}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mini Weekly Sparkline */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                         <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Weekly Activity Intensity</div>
                         <div className="text-xs text-indigo-600 font-medium">Average: 45/day</div>
                    </div>
                   
                    <div className="flex items-end justify-between h-24 gap-2">
                        {WEEKLY_ACTIVITY.map((val, idx) => (
                            <div key={idx} className="w-full bg-slate-50 rounded-t-md relative group overflow-hidden">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-indigo-200 group-hover:bg-indigo-400 transition-all duration-500 rounded-t-md" 
                                    style={{ height: animate ? `${(val / 100) * 100}%` : '0%' }}
                                ></div>
                                <div className="absolute top-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-700">
                                    {val}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 uppercase font-medium">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>
            </div>
        </div>

        {/* METRICS & ACTIVITY ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            
            {/* Interests & Shopping */}
            <div className="space-y-6">
                 {/* Interests Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.16-1.1c-1.059-.958-2.274-2.133-3.16-3.419C3.606 10.057 3 7.823 3 5.857 3 3.69 4.69 2 6.8 2c1.226 0 2.22.625 2.827 1.567A2.868 2.868 0 0112.455 2c2.11 0 3.8 1.69 3.8 3.857 0 1.966-.606 4.199-2.309 6.524-.886 1.286-2.101 2.46-3.159 3.419a20.76 20.76 0 01-1.16 1.1l-.019.01-.005.003h-.001a.75.75 0 01-.988 0l-.001-.001z" />
                            </svg>
                        </div>
                        <div>
                             <h3 className="font-bold text-slate-800 text-sm">Inferred Interests</h3>
                             <p className="text-xs text-slate-500">Topics targeting your profile</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.tags.map(tag => (
                            <span key={tag} className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors rounded-lg text-sm font-medium border border-slate-100 cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Shopping Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Shopping Intent</h3>
                            <p className="text-xs text-slate-500">Predicted purchase categories</p>
                        </div>
                    </div>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 cursor-default">Premium Electronics</span>
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 cursor-default">Home Appliances</span>
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 cursor-default">Meal Kits</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-100 transition-colors">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Recent Activity Log</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Monitoring
                    </div>
                </div>
                <div className="flex-1 overflow-auto max-h-[300px]">
                    {RECENT_ACTIVITY_DATA.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-default">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.status === RiskLevel.CRITICAL ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {item.site[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{item.site}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <TrafficLight level={item.status} size="sm" />
                                        {item.status === RiskLevel.SAFE ? 'Secure connection' : `${item.trackers} Trackers Blocked`}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">{item.time}</div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors flex items-center justify-center gap-1 w-full">
                        View Full History
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};
