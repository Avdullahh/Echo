/**
 * Cookie Banner Auto-Handler Content Script
 * Detects and intelligently handles cookie consent dialogs
 * Priority: Accept Necessary Only > Reject All > Hide Banner (LAST RESORT)
 */

import {
  COOKIE_BANNER_SELECTORS,
  NECESSARY_ONLY_PATTERNS,
  ACCEPT_ALL_PATTERNS,
  SETTINGS_PATTERNS,
  OVERLAY_SELECTORS
} from './cookie-filters';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 800; // ms
const INITIAL_DELAY = 1500; // Wait for page to load
const handled = new Set<Element>();
let observer: MutationObserver | null = null;
let isEnabled = false;
let attemptCount = 0;

/**
 * Initialize cookie banner detection
 */
function init() {
  console.log('[Echo Cookie] Initializing...');

  // Check if feature is enabled
  chrome.storage.local.get(['isCookieBannerBlockingOn'], (result) => {
    isEnabled = result.isCookieBannerBlockingOn !== false;

    if (!isEnabled) {
      console.log('[Echo Cookie] Disabled via settings');
      return;
    }

    console.log('[Echo Cookie] Enabled - Starting detection');

    // Wait for page to load, then start detection
    setTimeout(() => {
      detectAndHandleBanners();
      startObserver();
    }, INITIAL_DELAY);
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isCookieBannerBlockingOn) {
      isEnabled = changes.isCookieBannerBlockingOn.newValue;

      if (isEnabled) {
        console.log('[Echo Cookie] Enabled via settings');
        detectAndHandleBanners();
        startObserver();
      } else {
        console.log('[Echo Cookie] Disabled via settings');
        stopObserver();
      }
    }
  });
}

/**
 * Detect and handle all visible cookie banners
 */
function detectAndHandleBanners() {
  if (!isEnabled) return;

  let foundAny = false;

  for (const selector of COOKIE_BANNER_SELECTORS) {
    try {
      const banners = document.querySelectorAll(selector);

      banners.forEach((banner) => {
        if (!handled.has(banner) && isVisible(banner as HTMLElement)) {
          console.log(`[Echo Cookie] Banner detected: ${selector}`);
          foundAny = true;
          handleCookieBanner(banner as HTMLElement);
          handled.add(banner);
        }
      });
    } catch (e) {
      // Invalid selector, skip
    }
  }

  // If we didn't find anything with selectors, do a text-based search
  if (!foundAny && attemptCount < MAX_RETRY_ATTEMPTS) {
    attemptCount++;
    setTimeout(() => {
      searchForBannersInDocument();
    }, RETRY_DELAY);
  }
}

/**
 * Search entire document for cookie-related text
 */
function searchForBannersInDocument() {
  const allElements = document.querySelectorAll('div, section, aside, [role="dialog"], [role="banner"]');

  for (const element of allElements) {
    const text = (element.textContent || '').toLowerCase();

    // Look for cookie-related keywords
    if ((text.includes('cookie') || text.includes('consent') || text.includes('privacy')) &&
        text.length > 50 && text.length < 2000 &&
        isVisible(element as HTMLElement) &&
        !handled.has(element)) {

      console.log('[Echo Cookie] Found potential banner via text search');
      handleCookieBanner(element as HTMLElement);
      handled.add(element);
      break; // Only handle one at a time
    }
  }
}

/**
 * Handle a single cookie banner with aggressive clicking
 */
function handleCookieBanner(banner: HTMLElement, attempt = 1) {
  console.log(`[Echo Cookie] Handling banner (attempt ${attempt})`, banner.id || banner.className);

  // Priority 1: Find and click "Necessary Only" or "Reject All" button
  const necessaryButton = findButtonInContainer(banner, NECESSARY_ONLY_PATTERNS);
  if (necessaryButton) {
    console.log('[Echo Cookie] ✓ Found "Necessary Only/Reject All" → Clicking');
    clickButton(necessaryButton);

    // Wait and verify banner is gone
    setTimeout(() => {
      if (isVisible(banner)) {
        console.log('[Echo Cookie] Banner still visible after click, retrying...');
        if (attempt < MAX_RETRY_ATTEMPTS) {
          handleCookieBanner(banner, attempt + 1);
        } else {
          console.log('[Echo Cookie] Max retries reached → Hiding banner');
          hideBanner(banner);
        }
      } else {
        console.log('[Echo Cookie] ✓ Banner dismissed successfully');
      }
    }, RETRY_DELAY);
    return;
  }

  // Priority 2: Try to find settings button to access necessary-only
  const settingsButton = findButtonInContainer(banner, SETTINGS_PATTERNS);
  if (settingsButton && attempt === 1) {
    console.log('[Echo Cookie] Found settings button → Opening');
    clickButton(settingsButton);

    // Wait for settings panel to appear, then look for necessary-only
    setTimeout(() => {
      const necessaryInPanel = findButtonInContainer(document.body, NECESSARY_ONLY_PATTERNS);
      if (necessaryInPanel) {
        console.log('[Echo Cookie] ✓ Found "Necessary Only" in settings → Clicking');
        clickButton(necessaryInPanel);
      } else {
        // Look for a save/confirm button after potentially deselecting options
        const saveButton = findButtonInContainer(document.body, [/save|confirm|continue/i]);
        if (saveButton) {
          console.log('[Echo Cookie] Found save button → Clicking');
          clickButton(saveButton);
        } else {
          console.log('[Echo Cookie] No necessary-only option found → Hiding');
          hideBanner(banner);
        }
      }
    }, RETRY_DELAY * 2);
    return;
  }

  // Priority 3: DON'T click "Accept All" - just hide
  const acceptAllButton = findButtonInContainer(banner, ACCEPT_ALL_PATTERNS);
  if (acceptAllButton) {
    console.log('[Echo Cookie] ⚠ Only "Accept All" found → Hiding banner (NOT clicking)');
    hideBanner(banner);
    return;
  }

  // Priority 4: No recognizable buttons - hide as last resort
  if (attempt >= 2) {
    console.log('[Echo Cookie] No buttons found after retries → Hiding banner');
    hideBanner(banner);
  } else {
    // Retry in case buttons haven't rendered yet
    setTimeout(() => {
      handleCookieBanner(banner, attempt + 1);
    }, RETRY_DELAY);
  }
}

