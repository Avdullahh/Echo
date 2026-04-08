/**
 * event-logger.ts
 * Responsible solely for persisting tracker events to chrome.storage.local.
 * No rule management, no badge updates, no network calls.
 *
 * Storage cap: 2000 events (~400KB) — deliberate design decision balancing
 * profile accuracy against chrome.storage.local's 10MB quota.
 */

import { TrackerEvent } from '../shared/types';
import { setBadgeCount } from './badge-manager';

const MAX_EVENTS = 2000;

// Deduplication window — ignore the same domain within 2 seconds
// to prevent spam from heavily tracked pages.
const recentLogs = new Set<string>();

export function isDuplicate(domain: string): boolean {
  if (recentLogs.has(domain)) return true;
  recentLogs.add(domain);
  setTimeout(() => recentLogs.delete(domain), 30000);
  return false;
}

export async function logTrackerEvent(event: TrackerEvent): Promise<void> {
  const result = await chrome.storage.local.get(['detectedTrackers', 'trackersBlocked']);
  let events: TrackerEvent[] = result.detectedTrackers || [];
  let count: number = (result.trackersBlocked || 0) + 1;

  events.unshift(event);
  if (events.length > MAX_EVENTS) events = events.slice(0, MAX_EVENTS);

  setBadgeCount(count);

  await chrome.storage.local.set({
    detectedTrackers: events,
    trackersBlocked: count,
  });
}

export async function clearTrackerEvents(): Promise<void> {
  await chrome.storage.local.set({
    detectedTrackers: [],
    trackersBlocked: 0,
  });
}

export async function logAllowedEvent(event: TrackerEvent): Promise<void> {
  const result = await chrome.storage.local.get(['detectedTrackers']);
  let events: TrackerEvent[] = result.detectedTrackers || [];

  // Mark as allowed/bypassed — don't increment the blocked count
  events.unshift(event);
  if (events.length > MAX_EVENTS) events = events.slice(0, MAX_EVENTS);

  await chrome.storage.local.set({ detectedTrackers: events });
}