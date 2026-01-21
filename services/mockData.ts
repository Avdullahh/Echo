import { RiskLevel, TrackerEvent, UserProfile } from '../types';

export const CURRENT_SITE_DOMAIN = "homechef-shop.com";

export const MOCK_TRACKERS: TrackerEvent[] = [
  {
    id: 't1',
    domain: 'adnxs.com',
    company: 'Xandr',
    category: 'Marketing',
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING,
    timestamp: new Date().toISOString()
  },
  {
    id: 't2',
    domain: 'google-analytics.com',
    company: 'Google',
    category: 'Analytics',
    action: 'Allowed',
    riskLevel: RiskLevel.SAFE,
    timestamp: new Date().toISOString()
  },
  {
    id: 't3',
    domain: 'facebook.net',
    company: 'Meta',
    category: 'Social',
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING,
    timestamp: new Date().toISOString()
  }
];

export const MOCK_USER_PROFILE: UserProfile = {
  persona: "The 'Tech-Savvy Foodie'",
  tags: ["Cooking", "Premium Electronics", "Home Appliances", "Shopping Behavior"],
  trackersBlockedToday: 14,
  confidenceScore: 0.85
};

// Typed as TrackerEvent[] to ensure 'action' and other required props are present
export const MOCK_REPORTS_DATA: TrackerEvent[] = [
  { 
    id: 1, 
    timestamp: '2023-10-27 10:42', 
    domain: 'doubleclick.net', 
    company: 'Google', 
    category: 'Marketing', 
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING 
  },
  { 
    id: 2, 
    timestamp: '2023-10-27 10:41', 
    domain: 'google-analytics.com', 
    company: 'Google', 
    category: 'Analytics', 
    action: 'Allowed',
    riskLevel: RiskLevel.SAFE 
  },
  { 
    id: 3, 
    timestamp: '2023-10-27 09:30', 
    domain: 'facebook.net', 
    company: 'Meta', 
    category: 'Social', 
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING 
  },
  { 
    id: 4, 
    timestamp: '2023-10-27 09:28', 
    domain: 'criteo.com', 
    company: 'Criteo', 
    category: 'Marketing', 
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING 
  },
  { 
    id: 5, 
    timestamp: '2023-10-27 08:15', 
    domain: 'hotjar.com', 
    company: 'Hotjar', 
    category: 'Analytics', 
    action: 'Allowed',
    riskLevel: RiskLevel.SAFE 
  },
  { 
    id: 6, 
    timestamp: '2023-10-26 22:10', 
    domain: 'amazon-adsystem.com', 
    company: 'Amazon', 
    category: 'Marketing', 
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING 
  },
  { 
    id: 7, 
    timestamp: '2023-10-26 21:05', 
    domain: 'twitter.com', 
    company: 'X Corp', 
    category: 'Social', 
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING 
  },
  { 
    id: 8, 
    timestamp: '2023-10-26 18:45', 
    domain: 'linkedin.com', 
    company: 'Microsoft', 
    category: 'Social', 
    action: 'Allowed',
    riskLevel: RiskLevel.SAFE 
  },
];

export const MOCK_WHITELIST = [
  { id: 1, domain: 'google.com', dateAdded: '2023-09-01' },
  { id: 2, domain: 'github.com', dateAdded: '2023-09-05' },
  { id: 3, domain: 'stackoverflow.com', dateAdded: '2023-09-12' },
];