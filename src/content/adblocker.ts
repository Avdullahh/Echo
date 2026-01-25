/**
 * Cosmetic Ad Blocker Content Script
 * Hides ads that slip through network-level blocking
 * Uses CSS selectors and element hiding
 */

const AD_SELECTORS = [
  // Common ad containers
  '[class*="ad-container"]',
  '[class*="advertisement"]',
  '[class*="ad_container"]',
  '[class*="adContainer"]',
  '[id*="ad-container"]',
  '[id*="advertisement"]',
  '[id*="ad_container"]',
  '[id*="google_ads"]',
  '[id*="google-ads"]',

  // Generic ad classes
  '.ad',
  '.ads',
  '.advert',
  '.adsbygoogle',
  '.ad-banner',
  '.ad-box',
  '.ad-unit',
  '.ad-slot',
  '.ad-wrapper',
  '.ad-block',
  '.ad-frame',

  // Specific ad networks
  '[class*="doubleclick"]',
  '[class*="adsense"]',
  '[class*="adservice"]',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  '[class*="mgid"]',
  '[class*="propeller"]',

  // Display ad patterns
  'ins.adsbygoogle',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="/ads/"]',
  'iframe[src*="ad."]',
  'iframe[id*="google_ads"]',

  // Sponsored content
  '[class*="sponsored"]',
  '[data-ad]',
  '[data-advertisement]',
  '[data-google-query-id]',

  // Tier-specific (found in tiermaker)
  '[class*="ad-placement"]',
  'div[style*="z-index: 2147483647"]' // Suspicious high z-index ads
];

const AD_TEXT_PATTERNS = [
  /^ad$/i,
  /^ads$/i,
  /^advertisement$/i,
  /^sponsored$/i,
  /^promoted$/i
];

let isEnabled = false;
let observer: MutationObserver | null = null;
const hiddenElements = new WeakSet<Element>();

/**
 * Initialize ad blocker
 */
function init() {
  console.log('[Echo AdBlock] Cosmetic blocker initializing...');

  // Check if feature is enabled
  chrome.storage.local.get(['isAdBlockingOn'], (result) => {
    isEnabled = result.isAdBlockingOn !== false;

    if (!isEnabled) {
      console.log('[Echo AdBlock] Disabled via settings');
      return;
    }

    console.log('[Echo AdBlock] Enabled - Starting cosmetic blocking');
    hideAds();
    injectAdBlockStyles();
    startObserver();
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isAdBlockingOn) {
      isEnabled = changes.isAdBlockingOn.newValue;

      if (isEnabled) {
        console.log('[Echo AdBlock] Enabled via settings');
        hideAds();
        injectAdBlockStyles();
        startObserver();
      } else {
        console.log('[Echo AdBlock] Disabled via settings');
        stopObserver();
      }
    }
  });
}

/**
 * Hide ads using selectors
 */
function hideAds() {
  if (!isEnabled) return;

  let hiddenCount = 0;

  for (const selector of AD_SELECTORS) {
    try {
      const elements = document.querySelectorAll(selector);

      elements.forEach((element) => {
        if (!hiddenElements.has(element) && isVisible(element as HTMLElement)) {
          // Double-check it looks like an ad
          if (looksLikeAd(element as HTMLElement)) {
            hideElement(element as HTMLElement);
            hiddenElements.add(element);
            hiddenCount++;
          }
        }
      });
    } catch (e) {
      // Invalid selector
    }
  }

  if (hiddenCount > 0) {
    console.log(`[Echo AdBlock] ✓ Hid ${hiddenCount} ads cosmetically`);
  }
}

/**
 * Check if element looks like an ad
 */
function looksLikeAd(element: HTMLElement): boolean {
  // Check element properties
  const className = (element.className || '').toString().toLowerCase();
  const id = (element.id || '').toLowerCase();
  const text = (element.textContent || '').toLowerCase().trim();

  // Check for ad-related attributes
  const hasAdAttr =
    element.hasAttribute('data-ad') ||
    element.hasAttribute('data-advertisement') ||
    element.hasAttribute('data-google-query-id') ||
    element.hasAttribute('data-ad-slot');

  // Check for ad iframes
  const isAdIframe =
    element.tagName === 'IFRAME' &&
    (element.getAttribute('src') || '').toLowerCase().includes('ad');

  // Check for suspicious styling (common in overlay ads)
  const style = window.getComputedStyle(element);
  const hasHighZIndex = parseInt(style.zIndex || '0') > 1000000;
  const isFixed = style.position === 'fixed';
  const isAbsolute = style.position === 'absolute';

  // Check text patterns
  const hasAdText = AD_TEXT_PATTERNS.some(pattern => pattern.test(text));

  // More likely to be an ad if it has multiple indicators
  let adScore = 0;
  if (className.includes('ad')) adScore++;
  if (id.includes('ad')) adScore++;
  if (hasAdAttr) adScore += 2;
  if (isAdIframe) adScore += 3;
  if (hasHighZIndex && (isFixed || isAbsolute)) adScore += 2;
  if (hasAdText) adScore++;

  return adScore >= 2;
}

/**
 * Hide an element (remove from DOM)
 */
function hideElement(element: HTMLElement) {
  try {
    element.remove();
    console.log(`[Echo AdBlock] Removed ad:`, element.className || element.id);
  } catch (e) {
    // Fallback to CSS hiding
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
  }
}

/**
 * Inject CSS rules to hide common ad elements
 */
function injectAdBlockStyles() {
  if (document.getElementById('echo-adblock-styles')) return;

  const style = document.createElement('style');
  style.id = 'echo-adblock-styles';
  style.textContent = `
    /* Echo Privacy - Cosmetic Ad Blocking */
    ins.adsbygoogle,
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="/ads/"],
    iframe[id*="google_ads"],
    [class*="ad-container"]:not([class*="head"]):not([class*="read"]):not([class*="spread"]),
    [id*="ad-container"]:not([id*="head"]):not([id*="read"]),
    [data-ad],
    [data-advertisement],
    div[style*="z-index: 2147483647"][style*="position: fixed"],
    div[style*="z-index: 2147483647"][style*="position: absolute"]
    {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
    }
  `;

  document.documentElement.appendChild(style);
  console.log('[Echo AdBlock] ✓ Injected cosmetic blocking styles');
}

/**
 * Check if element is visible
 */
function isVisible(element: HTMLElement): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         parseFloat(style.opacity) > 0 &&
         rect.height > 0 &&
         rect.width > 0;
}

/**
 * Start mutation observer for dynamic ads
 */
function startObserver() {
  if (observer || !isEnabled) return;

  let debounceTimer: number | null = null;

  observer = new MutationObserver(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      hideAds();
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  console.log('[Echo AdBlock] ✓ Observer started');
}

/**
 * Stop mutation observer
 */
function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('[Echo AdBlock] Observer stopped');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also run on URL changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('[Echo AdBlock] URL changed, re-checking for ads');
    setTimeout(() => hideAds(), 500);
  }
}).observe(document, { subtree: true, childList: true });
