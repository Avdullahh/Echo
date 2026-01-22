import React, { useEffect, useState } from 'react';
import { UserProfile, RiskLevel } from '../types';
import { analyzePrivacyFootprint } from '../services/aiService';
import { Sparkles, Fingerprint, Activity, Info } from 'lucide-react';
import { PrivacyLevel } from '../types';

interface OverviewProps {
  initialProfile: UserProfile;
  privacyLevel: PrivacyLevel;
  isDataCleared: boolean;
  recentActivity: any[]; // Receiving live feed
  totalBlocked: number; // Receiving live count
  onOpenPersona: () => void;
}

// --- MOCK DATA FOR VISUALS ---
const CATEGORY_DATA = [
  { label: 'Marketing', percent: 45, color: '#4DFFBC' }, 
  { label: 'Analytics', percent: 30, color: '#FF4D4D' }, 
  { label: 'Social', percent: 15, color: '#FFFFFF' },    
  { label: 'Utility', percent: 10, color: '#52525B' },   
];

const COMPANY_DATA = [
  { name: 'Google LLC', count: 142, color: 'bg-[#4DFFBC]' },
  { name: 'Meta Platforms', count: 85, color: 'bg-[#FF4D4D]' },
  { name: 'Amazon.com', count: 48, color: 'bg-white' },
  { name: 'Criteo SA', count: 24, color: 'bg-zinc-600' },
];

