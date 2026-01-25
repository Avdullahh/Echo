/**
 * Cosmetic Ad Blocker Content Script
 * Hides ads that slip through network-level blocking
 * Uses CSS selectors and element hiding
 * Blocks pop-unders, interstitials, push ads, and video ads
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
  '[class*="popunder"]',
  '[class*="pop-under"]',

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

  // Interstitial ads (full-page overlays)
  '[class*="interstitial"]',
  '[id*="interstitial"]',
  '[class*="overlay-ad"]',
  '[class*="ad-overlay"]',
  '[class*="fullscreen-ad"]',

  // In-page push ads
  '[class*="push-notification"]',
  '[class*="web-push"]',
  '[class*="browser-notification"]',
  '[id*="push-notification"]',
  '[id*="notification-box"]',

  // Video ads (conservative - only obvious ad containers)
  '[class*="video-ad-container"]',
  '[class*="preroll-ad"]',
  '[id*="video-ad-container"]',
  '[id*="preroll-ad"]',
  '[class*="ima-ad-container"]',
  '[id*="ima-ad-container"]',

  // Banner ads (targeted - avoid breaking sites)
  '[class*="banner-ad"]',
  'div[class*="banner"][class*="ad"]',

  // Direct link ads
  'a[href*="click."]',
  'a[href*="/aff/"]',
  'a[href*="affiliate"]',
  'a[target="_blank"][href*="ad"]',

  // High z-index suspicious ads
  'div[style*="z-index: 2147483647"]',
  'div[style*="z-index: 9999999"]',

  // Common ad dimensions (standard IAB sizes)
  'iframe[width="728"][height="90"]',     // Leaderboard
  'iframe[width="300"][height="250"]',    // Medium Rectangle
  'iframe[width="160"][height="600"]',    // Wide Skyscraper
  'iframe[width="300"][height="600"]',    // Half Page
  'iframe[width="970"][height="250"]',    // Billboard
  'iframe[width="320"][height="50"]',     // Mobile Banner
  'iframe[width="468"][height="60"]'      // Full Banner
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
let popupBlockCount = 0;

/**
 * Block pop-under ads by intercepting window.open
 */
function blockPopUnders() {
  const originalOpen = window.open;
  window.open = function(...args: any[]) {
    popupBlockCount++;
    console.log('[Echo AdBlock] ✓ Blocked pop-under/popup ad');
    return null;
  } as any;
}

/**
 * Block push notification requests
 */
function blockPushNotifications() {
  // Override Notification API
  if ('Notification' in window) {
    Object.defineProperty(window, 'Notification', {
      get: function() {
        console.log('[Echo AdBlock] ✓ Blocked push notification request');
        return class {
          static permission = 'denied';
          static requestPermission() {
            return Promise.resolve('denied');
          }
        };
      }
    });
  }

  // Override Push API
  if ('PushManager' in window) {
    Object.defineProperty(window, 'PushManager', {
      get: function() {
        console.log('[Echo AdBlock] ✓ Blocked push manager access');
        return class {};
      }
    });
  }
}

/**
 * Detect and remove interstitial (full-page) ads
 */
function detectInterstitials() {
  const elements = document.querySelectorAll('div, section');

  for (const element of elements) {
    const el = element as HTMLElement;
    const style = window.getComputedStyle(el);

    // Check for full-screen overlay characteristics
    const isFullScreen = (
      (style.position === 'fixed' || style.position === 'absolute') &&
      parseInt(style.zIndex || '0') > 1000 &&
      (el.offsetWidth > window.innerWidth * 0.8 || el.offsetHeight > window.innerHeight * 0.8)
    );

    if (isFullScreen && !hiddenElements.has(el)) {
      // Check if it contains ad-related content
      const text = (el.textContent || '').toLowerCase();
      const className = (el.className || '').toString().toLowerCase();
      const id = (el.id || '').toLowerCase();

      const hasAdIndicators =
        text.includes('advertisement') ||
        text.includes('click here') ||
        className.includes('interstitial') ||
        className.includes('overlay') ||
        id.includes('interstitial') ||
        id.includes('overlay');

      if (hasAdIndicators) {
        console.log('[Echo AdBlock] ✓ Blocked interstitial ad');
        hideElement(el);
        hiddenElements.add(el);
      }
    }
  }
}

/**
 * Detect and block video ads in video players (smart detection)
 * Only blocks confirmed ad overlays, not legitimate video player elements
 */