/**
 * Find button matching patterns in container and all nested elements
 */
function findButtonInContainer(container: HTMLElement | Document, patterns: RegExp[]): HTMLElement | null {
  // Search for buttons, links, and clickable elements
  const selectors = [
    'button',
    'a[role="button"]',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    '[onclick]',
    '.button',
    '[class*="button"]',
    '[class*="btn"]'
  ];

  for (const selector of selectors) {
    try {
      const elements = container.querySelectorAll(selector);

      for (const element of elements) {
        if (!isVisible(element as HTMLElement)) continue;

        // Get all possible text sources
        const texts = [
          element.textContent,
          (element as HTMLElement).innerText,
          element.getAttribute('aria-label'),
          element.getAttribute('title'),
          element.getAttribute('value'),
          element.getAttribute('alt')
        ].filter(Boolean).map(t => (t || '').trim());

        for (const text of texts) {
          for (const pattern of patterns) {
            if (pattern.test(text)) {
              console.log(`[Echo Cookie] Button match: "${text.substring(0, 50)}"`);
              return element as HTMLElement;
            }
          }
        }
      }
    } catch (e) {
      // Invalid selector
    }
  }

  return null;
}

/**
 * Click a button with multiple methods for compatibility
 */
function clickButton(button: HTMLElement) {
  try {
    console.log(`[Echo Cookie] Clicking button: "${(button.textContent || '').substring(0, 50)}"`);

    // Method 1: Focus and click
    button.focus();
    button.click();

    // Method 2: Mouse events
    const mouseEvents = ['mousedown', 'mouseup', 'click'];
    mouseEvents.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      });
      button.dispatchEvent(event);
    });

    // Method 3: Pointer events (for modern frameworks)
    const pointerEvent = new PointerEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(pointerEvent);

    console.log('[Echo Cookie] ✓ Click dispatched');
  } catch (error) {
    console.error('[Echo Cookie] Error clicking button:', error);
  }
}

/**
 * Hide cookie banner and overlay (LAST RESORT)
 */
function hideBanner(banner: HTMLElement) {
  try {
    console.log('[Echo Cookie] Hiding banner (last resort)');

    // Hide the banner itself
    banner.style.setProperty('display', 'none', 'important');
    banner.style.setProperty('visibility', 'hidden', 'important');
    banner.style.setProperty('opacity', '0', 'important');
    banner.style.setProperty('pointer-events', 'none', 'important');
    banner.style.setProperty('z-index', '-9999', 'important');
    banner.remove(); // Remove from DOM entirely

    // Hide overlays/backdrops
    for (const selector of OVERLAY_SELECTORS) {
      try {
        const overlays = document.querySelectorAll(selector);
        overlays.forEach((overlay) => {
          (overlay as HTMLElement).style.setProperty('display', 'none', 'important');
          (overlay as HTMLElement).remove();
        });
      } catch (e) {
        // Invalid selector
      }
    }

    // Restore body scroll
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.documentElement.style.overflow === 'hidden') {
      document.documentElement.style.overflow = '';
    }

    // Remove any overflow:hidden from body classes
    document.body.classList.forEach(cls => {
      if (cls.includes('no-scroll') || cls.includes('overflow')) {
        document.body.classList.remove(cls);
      }
    });

    console.log('[Echo Cookie] ✓ Banner hidden');
  } catch (error) {
    console.error('[Echo Cookie] Error hiding banner:', error);
  }
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
 * Start mutation observer for dynamic banners
 */
function startObserver() {
  if (observer || !isEnabled) return;

  let debounceTimer: number | null = null;

  observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive checks
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      detectAndHandleBanners();
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });

  console.log('[Echo Cookie] ✓ Observer started');
}

/**
 * Stop mutation observer
 */
function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('[Echo Cookie] Observer stopped');
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
    console.log('[Echo Cookie] URL changed, re-checking for banners');
    handled.clear(); // Reset handled banners on page change
    attemptCount = 0;
    setTimeout(() => detectAndHandleBanners(), INITIAL_DELAY);
  }
}).observe(document, { subtree: true, childList: true });
