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
}

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
  trackers = [],
  blockedCount,
  isProtectionOn,
  setProtectionOn,
  onOpenDashboard,
  persona = '',
  confidenceScore = 0,
}) => {
  const [explanation, setExplanation] = useState<AdExplanation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentHost, setCurrentHost] = useState<string>('');
  const [isSiteAllowlisted, setIsSiteAllowlisted] = useState(false);
  const [allowlistLoading, setAllowlistLoading] = useState(false);

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
    <div className="w-full min-h-full flex flex-col font-sans text-text-primary relative bg-bg-canvas selection:bg-accent-primary selection:text-neutral-0">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-20%] left-[-20%] w-[220px] h-[220px] bg-accent-softBg rounded-full blur-[70px] pointer-events-none opacity-60" />

      {/* HEADER & NAV ROW */}
      <div className="relative z-30 px-5 pt-6 pb-2 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 bg-accent-primary rounded-sm flex items-center justify-center text-text-onAccent shadow-glowAccent">
            <span className="font-bold text-[10px]">E</span>
          </div>
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
      <div className="relative z-10 flex flex-col items-center justify-center py-6">
        <button
          onClick={() => setProtectionOn(!isProtectionOn)}
          className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30 rounded-full z-10"
        >
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700
            ${isProtectionOn ? 'bg-accent-primary/30' : 'bg-transparent'}`}
          />
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative border-4
            ${isProtectionOn
              ? 'bg-accent-primary border-accent-primary shadow-glowAccent scale-100'
              : 'bg-surface-card border-border-default scale-95 hover:border-border-strong'
            }`}
          >
            <Power className={`w-12 h-12 transition-colors duration-300 stroke-[2.5px]
              ${isProtectionOn ? 'text-text-onAccent' : 'text-icon-muted group-hover:text-text-secondary'}`}
            />
          </div>
        </button>

        <div className="text-center mt-6 px-4">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-1">
            {isProtectionOn ? 'Echo On' : 'Echo Off'}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            {isProtectionOn
              ? 'Your digital footprint is masked.'
              : 'System paused. Protection is disabled.'}
          </p>
        </div>
      </div>

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
                  : 'Trust this site — stop blocking its trackers'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* MINI PERSONA CARD */}
      {persona && (
        <div className="mx-3 mb-3">
          <button
            onClick={() => onOpenDashboard('overview')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-card border border-border-subtle hover:border-accent-primary/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center shrink-0">
              <span className="text-sm">🧠</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-text-primary truncate">{persona}</div>
              <div className="text-[10px] text-text-muted">
                Algorithms see you as this — tap to explore
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-accent-primary">{confidenceScore}%</div>
              <div className="text-[9px] text-text-muted uppercase tracking-wide">Confidence</div>
            </div>
          </button>
        </div>
      )}

      {/* FR4 — AD EXPLANATION PANEL */}
      {isProtectionOn && (
        <div className="relative z-20 mx-3 mb-3">

          {explanation && !showExplanation && (
            <button
              onClick={() => setShowExplanation(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-card border border-border-subtle hover:border-accent-primary/50 transition-colors text-left"
            >
              <Info className="w-3.5 h-3.5 text-accent-primary shrink-0" />
              <span className="text-[11px] text-text-muted leading-tight truncate">
                Why am I seeing ads here?
              </span>
              <span className="ml-auto text-[10px] text-accent-primary font-medium shrink-0">
                Tap
              </span>
            </button>
          )}

          {explanation && showExplanation && (
            <div className="rounded-xl bg-surface-card border border-accent-primary/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-accent-primary" />
                  <span className="text-[11px] font-semibold text-accent-primary uppercase tracking-wide">
                    Why this ad?
                  </span>
                </div>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                {explanation.sentence}
              </p>

              <div className="flex items-center gap-3 pt-1 border-t border-border-subtle">
                <div className="text-center">
                  <div className="text-sm font-bold text-text-primary">{explanation.siteCount}</div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wide">Sites tracked</div>
                </div>
                <div className="w-px h-6 bg-border-subtle" />
                <div className="text-center flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-text-primary truncate">
                    "{explanation.inferredCategory}"
                  </div>
                  <div className="text-[9px] text-text-muted uppercase tracking-wide">Your profile</div>
                </div>
                <div className="w-px h-6 bg-border-subtle" />
                <button
                  onClick={() => onOpenDashboard('report')}
                  className="text-[9px] text-accent-primary font-medium hover:underline shrink-0"
                >
                  Full report →
                </button>
              </div>
            </div>
          )}

          {!explanation && trackers.length === 0 && (
            <div className="px-3 py-2 rounded-xl bg-surface-card border border-border-subtle">
              <p className="text-[11px] text-text-muted text-center leading-tight">
                Browse a few pages and Echo will explain why you're seeing ads here.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};