function detectVideoAds() {
  // Only target very specific video ad containers - avoid breaking video players
  const videoAdContainers = document.querySelectorAll(
    '[class*="ima-ad-container"], [id*="ima-ad-container"], ' +
    '[class*="video-ad-container"], [id*="video-ad-container"], ' +
    '[class*="preroll-ad"], [id*="preroll-ad"]'
  );

  videoAdContainers.forEach(container => {
    const el = container as HTMLElement;
    if (hiddenElements.has(el)) return;

    const className = (el.className || '').toString().toLowerCase();
    const id = (el.id || '').toLowerCase();

    // Verify it's actually an ad container, not a video player component
    const isDefinitelyAd =
      // IMA (Google Interactive Media Ads) specific
      (className.includes('ima') && className.includes('ad')) ||
      (id.includes('ima') && id.includes('ad')) ||
      // Explicit ad container
      className.includes('video-ad-container') ||
      id.includes('video-ad-container') ||
      // Pre-roll specific
      className.includes('preroll-ad') ||
      id.includes('preroll-ad') ||
      // Common ad overlay patterns
      (className.includes('ad-overlay') && className.includes('video')) ||
      (id.includes('ad-overlay') && id.includes('video'));

    // Extra check: make sure it's not a core video player element
    const isPlayerElement =
      className.includes('player') ||
      className.includes('controls') ||
      className.includes('ui') ||
      id.includes('player') ||
      id.includes('controls');

    if (isDefinitelyAd && !isPlayerElement && isVisible(el)) {
      console.log('[Echo AdBlock] ✓ Blocked video ad:', className || id);
      hideElement(el);
      hiddenElements.add(el);
    }
  });
}

/**
 * Detect and block banner ads by dimensions and iframe characteristics
 * Smart detection to avoid breaking legitimate embeds
 */
