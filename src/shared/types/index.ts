
export enum RiskLevel {
  SAFE = 'SAFE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface TrackerEvent {
  id: string | number;
  domain: string;
  category: string;
  action: 'Blocked' | 'Allowed';
  riskLevel?: RiskLevel;
  timestamp: string;
  company?: string; // Enhanced for Entity Detail
  dataCollected?: string[]; // Enhanced for Entity Detail
}

export interface UserProfile {
  persona: string;
  tags: string[];
  trackersBlockedToday: number;
  confidenceScore: number; // 0 to 1
}

export interface OnboardingAnswers {
  cooking: boolean;
  tech: boolean;
  shopping: boolean;
}
