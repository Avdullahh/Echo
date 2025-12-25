export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface TrackerEvent {
  id: string;
  domain: string;
  company: string;
  category: 'Marketing' | 'Analytics' | 'Functional' | 'Social';
  riskLevel: RiskLevel;
  timestamp: string;
}

export interface UserProfile {
  persona: string;
  tags: string[];
  trackersBlockedToday: number;
  confidenceScore: number; // 0 to 1
}

export interface SiteRule {
  domain: string;
  status: 'ALLOWED' | 'BLOCKED' | 'ESSENTIAL_ONLY';
}