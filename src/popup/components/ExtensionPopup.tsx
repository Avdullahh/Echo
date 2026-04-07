import React, { useEffect, useState } from 'react';
import { Power, LayoutDashboard, Settings, Home, FileText, Info, X } from 'lucide-react';
import { TrackerEvent, DashboardTab } from '../../shared/types';
import { explainAds, AdExplanation } from '../../shared/services/adExplainer';

interface ExtensionPopupProps {
  trackers?: TrackerEvent[];
  blockedCount: number;
  isProtectionOn: boolean | null;
  setProtectionOn: (val: boolean) => void;
  onOpenDashboard: (tab: DashboardTab) => void;
}

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({
  trackers = [],
  blockedCount,
  isProtectionOn,
  setProtectionOn,
  onOpenDashboard,
}) => {
  const [explanation, setExplanation] = useState<AdExplanation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (trackers.length === 0) return;

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      const host = trackers[0].sourceWebsite || 'unknown';
      setExplanation(explainAds(trackers, host));
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (!url) return;
      try {
        const host = new URL(url).hostname;
        setExplanation(explainAds(trackers, host));
      } catch {
        // ignore chrome:// etc
      }
    });
  }, [trackers]);

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
      <div className="relative z-10 flex flex-col items-center justify-center py-8">
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

      {/* FR4 — AD EXPLANATION PANEL */}
      {isProtectionOn && (
        <div className="relative z-20 mx-3 mb-3">

          {/* Collapsed teaser */}
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

          {/* Expanded card */}
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

          {/* No data nudge */}
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