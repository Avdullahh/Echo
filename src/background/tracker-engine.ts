/**
 * tracker-engine.ts
 * Responsible solely for managing declarativeNetRequest blocking rules.
 * No event logging, no badge updates, no storage reads beyond isProtectionOn.
 */

import { BlocklistRule } from '../shared/types';

const API_ENDPOINT = 'https://echo-6k19.onrender.com/api/blocklist';
const ALLOWLIST_RULE_ID_BASE = 480000;

export async function refreshBlocklist(): Promise<void> {
  const store = await chrome.storage.local.get(['isProtectionOn']);
  if (store.isProtectionOn === false) {
    console.log('Echo TrackerEngine: Skipping update — protection is OFF.');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const dbRules: BlocklistRule[] = await response.json();
    console.log(`Echo TrackerEngine: Received ${dbRules.length} rules from backend.`);

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
            chrome.declarativeNetRequest.ResourceType.PING,
            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          ],
        },
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: dynamicRules.map(r => r.id),
      addRules: dynamicRules,
    });

    await chrome.storage.local.set({ trackerMetadata: metadata });
    console.log('Echo TrackerEngine: Dynamic rules active.');

  } catch (error) {
    console.warn('Echo TrackerEngine: Backend unavailable, using cached rules.', error);
  }
}

export async function removeAllDynamicRules(): Promise<void> {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const ids = rules.map(r => r.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ids,
      addRules: [],
    });
  });
}

export async function enableAdBlocking(): Promise<void> {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ['easylist_rules'],
  });
  console.log('Echo TrackerEngine: Ad blocking enabled.');
}

export async function disableAdBlocking(): Promise<void> {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ['easylist_rules'],
  });
  console.log('Echo TrackerEngine: Ad blocking disabled.');
}

export async function allowlistSite(hostname: string): Promise<void> {
  const result = await chrome.storage.local.get(['allowlistedSites']);
  const sites: string[] = result.allowlistedSites || [];

  if (sites.includes(hostname)) return;
  sites.push(hostname);

  const ruleId = ALLOWLIST_RULE_ID_BASE + sites.indexOf(hostname);

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: ruleId,
      priority: 1000,
      action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
      condition: {
        initiatorDomains: [hostname],
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.SCRIPT,
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.PING,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        ],
      },
    }],
    removeRuleIds: [],
  });

  await chrome.storage.local.set({ allowlistedSites: sites });
  console.log(`Echo TrackerEngine: Allowlisted ${hostname}`);
}

export async function removeAllowlistedSite(hostname: string): Promise<void> {
  const result = await chrome.storage.local.get(['allowlistedSites']);
  const sites: string[] = result.allowlistedSites || [];

  const index = sites.indexOf(hostname);
  if (index === -1) return;

  const ruleId = ALLOWLIST_RULE_ID_BASE + index;

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: [],
  });

  await chrome.storage.local.set({ allowlistedSites: sites.filter(s => s !== hostname) });
  console.log(`Echo TrackerEngine: Removed allowlist for ${hostname}`);
}

export async function restoreAllowlistRules(): Promise<void> {
  const result = await chrome.storage.local.get(['allowlistedSites']);
  const sites: string[] = result.allowlistedSites || [];
  if (sites.length === 0) return;

  const rules = sites.map((hostname, index) => ({
    id: ALLOWLIST_RULE_ID_BASE + index,
    priority: 1000,
    action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
    condition: {
      initiatorDomains: [hostname],
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.SCRIPT,
        chrome.declarativeNetRequest.ResourceType.IMAGE,
        chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        chrome.declarativeNetRequest.ResourceType.PING,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
      ],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
    removeRuleIds: rules.map(r => r.id),
  });

  console.log(`Echo TrackerEngine: Restored ${sites.length} allowlist rules.`);
}