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