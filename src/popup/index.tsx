import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css'; 
import { ExtensionPopup } from './components/ExtensionPopup'; 
import { TrackerEvent } from '../shared/types';
import { analyzeDigitalProfile } from '../shared/services/profileAnalyzer';

// AFTER
const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState<boolean | null>(null);
  const [realTrackers, setRealTrackers] = useState<TrackerEvent[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [persona, setPersona] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['detectedTrackers', 'trackersBlocked', 'isProtectionOn'], (result) => {
        const trackers = result.detectedTrackers || [];
        setRealTrackers(trackers);
        setBlockedCount(result.trackersBlocked || 0);
        setProtectionOn(result.isProtectionOn !== undefined ? result.isProtectionOn : true);

        // Derive persona from real tracker data
        if (trackers.length > 0) {
          const companyCounts: Record<string, number> = {};
          const sourceCounts: Record<string, number> = {};
          trackers.forEach((e: TrackerEvent) => {
            const name = e.company || e.domain || 'Unknown';
            companyCounts[name] = (companyCounts[name] || 0) + 1;
            const site = e.sourceWebsite || 'unknown';
            sourceCounts[site] = (sourceCounts[site] || 0) + 1;
          });
          const total = trackers.length;
          const allCompanies = Object.entries(companyCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count: count as number }));
          const allWebsites = Object.entries(sourceCounts)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map(([label, count]) => ({
            label,
            percent: Math.round(((count as number) / total) * 100)
          }));
          
          const markdown = analyzeDigitalProfile(allCompanies, allWebsites);
          const titleMatch = markdown.match(/\*\*(.+?)\*\*/);
          setPersona(titleMatch ? titleMatch[1] : 'Active Browser');
          setConfidenceScore(Math.min(100, Math.round((trackers.length / 80) * 60 + (allWebsites.length / 15) * 40)));
        }
      });
    } else {
        setProtectionOn(true);
    }
  }, []);

  // CHANGE 3: Wrapper to save state immediately when toggled
  const handleToggle = (val: boolean) => {
      setProtectionOn(val);
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ isProtectionOn: val });
      }
  };

  // CHANGE 4: Prevent rendering until state is known
  if (isProtectionOn === null) return null; 

  return (
    <div className="w-[350px] h-[550px] bg-bg-canvas text-text-primary overflow-y-auto border border-border-subtle shadow-2xl">
      <ExtensionPopup 
        trackers={realTrackers}
        blockedCount={blockedCount}
        isProtectionOn={isProtectionOn}
        setProtectionOn={handleToggle}
        persona={persona}
        confidenceScore={confidenceScore}
        onOpenDashboard={(tab) => {
            const targetUrl = `dashboard.html#${tab}`;
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: targetUrl });
            } else {
                window.open(targetUrl, '_blank');
            }
        }}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><PopupApp /></React.StrictMode>);