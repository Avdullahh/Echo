import React, { useEffect, useState } from 'react';
import { Power, Settings, Home, LayoutDashboard, FileText, Info, X, ShieldOff, ShieldCheck } from 'lucide-react';
import { TrackerEvent, DashboardTab } from '../../shared/types';
import { explainAds, AdExplanation } from '../../shared/services/adExplainer';

interface ExtensionPopupProps {
  trackers?: TrackerEvent[];
  blockedCount: number;
  isProtectionOn: boolean | null;
  setProtectionOn: (val: boolean) => void;
  onOpenDashboard: (tab: DashboardTab) => void;
  persona?: string;
  confidenceScore?: number;
  cookieBannerState?: {
    hostname: string;
    analysis: {
      hasRejectAll: boolean;
      hasEssentialOnly: boolean;
      hasAcceptAll: boolean;
      isSafeToHide: boolean;
    };
    resolved: boolean;
  } | null;
  onCookiePreference?: (preference: 'essential' | 'all' | 'block') => void;
}

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
  trackers = [],
  blockedCount,
  isProtectionOn,
  setProtectionOn,
  onOpenDashboard,
  persona = '',
  confidenceScore = 0,
  cookieBannerState = null,
  onCookiePreference,
}) => {
  const [explanation, setExplanation] = useState<AdExplanation | null>(null);
  const [currentHost, setCurrentHost] = useState<string>('');
  const [isSiteAllowlisted, setIsSiteAllowlisted] = useState(false);
  const [allowlistLoading, setAllowlistLoading] = useState(false);
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [cookieResolved, setCookieResolved] = useState(false);
  const [chosenPreference, setChosenPreference] = useState<string | null>(null);

  const handleCookieChoice = (preference: 'essential' | 'all' | 'block') => {
    setChosenPreference(preference);
    setCookieResolved(true);
    setShowCookieDetails(false);
    onCookiePreference?.(preference);
  };
  // Resolve current tab hostname and check allowlist status
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0]?.url;
      if (!url) return;

      try {
        const host = new URL(url).hostname;
        setCurrentHost(host);

        // Check if this site is already allowlisted
        const result = await chrome.storage.local.get(['allowlistedSites']);
        const sites: string[] = result.allowlistedSites || [];
        setIsSiteAllowlisted(sites.includes(host));

        // Also set explanation
        if (trackers.length > 0) {
          setExplanation(explainAds(trackers, host));
        }
      } catch {
        // ignore chrome:// etc
      }
    });
  }, [trackers]);

  // Fallback for dev mode
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) return;
    if (trackers.length === 0) return;
    const host = trackers[0].sourceWebsite || 'unknown';
    setExplanation(explainAds(trackers, host));
  }, [trackers]);

  const handleAllowlistToggle = async () => {
    if (!currentHost || allowlistLoading) return;
    setAllowlistLoading(true);
  
    try {
      await chrome.runtime.sendMessage({
        type: isSiteAllowlisted ? 'REMOVE_ALLOWLIST' : 'ADD_ALLOWLIST',
        hostname: currentHost,
      });
      setIsSiteAllowlisted(!isSiteAllowlisted);
  
      // Reload the active tab so the new allowlist rule takes effect immediately
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) chrome.tabs.reload(tabId);
      });
    } catch (err) {
      console.error('Echo: Allowlist toggle failed', err);
    } finally {
      setAllowlistLoading(false);
    }
  };

  const NavItem = ({
    icon: Icon,
    label,
    target,
  }: {
    icon: React.ElementType;
    label: string;
    target: DashboardTab;
  }) => (
    <button
      onClick={() => onOpenDashboard(target)}
      className="group flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-cardAlt transition-all duration-300 overflow-hidden w-8 hover:w-24 bg-transparent"
      title={label}
    >
      <div className="w-5 h-5 flex items-center justify-center text-text-muted group-hover:text-accent-primary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-medium text-text-primary opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
        {label}
      </span>
    </button>
  );

  return (
    <div className="w-full min-h-full flex flex-col font-sans text-text-primary relative bg-bg-canvas selection:bg-accent-primary selection:text-neutral-0 h-full">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-20%] left-[-20%] w-[220px] h-[220px] bg-accent-softBg rounded-full blur-[70px] pointer-events-none opacity-60" />

      {/* HEADER & NAV ROW */}
      <div className="relative z-30 px-5 pt-3 pb-1 flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="/icons/icon128.png" alt="Echo" className="w-6 h-6 object-contain" />
          <span className="font-bold text-lg tracking-tight text-text-primary">Echo</span>
        </div>

        <div className="flex items-center justify-between bg-surface-card/50 backdrop-blur-sm border border-border-subtle rounded-full p-1 shadow-cardSoft mx-1">
          <NavItem icon={Home}            label="Home"     target="home"     />
          <NavItem icon={LayoutDashboard} label="Overview" target="overview" />
          <NavItem icon={FileText}        label="Report"   target="report"   />
          <NavItem icon={Settings}        label="Settings" target="settings" />
        </div>
      </div>

      {/* POWER BUTTON AREA */}
      <div className="relative z-10 flex flex-col items-center justify-center py-3">
        <button
          onClick={() => setProtectionOn(!isProtectionOn)}
          className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30 rounded-full z-10"
        >
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700
            ${isProtectionOn ? 'bg-accent-primary/30' : 'bg-transparent'}`}
          />
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative border-4
            ${isProtectionOn
              ? 'bg-accent-primary border-accent-primary shadow-glowAccent scale-100'
              : 'bg-surface-card border-border-default scale-95 hover:border-border-strong'
            }`}
          >
            <Power className={`w-9 h-9 transition-colors duration-300 stroke-[2.5px]
              ${isProtectionOn ? 'text-text-onAccent' : 'text-icon-muted group-hover:text-text-secondary'}`}
            />
          </div>
        </button>

        <div className="text-center mt-3 px-4">
          <h2 className="text-1 font-bold text-text-primary tracking-tight mb-1">
            {isProtectionOn ? 'Echo On' : 'Echo Off'}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            {isProtectionOn
              ? 'Your digital footprint is masked.'
              : 'System paused. Protection is disabled.'}
          </p>
        </div>
      </div>

      {/* COOKIE BANNER CARD*/}
      {cookieBannerState && !cookieBannerState.resolved && !cookieResolved && (
        <div className="mx-3 mb-3">
          {!showCookieDetails ? (
            // Image 2 — Analysis card
            <div className="rounded-xl bg-surface-card border border-amber-500/30 p-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm">🍪</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide mb-1">
                    Echo Analysis
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                    This site wants to use{' '}
                    <strong className="text-text-primary">
                      {cookieBannerState.analysis.hasAcceptAll && !cookieBannerState.analysis.hasRejectAll
                        ? 'marketing cookies'
                        : 'tracking cookies'}
                    </strong>{' '}
                    to follow your browsing activity here and on other websites.
                  </p>
                  <button
                    onClick={() => setShowCookieDetails(true)}
                    className="text-[11px] text-accent-primary font-medium hover:underline"
                  >
                    More details →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Image 3 — Privacy level selector
            <div className="rounded-xl bg-surface-card border border-border-subtle overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <span className="text-[12px] font-bold text-text-primary">Select Privacy Level</span>
                </div>
                <button
                  onClick={() => setShowCookieDetails(false)}
                  className="text-text-muted hover:text-text-primary transition-colors text-[11px]"
                >
                  ✕
                </button>
              </div>

              {/* Option 1 — Essential only (recommended) */}
              <button
                onClick={() => handleCookieChoice('essential')}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-surface-cardAlt transition-colors text-left border-b border-border-subtle group"
              >
                <div className="w-4 h-4 rounded-full border-2 border-accent-primary bg-accent-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-text-primary">
                    Allow only essential cookies
                  </div>
                  <div className="text-[10px] text-text-muted leading-relaxed">
                    Site will still work, but fewer adverts follow you.
                  </div>
                </div>
              </button>

              {/* Option 2 — Allow all */}
              <button
                onClick={() => handleCookieChoice('all')}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-surface-cardAlt transition-colors text-left border-b border-border-subtle"
              >
                <div className="w-4 h-4 rounded-full border-2 border-border-strong flex items-center justify-center shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-text-primary">
                    Allow all cookies
                  </div>
                  <div className="text-[10px] text-text-muted leading-relaxed">
                    May be used for personalised adverts and analytics.
                  </div>
                </div>
              </button>

              {/* Option 3 — Block tracking */}
              <button
                onClick={() => handleCookieChoice('block')}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-surface-cardAlt transition-colors text-left"
              >
                <div className="w-4 h-4 rounded-full border-2 border-accent-critical/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-accent-critical">✕</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-accent-critical">
                    Block tracking cookies from this site
                  </div>
                  <div className="text-[10px] text-accent-critical/70 leading-relaxed">
                    Some adverts may not work, but browsing should continue normally.
                  </div>
                </div>
              </button>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 bg-surface-inset/50 border-t border-border-subtle">
                <span className="text-[9px] text-text-muted">Echo v1.0</span>
                <button className="text-[9px] text-text-muted hover:text-text-primary transition-colors">
                  Advanced Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COOKIE RESOLVED — Image 4 confirmation */}
      {cookieResolved && chosenPreference && (
        <div className="mx-3 mb-3">
          <div className="rounded-xl bg-surface-card border border-accent-primary/30 p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center mx-auto mb-2">
              <span className="text-sm">✓</span>
            </div>
            <div className="text-[12px] font-bold text-text-primary mb-1">
              Preferences Saved
            </div>
            <div className="text-[10px] text-text-muted leading-relaxed mb-2">
              Your choice has been saved. You can change it anytime from the Echo icon.
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[9px]">🛡️</span>
              <span className="text-[10px] text-text-muted">Echo is active in background</span>
            </div>
          </div>
        </div>
      )}
      {/* PER-SITE ALLOWLIST BUTTON */}
      {isProtectionOn && currentHost && (
        <div className="mx-3 mb-3">
          <button
            onClick={handleAllowlistToggle}
            disabled={allowlistLoading}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left
              ${isSiteAllowlisted
                ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/70'
                : 'bg-surface-card border-border-subtle hover:border-border-strong'
              }`}
          >
            {isSiteAllowlisted
              ? <ShieldOff className="w-4 h-4 text-amber-400 shrink-0" />
              : <ShieldCheck className="w-4 h-4 text-text-muted shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className={`text-[11px] font-semibold truncate
                ${isSiteAllowlisted ? 'text-amber-400' : 'text-text-primary'}`}>
                {isSiteAllowlisted
                  ? `Echo paused on ${currentHost}`
                  : `Pause Echo on ${currentHost}`}
              </div>
              <div className="text-[10px] text-text-muted">
                {isSiteAllowlisted
                  ? 'Tap to resume protection on this site'
                  : 'Trust this site - stop blocking its trackers'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* MINI PERSONA CARD */}
      {persona && (
        <div className="mx-3 mb-3">
          <button
            onClick={() => onOpenDashboard('home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-card border border-border-subtle hover:border-accent-primary/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center shrink-0">
              <span className="text-sm">🧠</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-text-primary truncate">{persona}</div>
              <div className="text-[10px] text-text-muted">
                Algorithms see you as this - tap to explore
              </div>
            </div>
          </button>
        </div>
      )}

          {!explanation && trackers.length === 0 && (
                      <div className="px-3 py-2 rounded-xl bg-surface-card border border-border-subtle">
                        <p className="text-[11px] text-text-muted text-center leading-tight">
                          Browse a few pages and Echo will explain why you're seeing ads here.
                        </p>
                      </div>
                    )}
              
              <div className="flex-1" />

    {/* SPACER — pushes report button to bottom */}
    <div className="flex-1" />

    <div className="mt-auto pb-3 flex justify-center">
      <button
        onClick={() => {
          const body = `**Site:** ${currentHost}\n\n**What happened:**\n\n**Expected behaviour:**\n\n*Reported via Echo extension*`;
          const url = `https://github.com/Avdullahh/Echo/issues/new?title=Broken+site+report:+${encodeURIComponent(currentHost)}&body=${encodeURIComponent(body)}`;
          chrome.tabs.create({ url });
        }}
        className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent-primary transition-colors bg-transparent border-none cursor-pointer"
      >
        <span>⚑</span>
        <span>Report broken site</span>
      </button>
    </div>

    </div>
    );
  };