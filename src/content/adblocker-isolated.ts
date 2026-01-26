/**
 * Echo Privacy - Ad Blocker (ISOLATED World)
 *
 * This script runs in Chrome's isolated content script world
 * It CAN access chrome.* APIs but cannot directly intercept page JavaScript
 *
 * Features:
 * - CSS-based ad hiding
 * - Settings management via chrome.storage
 * - Shadow DOM ad hiding
 */

// ===========================================
// CSS RULES FOR AD HIDING
// ===========================================

const AD_BLOCK_CSS = `
/* Echo Privacy - Cosmetic Ad Blocking */

/* Google Ads */
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

/* Common ad containers */
[class*="ad-container"]:not([class*="head"]):not([class*="read"]):not([class*="thread"]),
[id*="ad-container"]:not([id*="head"]):not([id*="read"]),
[class*="advertisement"],
[data-ad],
[data-ad-slot],
[data-google-query-id] {
  display: none !important;
}

/* Ad networks */
[class*="taboola"],
[class*="outbrain"],
[class*="revcontent"],
[class*="mgid"],
[class*="sponsored-content"],
[class*="native-ad"] {
  display: none !important;
}

/* Interstitials & overlays */
[class*="interstitial"],
[id*="interstitial"],
[class*="overlay-ad"],
[class*="ad-overlay"],
[class*="fullscreen-ad"],
[class*="modal-ad"],
[class*="popup-ad"] {
  display: none !important;
}

/* Push notifications */
[class*="push-notification"]:not([class*="settings"]),
[class*="web-push"]:not([class*="settings"]),
#onesignal-bell-container,
#onesignal-slidedown-container,
[class*="onesignal"],
.notifyjs-corner {
  display: none !important;
}

/* FOMO notifications */
.fomo-notification,
[class*="fomo-notification"],
[class*="sales-pop"],
[class*="recent-sales"],
[class*="proof-notification"] {
  display: none !important;
}

/* Video ads */
[class*="video-ad"],
[class*="preroll-ad"],
[class*="ima-ad-container"],
.ytp-ad-module,
.ytp-ad-overlay-container {
  display: none !important;
}

/* Banner ads */
[class*="banner-ad"],
[id*="banner-ad"],
iframe[src*="doubleclick"],
iframe[src*="googlesyndication"],
iframe[src*="googleadservices"] {
  display: none !important;
}

/* High z-index overlays (likely ads) */
div[style*="z-index: 2147483647"],
div[style*="z-index: 9999999"] {
  display: none !important;
}

/* Standard IAB banner sizes */
iframe[width="728"][height="90"],
iframe[width="300"][height="250"],
iframe[width="160"][height="600"],
iframe[width="300"][height="600"],
iframe[width="970"][height="250"],
iframe[width="320"][height="50"] {
  display: none !important;
}

/* Sponsored content - reduce visibility */
.sponsored-post,
.promoted-content,
.promoted-post,
.partner-content {
  opacity: 0.3 !important;
}

/* Newsletter/subscription popups */
[class*="newsletter-popup"],
[class*="subscribe-popup"],
[class*="subscription-popup"],
[id*="newsletter-popup"] {
  display: none !important;
}
`;

// ===========================================
// STATE
// ===========================================

let isEnabled = true;

// ===========================================
// CSS INJECTION
// ===========================================

function injectStyles(): void {
  if (document.getElementById('echo-adblock-styles')) return;

  const style = document.createElement('style');
  style.id = 'echo-adblock-styles';
  style.textContent = AD_BLOCK_CSS;

  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
    console.log('[Echo AdBlock] ISOLATED: Injected CSS rules');
  }
}

function removeStyles(): void {
  const style = document.getElementById('echo-adblock-styles');
  if (style) {
    style.remove();
    console.log('[Echo AdBlock] ISOLATED: Removed CSS rules');
  }
}

// ===========================================
// SHADOW DOM HANDLING
// ===========================================

const adSelectors = [
  '[class*="ad-container"]',
  '[class*="advertisement"]',
  '[class*="adsbygoogle"]',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  '[class*="sponsored"]'
];

function hideAdsInShadowDOM(): void {
  if (!isEnabled) return;

  const processNode = (node: Element): void => {
    if (node.shadowRoot) {
      // Inject styles into shadow root
      if (!node.shadowRoot.querySelector('#echo-shadow-styles')) {
        const style = document.createElement('style');
        style.id = 'echo-shadow-styles';
        style.textContent = AD_BLOCK_CSS;
        node.shadowRoot.appendChild(style);
      }

      // Hide ad elements
      adSelectors.forEach(selector => {
        try {
          node.shadowRoot!.querySelectorAll(selector).forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        } catch (e) {
          // Selector may be invalid
        }
      });

      // Recursively process shadow root children
      node.shadowRoot.querySelectorAll('*').forEach(processNode);
    }
  };

  document.querySelectorAll('*').forEach(processNode);
}

// ===========================================
// INITIALIZATION
// ===========================================

function init(): void {
  console.log('[Echo AdBlock] ISOLATED world script initializing...');

  // Check if enabled in settings
  chrome.storage.local.get(['isAdBlockingOn'], (result) => {
    isEnabled = result.isAdBlockingOn !== false;

    if (!isEnabled) {
      console.log('[Echo AdBlock] ISOLATED: Disabled via settings');
      return;
    }

    // Inject CSS rules
    injectStyles();

    // Handle Shadow DOM (run after DOM is ready)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        hideAdsInShadowDOM();
      });
    } else {
      hideAdsInShadowDOM();
    }

    // Periodic Shadow DOM check (for dynamically created shadow roots)
    setInterval(hideAdsInShadowDOM, 2000);

    console.log('[Echo AdBlock] ISOLATED: CSS blocking active');
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isAdBlockingOn) {
      const newValue = changes.isAdBlockingOn.newValue;
      isEnabled = newValue !== false;

      if (isEnabled) {
        console.log('[Echo AdBlock] ISOLATED: Enabled via settings');
        injectStyles();
        hideAdsInShadowDOM();
      } else {
        console.log('[Echo AdBlock] ISOLATED: Disabled via settings');
        removeStyles();
      }
    }
  });
}

// Run immediately
init();
