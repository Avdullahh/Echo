import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ExtensionPopup } from './components/ExtensionPopup';
import { TrackerEvent } from '../shared/types';
import { buildProfileFromEvents } from '../shared/services/profileUtils';

const PopupApp = () => {
  const [isProtectionOn, setProtectionOn] = useState<boolean | null>(null);
  const [realTrackers, setRealTrackers] = useState<TrackerEvent[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [persona, setPersona] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [cookieBannerState, setCookieBannerState] = useState<{
    hostname: string;
    analysis: {
      hasRejectAll: boolean;
      hasEssentialOnly: boolean;
      hasAcceptAll: boolean;
      isSafeToHide: boolean;
    };
    resolved: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        
        chrome.storage.local.get(
          ['detectedTrackers', 'trackersBlocked', 'isProtectionOn', 'cookieBannerState'],
          (result) => {
            const trackers = result.detectedTrackers || [];
            setRealTrackers(trackers);
            setBlockedCount(result.trackersBlocked || 0);
            setProtectionOn(result.isProtectionOn !== undefined ? result.isProtectionOn : true);
  
            const derived = buildProfileFromEvents(trackers);
            if (derived) {
              setPersona(derived.persona);
              setConfidenceScore(derived.confidenceScore);
            }
  
            // Load cookie banner state for active tab
            if (tabId) {
              const bannerState = result.cookieBannerState?.[tabId];
              if (bannerState && !bannerState.resolved) {
                setCookieBannerState(bannerState);
              }
            }
          }
        );
      });
    } else {
      setProtectionOn(true);
    }
  }, []);
  const handleToggle = (val: boolean) => {
    setProtectionOn(val);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ isProtectionOn: val }, () => {
        // Reload active tab so new rules take effect immediately
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (tabId) chrome.tabs.reload(tabId);
        });
      });
    }
  };

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
        cookieBannerState={cookieBannerState}
        onCookiePreference={(preference) => {
          if (!cookieBannerState) return;
          chrome.runtime.sendMessage({
            type: 'COOKIE_EXECUTE_PREFERENCE',
            preference,
            hostname: cookieBannerState.hostname,
          });
          setCookieBannerState(prev => prev ? { ...prev, resolved: true } : null);
        }}
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