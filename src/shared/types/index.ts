export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

export interface TrackerEvent {
  id: number;
  host: string;
  domain: string;
  category: string;
  riskLevel: RiskLevel;
  action: 'Blocked' | 'Allowed';
  timestamp: string;
  company?: string; // Optional: "Google", "Facebook", etc.
}

export interface BlocklistRule {
  id: number;
  domain: string;
  owner: string;
  category: string;
  risk: string;
}

// FIX: Updated 'reports' to 'report' to match Dashboard HTML ID
export type DashboardTab = 'home' | 'overview' | 'report' | 'settings';

// Storage interface for extension settings and data
export interface EchoStorage {
  // Tracker blocking
  isProtectionOn: boolean;
  trackerMetadata: Record<string, { owner: string; category: string }>;
  detectedTrackers: TrackerEvent[];
  trackersBlocked: number;

  // Ad blocking
  isAdBlockingOn: boolean;
  adsBlocked?: number;

  // Cookie banner blocking
  isCookieBannerBlockingOn: boolean;
  cookieBannersHandled?: number;
}