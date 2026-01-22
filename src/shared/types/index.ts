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
  company?: string;
  dataCollected?: string[];
}

export interface UserProfile {
  persona: string;
  tags: string[];
  trackersBlockedToday: number;
  confidenceScore: number;
}

export type DashboardTab = 'home' | 'overview' | 'reports' | 'settings';
export type PrivacyLevel = 'strict' | 'balanced' | 'custom';