/**
 * Echo Privacy - Ad Blocker (ISOLATED World)
 * Runs in Chrome's isolated content script world.
 * Checks both isProtectionOn AND isAdBlockingOn before injecting.
 * Responds to storage changes to enable/disable without page reload.
 */

// ---------------------------------------------------------------------------
// CSS — deliberately conservative to avoid breaking legitimate site UI
// Removed: data-google-query-id (matches Outlook), high z-index rules
// (matches dropdowns), generic overlay rules (matches modals)
// ---------------------------------------------------------------------------
const AD_BLOCK_CSS = `
/* Google Ads — specific IDs only */
ins.adsbygoogle,
[id*="google_ads"],
[id*="div-gpt-ad"],
div[id^="google_ads_"],
div[id^="div-gpt-"],
.adsbygoogle {
  display: none !important;
  height: 0 !important;
  width: 0 !important;
}

/* Common ad containers — with exclusions to protect site UI */
[class*="ad-container"]:not([class*="head"]):not([class*="read"]):not([class*="thread"]):not([class*="upload"]):not([class*="download"]):not([class*="spread"]),
[id*="ad-container"]:not([id*="head"]):not([id*="read"]):not([id*="upload"]):not([id*="download"]),
[class*="advertisement"]:not([class*="manage"]):not([class*="settings"]) {
  display: none !important;
}

/* Ad networks — named networks only, not generic class fragments */
[class*="taboola-widget"],
[class*="outbrain-widget"],
[class*="revcontent-widget"],
[class*="mgid-widget"],
[class*="native-ad-widget"] {
  display: none !important;
}

/* Video ads — specific containers */
[class*="video-ad-overlay"],
[class*="preroll-ad"],
[class*="ima-ad-container"],
.ytp-ad-module,
.ytp-ad-overlay-container {
  display: none !important;
}

/* Banner ads — specific iframe sources only */
iframe[src*="doubleclick.net/"],
iframe[src*="googlesyndication.com/"],
iframe[src*="googleadservices.com/"] {
  display: none !important;
}

/* Standard IAB banner sizes — only exact iframe dimensions */
iframe[width="728"][height="90"],
iframe[width="300"][height="250"],
iframe[width="160"][height="600"],
iframe[width="300"][height="600"],
iframe[width="970"][height="250"],
iframe[width="320"][height="50"] {
  display: none !important;
}

/* FOMO / social proof popups */
.fomo-notification,
[class*="fomo-notification"],
[class*="sales-pop"],
[class*="recent-sales"],
[class*="proof-notification"] {
  display: none !important;
}

/* Push notification prompts — not browser native ones */
#onesignal-bell-container,
#onesignal-slidedown-container,
[class*="onesignal"],
.notifyjs-corner {
  display: none !important;
}

/* Sponsored content */
.sponsored-post,
.promoted-post {
  opacity: 0.3 !important;
}

/* Newsletter popups */
[class*="newsletter-popup"],
[class*="subscribe-popup"],
[id*="newsletter-popup"] {
  display: none !important;
}
`;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let isEnabled = false;

// ---------------------------------------------------------------------------
// Style injection / removal
// ---------------------------------------------------------------------------
function injectStyles(): void {
  if (document.getElementById('echo-adblock-styles')) return;
  const style = document.createElement('style');
  style.id = 'echo-adblock-styles';
  style.textContent = AD_BLOCK_CSS;
  (document.head || document.documentElement)?.appendChild(style);
  console.log('[Echo AdBlock] CSS rules injected');
}

function removeStyles(): void {
  ['echo-adblock-styles', 'echo-cosmetic-generic', 'echo-cosmetic-domain'].forEach(id => {
    document.getElementById(id)?.remove();
  });
  console.log('[Echo AdBlock] CSS rules removed');
}

// ---------------------------------------------------------------------------
// Generated cosmetic rules
// ---------------------------------------------------------------------------
async function loadGeneratedCSS(): Promise<void> {
  if (document.getElementById('echo-cosmetic-generic')) return;
  try {
    const response = await fetch(chrome.runtime.getURL('rules/cosmetic-generic.css'));
    if (!response.ok) return;
    const css = await response.text();
    const style = document.createElement('style');
    style.id = 'echo-cosmetic-generic';
    style.textContent = css;
    (document.head || document.documentElement)?.appendChild(style);
  } catch {
    // Silently fail — hardcoded rules are active as fallback
  }
}

let domainRulesCache: Record<string, string[]> | null = null;

