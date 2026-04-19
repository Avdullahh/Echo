/**
 * badge-manager.ts
 * Responsible solely for updating the extension's action icon and badge.
 * No storage reads, no rule management — pure badge/icon control.
 */

export function setBadgeCount(count: number): void {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4DFFBC' });
  }
  
  export function setBadgeOn(): void {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4DFFBC' });
  }
  
  export function setBadgeOff(): void {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#8B949E' });
  }
  
  export function clearBadge(): void {
    chrome.action.setBadgeText({ text: '' });
  }

  