export const Overview: React.FC<OverviewProps> = ({ initialProfile, privacyLevel, isDataCleared, recentActivity, totalBlocked, onOpenPersona }) => {
  const [profile, setProfile] = useState(initialProfile);
  const [animate, setAnimate] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => { setAnimate(true); }, []);

  // Reset profile if data is cleared
  useEffect(() => {
    if (isDataCleared) {
        setProfile({ ...profile, persona: "Unknown", confidenceScore: 0 });
        setAiReport(null);
    }
  }, [isDataCleared]);

  const handleRunAnalysis = async () => {
    if (isDataCleared) return;
    setIsAnalyzing(true);
    setAiReport(null);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const report = await analyzePrivacyFootprint([], [], recentActivity);
    setAiReport(report);
    // DEMO EFFECT: Update persona to something fancy
    setProfile(prev => ({ ...prev, persona: "Tech-Savvy Foodie" }));
    setIsAnalyzing(false);
  };

  // --- DONUT CHART ---
  const DonutChart = () => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;
    
    if (isDataCleared) {
        return (
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-4 border-zinc-900">
                <span className="text-zinc-600 font-medium text-sm">No Data</span>
            </div>
        );
    }

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
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out opacity-100`}
                style={{ strokeDasharray: animate ? strokeDasharray : `0 ${circumference}` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-3xl font-bold transition-all duration-300 tracking-tight">{totalBlocked}</span>
          <span className="text-xs text-zinc-500 font-medium">Blocked</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Intro Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
          <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Overview</h2>
              <p className="text-zinc-500 mt-1 max-w-2xl text-base">
                  See how Echo is protecting your digital footprint today.
              </p>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="bg-zinc-900 rounded-2xl px-5 py-3 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#4DFFBC] animate-pulse"></div>
                   <span className="text-sm font-medium text-white">System Active</span>
              </div>
          </div>
      </div>

      {/* --- AI SECTION --- */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-48 h-48 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-[#4DFFBC] px-3 py-1 rounded-full text-black text-xs font-bold mb-4">
                      <Sparkles className="w-3 h-3" />
                      Gemini Powered
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Privacy Insights</h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                      {isDataCleared 
                        ? "Echo needs more browsing data to generate personalized privacy insights." 
                        : "Echo analyzes your blocked trackers to reveal how advertisers categorize you, helping you stay one step ahead."}
                  </p>
              </div>

              {!aiReport && !isAnalyzing && !isDataCleared && (
                  <button 
                      onClick={handleRunAnalysis}
                      className="shrink-0 bg-white hover:bg-zinc-200 text-black font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2"
                  >
                      <Sparkles className="w-4 h-4" />
                      Generate Report
                  </button>
              )}
          </div>

          {isAnalyzing && (
              <div className="mt-8 p-4 bg-black/20 rounded-xl flex items-center gap-4 w-fit">
                   <div className="w-5 h-5 border-2 border-[#4DFFBC] border-t-transparent rounded-full animate-spin"></div>
                   <div className="text-[#4DFFBC] text-sm font-medium">Analyzing tracking patterns...</div>
              </div>
          )}

          {aiReport && (
              <div className="mt-8 bg-black/20 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 border border-white/5">
                  <div className="prose prose-invert prose-sm max-w-none">
                      {aiReport.split('\n').map((line, i) => {
                          if (line.startsWith('###')) return <h4 key={i} className="text-white font-bold text-lg mt-4 first:mt-0 mb-2">{line.replace('###', '')}</h4>
                          if (line.trim().startsWith('-')) return <li key={i} className="ml-4 text-zinc-400 mb-1">{line.replace('-', '').trim()}</li>
                          return <p key={i} className="text-zinc-300 mb-2 leading-relaxed">{line.replace(/\*\*/g, '')}</p>
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Persona Card */}
      <button 
        onClick={onOpenPersona}
        className="w-full bg-zinc-900 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center text-left hover:bg-zinc-800 transition-colors group border border-transparent hover:border-zinc-700"
      >
          <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-[#FF4D4D] group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-12 h-12" />
              </div>
          </div>
          
          <div className="flex-1">
              <div className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-2">
                 Your Digital Persona <Info className="w-4 h-4" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{profile.persona}</h3>
              <p className="text-zinc-400 max-w-xl">
                  Advertisers likely associate your browsing habits with high-value consumer electronics and cooking interests.
              </p>
          </div>
          
          <div className="hidden md:block h-16 w-px bg-zinc-800"></div>

          <div className="flex-shrink-0 text-center">
               <div className="text-sm font-medium text-zinc-500 mb-1">Confidence</div>
               <div className="text-2xl font-bold text-[#4DFFBC]">{isDataCleared ? '0%' : '98%'}</div>
          </div>
      </button>

      {/* VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-3xl p-8 flex flex-col">
              <h3 className="font-bold text-white mb-6">Tracker Types</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                  <DonutChart />
                  {!isDataCleared && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-8 w-full px-2">
                        {CATEGORY_DATA.map(item => (
                            <div key={item.label} className="flex items-center justify-between text-xs font-medium text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span>{item.label}</span>
                                </div>
                                <span className="text-white">{item.percent}%</span>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 flex flex-col lg:col-span-2">
              <h3 className="font-bold text-white mb-6">Top Data Collectors</h3>
              <div className="flex-1 space-y-6">
                  {isDataCleared ? (
                      <div className="h-40 flex items-center justify-center text-zinc-600 text-sm font-medium">No data available</div>
                  ) : (
                      COMPANY_DATA.map((company) => (
                          <div key={company.name}>
                              <div className="flex justify-between text-sm font-medium mb-2">
                                  <span className="text-white">{company.name}</span>
                                  <span className="text-zinc-500">{company.count} requests</span>
                              </div>
                              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full rounded-full ${company.color} transition-all duration-1000 ease-out`} 
                                      style={{ width: animate ? `${(company.count / 200) * 100}%` : '0%' }}
                                  />
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* RECENT ACTIVITY LIST */}
      <div className="bg-zinc-900 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-zinc-500" />
                  Recent Activity
              </h3>
              <div className="flex items-center gap-2 text-xs font-medium text-[#4DFFBC] bg-[#4DFFBC]/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#4DFFBC] rounded-full animate-pulse"></span>
                  Live
              </div>
          </div>
          <div>
              {recentActivity.map((item, idx) => (
                  <div key={idx} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${item.status === RiskLevel.SAFE ? 'bg-[#4DFFBC]' : 'bg-[#FF4D4D]'}`}></div>
                          <div>
                              <div className="text-white font-medium text-sm">{item.site}</div>
                              <div className="text-zinc-500 text-xs mt-0.5">
                                  {item.status === RiskLevel.SAFE ? 'Allowed' : 'Tracker blocked'}
                              </div>
                          </div>
                      </div>
                      <span className="text-zinc-600 text-xs">{item.time}</span>
                  </div>
              ))}
              {recentActivity.length === 0 && (
                  <div className="p-12 text-center text-zinc-600 text-sm">No recent activity detected.</div>
              )}
          </div>
      </div>
    </div>
  );
};
