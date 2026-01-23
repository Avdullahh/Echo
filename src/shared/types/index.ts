export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

// 1. WHAT THE EXTENSION LOGS LOCALLY (Your Reflection Data)
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

// 2. WHAT THE DATABASE MUST SEND (The Real API Contract)
export interface BlocklistRule {
  id: number;
  domain: string;
  owner: string; // e.g., "Google", "Meta"
  category: string; // e.g., "Analytics", "Advertising"
  risk: RiskLevel;
}