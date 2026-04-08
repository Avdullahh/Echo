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