async function applyDomainRules(): Promise<void> {
  if (document.getElementById('echo-cosmetic-domain')) return;
  try {
    if (!domainRulesCache) {
      const response = await fetch(chrome.runtime.getURL('rules/cosmetic-domains.json'));
      if (!response.ok) return;
      domainRulesCache = await response.json();
    }
    const hostname = window.location.hostname.toLowerCase();
    const selectors: string[] = [];
    const parts = hostname.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const domain = parts.slice(i).join('.');
      if (domainRulesCache![domain]) selectors.push(...domainRulesCache![domain]);
    }
    if (selectors.length === 0) return;
    const css = [...new Set(selectors)].join(',\n') + ' {\n  display: none !important;\n}';
    const style = document.createElement('style');
    style.id = 'echo-cosmetic-domain';
    style.textContent = css;
    (document.head || document.documentElement)?.appendChild(style);
  } catch {
    // Silently fail
  }
}

// ---------------------------------------------------------------------------
// Shadow DOM
// ---------------------------------------------------------------------------
const AD_SELECTORS = [
  'ins.adsbygoogle',
  '[id*="google_ads"]',
  '[class*="taboola-widget"]',
  '[class*="outbrain-widget"]',
];

function hideAdsInShadowDOM(): void {
  if (!isEnabled) return;
  document.querySelectorAll('*').forEach((node) => {
    if (node.shadowRoot && !node.shadowRoot.querySelector('#echo-shadow-styles')) {
      const style = document.createElement('style');
      style.id = 'echo-shadow-styles';
      style.textContent = AD_BLOCK_CSS;
      node.shadowRoot.appendChild(style);
    }
  });
}

// ---------------------------------------------------------------------------
// Send signal to MAIN world script
// ---------------------------------------------------------------------------
function signalMainWorld(enabled: boolean): void {
  window.postMessage({
    type: enabled ? 'ECHO_ENABLE_BLOCKING' : 'ECHO_DISABLE_BLOCKING'
  }, '*');
}

// ---------------------------------------------------------------------------
// Enable / disable blocking
// ---------------------------------------------------------------------------
function enableBlocking(): void {
  isEnabled = true;
  injectStyles();
  loadGeneratedCSS().catch(() => {});
  applyDomainRules().catch(() => {});
  hideAdsInShadowDOM();
  signalMainWorld(true);
  console.log('[Echo AdBlock] Blocking enabled');
}

function disableBlocking(): void {
  isEnabled = false;
  removeStyles();
  document.querySelectorAll('#echo-shadow-styles').forEach(el => el.remove());
  signalMainWorld(false);
  console.log('[Echo AdBlock] Blocking disabled');
}

// ---------------------------------------------------------------------------
// Initialisation — single entry point, single storage check
// ---------------------------------------------------------------------------
function init(): void {
  chrome.storage.local.get(
    ['isProtectionOn', 'isAdBlockingOn', 'allowlistedSites'],
    (result) => {
      const protectionOn = result.isProtectionOn !== false;
      const adBlockingOn = result.isAdBlockingOn !== false;
      const allowlistedSites: string[] = result.allowlistedSites || [];
      const currentHost = window.location.hostname;
      const isSiteAllowlisted = allowlistedSites.some(site =>
        currentHost === site || currentHost.endsWith('.' + site)
      );

      if (protectionOn && adBlockingOn && !isSiteAllowlisted) {
        enableBlocking();
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', hideAdsInShadowDOM);
        }
        setInterval(hideAdsInShadowDOM, 2000);
      } else {
        const reason = !protectionOn ? 'protection off'
          : !adBlockingOn ? 'ad blocking off'
          : 'site is allowlisted';
        console.log(`[Echo AdBlock] Disabled on init — ${reason}`);
        signalMainWorld(false);
      }
    }
  );

  // Single unified storage listener
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!changes.isProtectionOn && !changes.isAdBlockingOn && !changes.allowlistedSites) return;

    chrome.storage.local.get(
      ['isProtectionOn', 'isAdBlockingOn', 'allowlistedSites'],
      (result) => {
        const protectionOn = result.isProtectionOn !== false;
        const adBlockingOn = result.isAdBlockingOn !== false;
        const allowlistedSites: string[] = result.allowlistedSites || [];
        const currentHost = window.location.hostname;
        const isSiteAllowlisted = allowlistedSites.some(site =>
          currentHost === site || currentHost.endsWith('.' + site)
        );

        const shouldBlock = protectionOn && adBlockingOn && !isSiteAllowlisted;
        if (shouldBlock) {
          enableBlocking();
        } else {
          disableBlocking();
        }
      }
    );
  });
}

init();