function detectBannerAds() {
  const iframes = document.querySelectorAll('iframe');

  iframes.forEach(iframe => {
    if (hiddenElements.has(iframe)) return;

    const width = parseInt(iframe.getAttribute('width') || '0');
    const height = parseInt(iframe.getAttribute('height') || '0');
    const src = (iframe.getAttribute('src') || '').toLowerCase();
    const id = (iframe.id || '').toLowerCase();
    const name = (iframe.getAttribute('name') || '').toLowerCase();
    const title = (iframe.getAttribute('title') || '').toLowerCase();

    // Standard IAB banner sizes (exact matches only)
    const isBannerSize =
      (width === 728 && height === 90) ||   // Leaderboard
      (width === 300 && height === 250) ||  // Medium Rectangle
      (width === 160 && height === 600) ||  // Wide Skyscraper
      (width === 300 && height === 600) ||  // Half Page
      (width === 970 && height === 250) ||  // Billboard
      (width === 320 && height === 50) ||   // Mobile Banner
      (width === 468 && height === 60) ||   // Full Banner
      (width === 234 && height === 60) ||   // Half Banner
      (width === 120 && height === 600);    // Skyscraper

    // Check for ad-related attributes (more specific)
    const hasStrongAdIndicators =
      src.includes('doubleclick') ||
      src.includes('googlesyndication') ||
      src.includes('adserver') ||
      src.includes('/ads/') ||
      src.includes('ad.') ||
      title.toLowerCase() === 'advertisement' ||
      title.toLowerCase() === 'ad';

    // Weak indicators (need banner size confirmation)
    const hasWeakAdIndicators =
      id.includes('ad') ||
      id.includes('banner') ||
      name.includes('ad') ||
      name.includes('banner');

    // Only block if:
    // 1. Strong ad indicator (ad network URL) OR
    // 2. Banner size + weak indicator (size + id/name/title)
    const shouldBlock =
      hasStrongAdIndicators ||
      (isBannerSize && hasWeakAdIndicators);

    if (shouldBlock && isVisible(iframe as HTMLElement)) {
      console.log('[Echo AdBlock] ✓ Blocked banner ad iframe:', src.substring(0, 50) || id);
      hideElement(iframe as HTMLElement);
      hiddenElements.add(iframe);
    }
  });
}

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

    console.log('[Echo AdBlock] Enabled - Starting comprehensive blocking');

    // Block pop-unders and push notifications immediately
    blockPopUnders();
    blockPushNotifications();

    // Start cosmetic blocking
    hideAds();
    detectInterstitials();
    detectVideoAds();
    detectBannerAds();
    injectAdBlockStyles();
    startObserver();

    // Re-check for all ad types periodically (for delayed ads)
    setInterval(() => {
      if (isEnabled) {
        detectInterstitials();
        detectVideoAds();
        detectBannerAds();
      }
    }, 2000);
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isAdBlockingOn) {
      isEnabled = changes.isAdBlockingOn.newValue;

      if (isEnabled) {
        console.log('[Echo AdBlock] Enabled via settings');
        blockPopUnders();
        blockPushNotifications();
        hideAds();
        detectInterstitials();
        detectVideoAds();
        detectBannerAds();
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

  // Check for interstitial/overlay characteristics
  const isLargeOverlay =
    (isFixed || isAbsolute) &&
    element.offsetWidth > window.innerWidth * 0.5 &&
    element.offsetHeight > window.innerHeight * 0.5;

  // Check for push ad characteristics
  const isPushAd =
    className.includes('push') ||
    className.includes('notification') ||
    id.includes('push') ||
    id.includes('notification');

  // Check for video ad characteristics (more specific)
  const isVideoAd =
    className.includes('video-ad-container') ||
    className.includes('preroll-ad') ||
    id.includes('video-ad-container') ||
    id.includes('preroll-ad');

  // Check for banner ad characteristics (more specific)
  const isBannerAd =
    className.includes('banner-ad') ||
    (className.includes('banner') && className.includes('ad'));

  // Check for direct link ad (link to external ad network)
  const isAdLink =
    element.tagName === 'A' &&
    (element.getAttribute('href') || '').match(/click\.|\/aff\/|affiliate|ad\./i);

  // More likely to be an ad if it has multiple indicators
  let adScore = 0;
  if (className.includes('ad') && !className.includes('head') && !className.includes('read')) adScore++;
  if (id.includes('ad') && !id.includes('head') && !id.includes('read')) adScore++;
  if (hasAdAttr) adScore += 2;
  if (isAdIframe) adScore += 3;
  if (hasHighZIndex && (isFixed || isAbsolute)) adScore += 2;
  if (hasAdText) adScore++;
  if (isLargeOverlay) adScore += 2;
  if (isPushAd) adScore += 2;
  if (isVideoAd) adScore += 2;
  if (isBannerAd) adScore += 2;
  if (isAdLink) adScore += 2;

  // Higher threshold to reduce false positives
  return adScore >= 3;
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
    /* Echo Privacy - Comprehensive Cosmetic Ad Blocking */

    /* Standard display ads */
    ins.adsbygoogle,
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="/ads/"],
    iframe[id*="google_ads"],
    [class*="ad-container"]:not([class*="head"]):not([class*="read"]):not([class*="spread"]),
    [id*="ad-container"]:not([id*="head"]):not([id*="read"]),
    [data-ad],
    [data-advertisement],

    /* High z-index overlay ads */
    div[style*="z-index: 2147483647"][style*="position: fixed"],
    div[style*="z-index: 2147483647"][style*="position: absolute"],
    div[style*="z-index: 9999999"],

    /* Interstitial ads */
    [class*="interstitial"],
    [id*="interstitial"],
    [class*="overlay-ad"],
    [class*="ad-overlay"],
    [class*="fullscreen-ad"],

    /* In-page push ads */
    [class*="push-notification"]:not([class*="settings"]),
    [class*="web-push"]:not([class*="settings"]),
    [class*="browser-notification"]:not([class*="settings"]),
    [id*="push-notification"],
    [id*="notification-box"],

    /* Video ads - conservative to avoid breaking players */
    [class*="video-ad-container"],
    [class*="preroll-ad"],
    [id*="video-ad-container"],
    [id*="preroll-ad"],
    [class*="ima-ad-container"],
    [id*="ima-ad-container"],

    /* Banner ads - targeted blocking to avoid breaking sites */
    [class*="banner-ad"],
    div[class*="banner"][class*="ad"]:not([class*="cookie"]),
    aside[class*="ad"]:not([class*="side"]):not([class*="nav"]),
    iframe[src*="doubleclick"],
    iframe[src*="googlesyndication"],
    iframe[src*="adserver"],
    iframe[title="Advertisement"],
    iframe[title="ad"],

    /* Pop-under containers */
    [class*="popunder"],
    [class*="pop-under"],
    [id*="popunder"]
    {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
    }
  `;

  document.documentElement.appendChild(style);
  console.log('[Echo AdBlock] ✓ Injected comprehensive blocking styles');
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
      detectInterstitials();
      detectVideoAds();
      detectBannerAds();
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  console.log('[Echo AdBlock] ✓ Observer started (monitoring for all ad types)');
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
