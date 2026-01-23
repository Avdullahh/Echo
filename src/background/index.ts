import { TrackerEvent, RiskLevel, BlocklistRule } from '../shared/types';

const API_ENDPOINT = 'http://localhost:3000/api/blocklist'; 
const UPDATE_ALARM = 'update-blocklist';

console.log("Echo: Background Engine Starting...");

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ isProtectionOn: true }); // Default On
  await refreshBlocklist();
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 60 }); 
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPDATE_ALARM) await refreshBlocklist();
});

// LISTENER: Handle "Echo Off" immediately
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.isProtectionOn) {
    const isProtectionOn = changes.isProtectionOn.newValue;
    
    if (isProtectionOn) {
      console.log("Echo: Protection Resumed.");
      refreshBlocklist(); // Re-apply rules
      chrome.action.setBadgeText({ text: "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#4DFFBC" }); // Accent Green
    } else {
      console.log("Echo: Protection Paused.");
      // Remove all dynamic rules to actually stop blocking
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ids = rules.map(r => r.id);
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ids,
          addRules: []
        });
      });
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "#8B949E" }); // Grey
    }
  }
});

// Update Initialization to respect saved state
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ isProtectionOn: true }); // Default to true
  await refreshBlocklist();
});

async function refreshBlocklist() {
  // 1. Check if protection is actually ON
  const store = await chrome.storage.local.get(['isProtectionOn']);
  if (store.isProtectionOn === false) {
      console.log("Echo: Skipping update because protection is OFF.");
      return;
  }

  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const dbRules: BlocklistRule[] = await response.json();
    console.log(`Echo: Received ${dbRules.length} rules.`);

    const metadata: Record<string, { owner: string, category: string }> = {};
    
    const dynamicRules = dbRules.map((rule) => {
      metadata[rule.domain] = { owner: rule.owner, category: rule.category };
      
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
    console.log("Echo: Rules Active.");
    
  } catch (error) {
    console.error("Echo: Sync Failed", error);
  }
}

// INTELLIGENT LOGGING
let recentLogs = new Set<string>();

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const match = info.request;
  const domain = new URL(match.url).hostname;
  
  if (recentLogs.has(domain)) return;
  recentLogs.add(domain);
  setTimeout(() => recentLogs.delete(domain), 2000);

  const store = await chrome.storage.local.get(['trackerMetadata']);
  const meta = store.trackerMetadata ? store.trackerMetadata[domain] : null;

  const event: TrackerEvent = {
    id: Date.now(),
    host: domain,
    domain: domain,
    category: meta ? meta.category : 'Unknown',
    company: meta ? meta.owner : 'Unknown',
    riskLevel: RiskLevel.WARNING,
    action: 'Blocked',
    timestamp: new Date().toISOString()
  };

  saveEvent(event);
});

async function saveEvent(newEvent: TrackerEvent) {
  const result = await chrome.storage.local.get(['detectedTrackers', 'trackersBlocked']);
  let events = result.detectedTrackers || [];
  let count = (result.trackersBlocked || 0) + 1; // Increment

  events.unshift(newEvent);
  if (events.length > 200) events = events.slice(0, 200);

  // CHANGE: Update the visual badge
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4DFFBC" }); // Your Brand Green

  await chrome.storage.local.set({
    detectedTrackers: events,
    trackersBlocked: count
  });
}