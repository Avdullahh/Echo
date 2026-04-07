/**
 * profileUtils.ts
 * Shared utility for deriving a user profile from raw TrackerEvent arrays.
 * Used by both App.tsx (dashboard) and popup/index.tsx (extension popup).
 */

import { TrackerEvent } from '../types/index';
import { buildFullProfile, DigitalProfile } from './profileAnalyzer';

export interface DerivedProfile {
  persona: string;
  confidenceScore: number;
  fullProfile: DigitalProfile;
}

export function buildProfileFromEvents(events: TrackerEvent[]): DerivedProfile | null {
  if (events.length === 0) return null;

  const companyCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  events.forEach(e => {
    const name = (e.company && e.company !== 'Unknown') ? e.company : e.domain;
    if (name) companyCounts[name] = (companyCounts[name] || 0) + 1;
    const site = e.sourceWebsite || 'unknown';
    sourceCounts[site] = (sourceCounts[site] || 0) + 1;
  });

  const totalEvents = events.length;

  const allCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const allWebsites = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      percent: Math.round((count / totalEvents) * 100)
    }));

  const fullProfile = buildFullProfile(allCompanies, allWebsites);

  const confidenceScore = Math.min(
    100,
    Math.round((totalEvents / 80) * 60 + (allWebsites.length / 15) * 40)
  );

  return {
    persona: fullProfile.personaTitle,
    confidenceScore,
    fullProfile,
  };
}