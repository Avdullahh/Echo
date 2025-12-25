import { RiskLevel, TrackerEvent, UserProfile } from '../types';

export const CURRENT_SITE_DOMAIN = "homechef-shop.com";

export const MOCK_TRACKERS: TrackerEvent[] = [
  {
    id: 't1',
    domain: 'adnxs.com',
    company: 'Xandr',
    category: 'Marketing',
    riskLevel: RiskLevel.WARNING,
    timestamp: new Date().toISOString()
  },
  {
    id: 't2',
    domain: 'google-analytics.com',
    company: 'Google',
    category: 'Analytics',
    riskLevel: RiskLevel.SAFE,
    timestamp: new Date().toISOString()
  },
  {
    id: 't3',
    domain: 'facebook.net',
    company: 'Meta',
    category: 'Social',
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