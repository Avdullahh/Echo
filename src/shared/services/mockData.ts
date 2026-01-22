import { RiskLevel, TrackerEvent, UserProfile } from '../types';

export const MOCK_USER_PROFILE: UserProfile = {
  persona: 'Digital Native',
  tags: ['Tech Savvy', 'High Value Target', 'Crypto Enthusiast'],
  trackersBlockedToday: 142,
  confidenceScore: 85
};

export const MOCK_REPORTS_DATA: TrackerEvent[] = [
  {
    id: 101, // Fixed: Number instead of string 't1'
    host: 'analytics.google.com', // Fixed: Added required 'host'
    timestamp: '2023-10-27T10:30:00Z',
    domain: 'google.com',
    company: 'Google',
    category: 'Analytics',
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING
  },
  {
    id: 102,
    host: 'connect.facebook.net',
    timestamp: '2023-10-27T10:35:00Z',
    domain: 'facebook.com',
    company: 'Meta',
    category: 'Social',
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING
  },
  {
    id: 103,
    host: 'assets.adobedtm.com',
    timestamp: '2023-10-27T11:00:00Z',
    domain: 'adobe.com',
    company: 'Adobe',
    category: 'Analytics',
    action: 'Allowed',
    riskLevel: RiskLevel.SAFE
  },
  {
    id: 104,
    host: 'pixel.tiktok.com',
    timestamp: '2023-10-27T11:15:00Z',
    domain: 'tiktok.com',
    company: 'ByteDance',
    category: 'Social',
    action: 'Blocked',
    riskLevel: RiskLevel.CRITICAL
  },
  {
    id: 105,
    host: 'c.amazon-adsystem.com',
    timestamp: '2023-10-27T11:20:00Z',
    domain: 'amazon.com',
    company: 'Amazon',
    category: 'Advertising',
    action: 'Blocked',
    riskLevel: RiskLevel.WARNING
  }
];