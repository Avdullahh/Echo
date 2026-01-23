import { TrackerEvent, RiskLevel, BlocklistRule } from '../shared/types';

const API_ENDPOINT = 'http://localhost:3000/api/blocklist'; 
const UPDATE_ALARM = 'update-blocklist';

console.log("Echo: Background Engine Starting...");

// --- 1. INITIALIZATION ---
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Echo: Extension Installed. Fetching Real Blocklist...");
  await refreshBlocklist();
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 60 }); 
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPDATE_ALARM) await refreshBlocklist();
});

// --- 2. BLOCKLIST SYNC (with Metadata) ---
async function refreshBlocklist() {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const dbRules: BlocklistRule[] = await response.json();
    console.log(`Echo: Received ${dbRules.length} rules.`);

    // CREATE LOOKUP MAP (Domain -> Owner)
    const metadata: Record<string, { owner: string, category: string }> = {};
    
    const dynamicRules = dbRules.map((rule) => {
      metadata[rule.domain] = { owner: rule.owner, category: rule.category }; // Store metadata
      
      return {
        id: rule.id,
        priority: 1,
        action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
        condition: { 
          urlFilter: rule.domain, 
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.SCRIPT,
            chrome.declarativeNetRequest.ResourceType.IMAGE,
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
            chrome.declarativeNetRequest.ResourceType.PING
          ] 
        }
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: dynamicRules.map(r => r.id),
      addRules: dynamicRules
    });

    await chrome.storage.local.set({ trackerMetadata: metadata });
    console.log("Echo: Metadata and Rules Updated.");
    
  } catch (error) {
    console.error("Echo: Sync Failed", error);
  }
}

// --- 3. INTELLIGENT LOGGING (With Spam Filter) ---
let recentLogs = new Set<string>(); // Cache to track recent blocks

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const match = info.request;
  const domain = new URL(match.url).hostname;
  
  // SPAM FILTER: If we blocked this domain in the last 2 seconds, ignore it.
  if (recentLogs.has(domain)) return;
  
  // Add to cache and remove after 2 seconds
  recentLogs.add(domain);
  setTimeout(() => recentLogs.delete(domain), 2000);

  // FETCH METADATA
  const store = await chrome.storage.local.get(['trackerMetadata']);
  const meta = store.trackerMetadata ? store.trackerMetadata[domain] : null;

  const event: TrackerEvent = {
    id: Date.now(),
    host: domain,
    domain: domain,
    category: meta ? meta.category : 'Unknown',
    company: meta ? meta.owner : 'Unknown', // <--- REAL OWNER (e.g., "Google")
    riskLevel: RiskLevel.WARNING,
    action: 'Blocked',
    timestamp: new Date().toISOString()
  };

  saveEvent(event);
});

async function saveEvent(newEvent: TrackerEvent) {
  const result = await chrome.storage.local.get(['detectedTrackers', 'trackersBlocked']);
  let events = result.detectedTrackers || [];
  let count = result.trackersBlocked || 0;

  events.unshift(newEvent);
  if (events.length > 200) events = events.slice(0, 200); // Keep list short for performance

  await chrome.storage.local.set({
    detectedTrackers: events,
    trackersBlocked: count + 1
  });
}