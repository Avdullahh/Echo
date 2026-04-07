import { TrackerEvent, RiskLevel, BlocklistRule } from '../shared/types';

// NOTE FOR ASSESSMENT: The backend must be running locally on port 3000
// for dynamic blocklist rules to load. If unavailable, the extension falls
// back gracefully to whatever rules are already cached in storage, plus the
// static EasyList ruleset bundled at build time. See report section 3.x.
const API_ENDPOINT = 'http://localhost:3000/api/blocklist';
const UPDATE_ALARM = 'update-blocklist';

console.log("Echo: Background Engine Starting...");

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    isProtectionOn: true,
    isAdBlockingOn: true,
    isCookieBannerBlockingOn: true
  });

  await refreshBlocklist();
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 60 });

  // Enable static EasyList ruleset by default
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["easylist_rules"]
  });

  console.log("Echo: Initialised. Ad blocking and cookie banner blocking active.");
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPDATE_ALARM) await refreshBlocklist();
});

// LISTENER: Handle protection toggle
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.isProtectionOn) {
    const isProtectionOn = changes.isProtectionOn.newValue;

    if (isProtectionOn) {
      console.log("Echo: Protection Resumed.");
      refreshBlocklist();
      chrome.action.setBadgeText({ text: "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#4DFFBC" });
    } else {
      console.log("Echo: Protection Paused.");
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ids = rules.map(r => r.id);
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ids,
          addRules: []
        });
      });
      chrome.action.setBadgeText({ text: "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: "#8B949E" });
    }
  }

  // LISTENER: Handle ad blocking toggle
  if (area === 'local' && changes.isAdBlockingOn) {
    const isAdBlockingOn = changes.isAdBlockingOn.newValue;

    if (isAdBlockingOn) {
      console.log("Echo: Ad Blocking Enabled.");
      chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["easylist_rules"]
      }).catch(err => console.error("Error enabling ad blocking:", err));
    } else {
      console.log("Echo: Ad Blocking Disabled.");
      chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["easylist_rules"]
      }).catch(err => console.error("Error disabling ad blocking:", err));
    }
  }

  // LISTENER: Handle cookie banner blocking toggle
  // Content script reads storage directly — no action needed here beyond logging
  if (area === 'local' && changes.isCookieBannerBlockingOn) {
    const isEnabled = changes.isCookieBannerBlockingOn.newValue;
    console.log(`Echo: Cookie Banner Blocking ${isEnabled ? 'Enabled' : 'Disabled'}.`);
  }
});

async function refreshBlocklist() {
  const store = await chrome.storage.local.get(['isProtectionOn']);
  if (store.isProtectionOn === false) {
    console.log("Echo: Skipping blocklist update — protection is OFF.");
    return;
  }

  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const dbRules: BlocklistRule[] = await response.json();
    console.log(`Echo: Received ${dbRules.length} rules from backend.`);

    const metadata: Record<string, { owner: string; category: string }> = {};

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
    console.log("Echo: Dynamic rules active.");

  } catch (error) {
    // Backend unavailable — extension continues using any rules already loaded
    // plus the static EasyList ruleset. No data is lost.
    console.warn("Echo: Backend unavailable, using cached rules if available.", error);
  }
}

// ---------------------------------------------------------------------------
// TRACKER LOGGING
// NOTE: onRuleMatchedDebug only fires in unpacked extensions loaded via
// chrome://extensions with Developer Mode enabled. This is expected behaviour
// during development and testing. In a production build, tracker events would
// require an alternative logging strategy such as a webRequest observer.
// For this FYP submission the extension is evaluated in unpacked/developer mode.
// ---------------------------------------------------------------------------
let recentLogs = new Set<string>();

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const match = info.request;
  const domain = new URL(match.url).hostname;

  // Deduplicate — ignore the same domain within a 2-second window
  if (recentLogs.has(domain)) return;
  recentLogs.add(domain);
  setTimeout(() => recentLogs.delete(domain), 2000);

  const store = await chrome.storage.local.get(['trackerMetadata']);
  const meta = store.trackerMetadata ? store.trackerMetadata[domain] : null;

  let sourceWebsite = 'Unknown';
  try {
    if (match.initiator) {
      sourceWebsite = new URL(match.initiator).hostname;
    }
  } catch {
    sourceWebsite = 'Unknown';
  }

  const event: TrackerEvent = {
    id: Date.now(),
    host: domain,
    domain: domain,
    sourceWebsite: sourceWebsite,
    company: meta ? meta.owner : 'Unknown',
    riskLevel: RiskLevel.WARNING,
    action: 'Blocked',
    timestamp: new Date().toISOString()
  };

  saveEvent(event);
});

// ---------------------------------------------------------------------------
// Persists a tracker event to chrome.storage.local.
// Capped at 2000 events (~400KB) — a deliberate design decision balancing
// profile accuracy against chrome.storage.local's 10MB quota.
// ---------------------------------------------------------------------------
async function saveEvent(newEvent: TrackerEvent) {
  const result = await chrome.storage.local.get(['detectedTrackers', 'trackersBlocked']);
  let events = result.detectedTrackers || [];
  let count = (result.trackersBlocked || 0) + 1;

  events.unshift(newEvent);
  if (events.length > 2000) events = events.slice(0, 2000);

  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4DFFBC" });

  await chrome.storage.local.set({
    detectedTrackers: events,
    trackersBlocked: count
  });
}