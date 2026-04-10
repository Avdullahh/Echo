/**
 * background/index.ts
 * Orchestrator only — wires together tracker-engine, event-logger,
 * and badge-manager. Contains no business logic itself.
 */

import { TrackerEvent, RiskLevel } from '../shared/types';
import {
  refreshBlocklist,
  removeAllDynamicRules,
  enableAdBlocking,
  disableAdBlocking,
  restoreAllowlistRules,
  allowlistSite,
  removeAllowlistedSite,
} from './tracker-engine';
import { isDuplicate, logTrackerEvent } from './event-logger';
import { setBadgeOn, setBadgeOff } from './badge-manager';

const UPDATE_ALARM = 'update-blocklist';

console.log('Echo: Background Engine Starting...');

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    isProtectionOn: true,
    isAdBlockingOn: true,
    isCookieBannerBlockingOn: true,
  });

  await refreshBlocklist();
  await restoreAllowlistRules();
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 60 });
  await enableAdBlocking();

  console.log('Echo: Initialised. Ad blocking and cookie banner blocking active.');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === UPDATE_ALARM) await refreshBlocklist();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.isProtectionOn) {
    const isOn = changes.isProtectionOn.newValue;
    if (isOn) {
      console.log('Echo: Protection Resumed.');
      // Re-enable static ruleset first, then restore dynamic rules
      enableAdBlocking().then(() => {
        refreshBlocklist().then(() => restoreAllowlistRules());
      });
      setBadgeOn();
    } else {
      console.log('Echo: Protection Paused.');
      // Remove dynamic rules AND disable static ruleset
      removeAllDynamicRules();
      disableAdBlocking();
      setBadgeOff();
    }
  }

  if (changes.isAdBlockingOn) {
    changes.isAdBlockingOn.newValue ? enableAdBlocking() : disableAdBlocking();
  }

  if (changes.isCookieBannerBlockingOn) {
    const isEnabled = changes.isCookieBannerBlockingOn.newValue;
    console.log(`Echo: Cookie Banner Blocking ${isEnabled ? 'Enabled' : 'Disabled'}.`);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === 'ADD_ALLOWLIST') {
    allowlistSite(message.hostname)
      .then(() => sendResponse({ success: true }))
      .catch((err: Error) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'REMOVE_ALLOWLIST') {
    removeAllowlistedSite(message.hostname)
      .then(() => sendResponse({ success: true }))
      .catch((err: Error) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'COOKIE_BANNER_DETECTED') {
    const tabId = _sender.tab?.id;
    if (!tabId) { sendResponse({ success: false }); return true; }

    chrome.storage.local.get(['cookieBannerState'], (result) => {
      const state = result.cookieBannerState || {};
      state[tabId] = {
        hostname: message.hostname,
        analysis: message.analysis,
        detectedAt: new Date().toISOString(),
        resolved: false,
      };
      chrome.storage.local.set({ cookieBannerState: state }, () => {
        chrome.action.setBadgeText({ text: '!', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#F59E0B', tabId });
        console.log(`Echo: Cookie banner detected on ${message.hostname}`);
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'COOKIE_EXECUTE_PREFERENCE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) { sendResponse({ success: false }); return; }

      const { preference, hostname } = message;

      chrome.storage.local.get(['cookiePreferences'], (result) => {
        const prefs = result.cookiePreferences || {};
        prefs[hostname] = preference;
        chrome.storage.local.set({ cookiePreferences: prefs }, () => {
          console.log(`Echo: Cookie preference saved for ${hostname}: ${preference}`);
        });
      });

      chrome.action.setBadgeText({ text: '', tabId: activeTabId });

      chrome.storage.local.get(['cookieBannerState'], (result) => {
        const state = result.cookieBannerState || {};
        if (state[activeTabId]) {
          state[activeTabId].resolved = true;
          chrome.storage.local.set({ cookieBannerState: state });
        }
      });

      chrome.tabs.sendMessage(activeTabId, {
        type: 'COOKIE_EXECUTE_PREFERENCE',
        preference,
      }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'COOKIE_BANNER_RESOLVED') {
    const tabId = _sender.tab?.id;
    if (!tabId) { sendResponse({ success: false }); return true; }

    chrome.storage.local.get(['cookieBannerState'], (result) => {
      const state = result.cookieBannerState || {};
      if (state[tabId]) {
        state[tabId].resolved = true;
        chrome.storage.local.set({ cookieBannerState: state });
      }
      chrome.action.setBadgeText({ text: '', tabId });
      sendResponse({ success: true });
    });
    return true;
  }
});

// NOTE: onRuleMatchedDebug only fires in unpacked extensions with Developer
// Mode enabled. Expected for FYP evaluation — see report section 3.x.
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const match = info.request;
  const domain = new URL(match.url).hostname;

  if (isDuplicate(domain)) return;

  const store = await chrome.storage.local.get(['trackerMetadata']);
  const meta = store.trackerMetadata?.[domain] ?? null;

  let sourceWebsite = 'Unknown';
  try {
    if (match.initiator) sourceWebsite = new URL(match.initiator).hostname;
  } catch {
    sourceWebsite = 'Unknown';
  }

  const event: TrackerEvent = {
    id: Date.now(),
    domain,
    sourceWebsite,
    company: meta?.owner ?? 'Unknown',
    riskLevel: RiskLevel.WARNING,
    action: 'Blocked',
    timestamp: new Date().toISOString(),
  };

  await logTrackerEvent(event);
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const match = info.request;
  const domain = new URL(match.url).hostname;

  if (isDuplicate(domain)) return;

  const store = await chrome.storage.local.get(['trackerMetadata']);
  const meta = store.trackerMetadata?.[domain] ?? null;

  let sourceWebsite = 'Unknown';
  try {
    if (match.initiator) sourceWebsite = new URL(match.initiator).hostname;
  } catch {
    sourceWebsite = 'Unknown';
  }

  // Check if this was matched by an allowlist rule (ID >= 480000)
  const isAllowlisted = info.rule.ruleId >= 480000;

  const event: TrackerEvent = {
    id: Date.now(),
    domain,
    sourceWebsite,
    company: meta?.owner ?? 'Unknown',
    riskLevel: isAllowlisted ? RiskLevel.SAFE : RiskLevel.WARNING,
    action: isAllowlisted ? 'Allowed' : 'Blocked',
    timestamp: new Date().toISOString(),
  };

  await logTrackerEvent(event);
});