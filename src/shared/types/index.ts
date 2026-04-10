export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

export interface TrackerEvent {
  id: number;
  domain: string;
  sourceWebsite: string;
  riskLevel: RiskLevel;
  action: 'Blocked' | 'Allowed';
  timestamp: string;
  company?: string;
}

export interface BlocklistRule {
  id: number;
  domain: string;
  owner: string;
  category: string;
  risk: string;
}

export type DashboardTab = 'home' | 'overview' | 'report' | 'settings';

export interface EchoStorage {
  isProtectionOn: boolean;
  trackerMetadata: Record<string, { owner: string; category: string }>;
  detectedTrackers: TrackerEvent[];
  trackersBlocked: number;
  isAdBlockingOn: boolean;
  adsBlocked?: number;
  isCookieBannerBlockingOn: boolean;
  cookieBannersHandled?: number;
  allowlistedSites?: string[];
}

export type CookiePreference = 'essential' | 'all' | 'block';

export interface CookieBannerState {
  hostname: string;
  detectedAt: string;
  handled: boolean;
}

export interface EchoStorage {
  isProtectionOn: boolean;
  trackerMetadata: Record<string, { owner: string; category: string }>;
  detectedTrackers: TrackerEvent[];
  trackersBlocked: number;
  isAdBlockingOn: boolean;
  adsBlocked?: number;
  isCookieBannerBlockingOn: boolean;
  cookieBannersHandled?: number;
  allowlistedSites?: string[];
  // Cookie banner state per active tab (tabId → state)
  cookieBannerState?: Record<number, CookieBannerState>;
  // Saved preferences per hostname
  cookiePreferences?: Record<string, CookiePreference>;
}