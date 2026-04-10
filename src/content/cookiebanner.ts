/**
 * cookiebanner.ts
 * Cookie Banner Detection Content Script
 *
 * This script ONLY detects cookie banners and reports them to the background.
 * It does NOT auto-click anything. The user decides via the popup UI.
 * When the user makes a choice, the background sends back an instruction
 * and this script executes it on the actual banner DOM element.
 *
 * On return visits, if a saved preference exists for this hostname,
 * the background sends the instruction directly without showing UI.
 *
 * Does NOT interact with allowlisted sites.
 */

// ---------------------------------------------------------------------------
// Cookie filter patterns — inlined to avoid Rollup chunk collision
// ---------------------------------------------------------------------------
const COOKIE_BANNER_SELECTORS = [
  '#cookie-banner', '#cookie-consent', '#cookie-notice', '#cookie-bar',
  '#cookie-policy', '#cookiebanner', '#cookieconsent', '#cookie-popup',
  '#cookie-modal', '#gdpr-banner', '#gdpr-consent', '#gdpr-popup',
  '#consent-banner', '#consent-popup', '#consent-modal', '#privacy-banner',
  '#privacy-notice', '#privacy-popup', '#cc-window', '#onetrust-banner-sdk',
  '#onetrust-consent-sdk', '#onetrust-pc-sdk', '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBody', '#cookieConsentModal', '#sp_message_container',
  '#didomi-popup', '#didomi-notice', '#didomi-host', '#usercentrics-root',
  '#cmp-root', '#cmp-container', '#gdpr-cookie-consent', '#cookie_notice',
  '#cookie-law-info-bar',
  '.cookie-banner', '.cookie-consent', '.cookie-notice', '.cookie-bar',
  '.cookie-popup', '.cookie-modal', '.cookie-dialog', '.cookie-wall',
  '.cookie-overlay', '.gdpr-banner', '.gdpr-consent', '.gdpr-popup',
  '.consent-banner', '.consent-popup', '.consent-modal', '.consent-dialog',
  '.privacy-banner', '.privacy-notice', '.cc-window', '.cc-banner',
  '.cc-dialog', '.cmp-popup', '.cmp-dialog',
  '[aria-label*="cookie" i]', '[aria-label*="consent" i]',
  '[aria-label*="privacy" i]', '[aria-describedby*="cookie" i]',
  '[role="dialog"][aria-label*="cookie" i]',
  '[role="dialog"][aria-label*="consent" i]',
  '[role="dialog"][aria-label*="privacy" i]',
  '[role="alertdialog"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="consent" i]',
  '[class*="cookie-banner"]', '[class*="cookie-consent"]',
  '[class*="cookie-notice"]', '[class*="cookie-popup"]',
  '[class*="cookie-dialog"]', '[class*="cookie-modal"]',
  '[class*="consent-banner"]', '[class*="consent-dialog"]',
  '[class*="privacy-banner"]', '[class*="privacy-notice"]',
  '[class*="cookie-notification"]', '[class*="data-processing"]',
  '[class*="gdpr-banner"]', '[class*="privacy-consent"]',
];

const REJECT_ALL_PATTERNS = [
  /^reject\s+all$/i, /^decline\s+all$/i, /^deny\s+all$/i,
  /^refuse\s+all$/i, /^reject\s+optional$/i, /^decline\s+optional$/i,
  /^reject\s+non-essential$/i, /^decline\s+non-essential$/i,
  /^do\s+not\s+accept$/i, /^i\s+decline$/i, /^no\s+thanks$/i,
  /^continue\s+without\s+accepting$/i, /^continue\s+without\s+agreeing$/i,
  /^continue\s+without$/i, /reject\s+all/i, /decline\s+all/i,
  /deny\s+all/i, /refuse\s+all/i, /reject\s+non-essential/i,
  /decline\s+non-essential/i,
  /^alle\s+ablehnen$/i, /^ablehnen$/i, /^nicht\s+akzeptieren$/i,
  /alle\s+ablehnen/i, /ablehnen/i,
  /^tout\s+refuser$/i, /^refuser\s+tout$/i,
  /^continuer\s+sans\s+accepter$/i, /tout\s+refuser/i, /refuser\s+tout/i,
  /^rechazar\s+todas$/i, /^denegar\s+todas$/i, /^rechazar$/i,
  /rechazar\s+todas/i,
  /^rifiuta\s+tutti$/i, /^rifiuta$/i, /rifiuta\s+tutti/i,
  /^alles\s+weigeren$/i, /^weigeren$/i, /alles\s+weigeren/i,
  /^rejeitar\s+todos$/i, /^rejeitar$/i, /rejeitar\s+todos/i,
  /^reject\s+additional\s+cookies$/i,
  /reject\s+additional/i,
];

const NECESSARY_ONLY_PATTERNS = [
  /^necessary\s+only$/i, /^essential\s+only$/i, /^required\s+only$/i,
  /^only\s+necessary$/i, /^only\s+essential$/i, /^only\s+required$/i,
  /^accept\s+necessary$/i, /^accept\s+essential$/i, /^accept\s+required$/i,
  /^use\s+necessary$/i, /^use\s+essential$/i,
  /^essential\s+cookies?\s+only$/i, /^necessary\s+cookies?\s+only$/i,
  /necessary\s+only/i, /essential\s+only/i, /accept\s+necessary/i,
  /accept\s+essential/i, /only\s+necessary/i, /only\s+essential/i,
  /necessary\s+cookies?\s+only/i, /essential\s+cookies?\s+only/i,
  /^nur\s+notwendige$/i, /^nur\s+erforderliche$/i,
  /nur\s+notwendige/i, /nur\s+erforderliche/i,
  /^seulement\s+nécessaires$/i, /^essentiels\s+seulement$/i,
  /seulement\s+nécessaires/i,
  /^solo\s+necesarias$/i, /solo\s+necesarias/i,
  /^solo\s+necessari$/i, /solo\s+necessari/i,
  /^alleen\s+noodzakelijk$/i, /alleen\s+noodzakelijk/i,
  /^apenas\s+necessários$/i, /apenas\s+necessários/i,
];

const ACCEPT_ALL_PATTERNS = [
  /^accept\s+all$/i, /^allow\s+all$/i, /^agree\s+to\s+all$/i,
  /^accept\s+all\s+cookies$/i, /^allow\s+all\s+cookies$/i,
  /^i\s+agree$/i, /^i\s+accept$/i, /^i\s+consent$/i,
  /^i\s+understand$/i, /^got\s+it$/i, /^ok$/i, /^okay$/i,
  /accept\s+all/i, /allow\s+all/i, /agree\s+to\s+all/i,
  /^alle\s+akzeptieren$/i, /^zustimmen$/i, /^allen\s+zustimmen$/i,
  /alle\s+akzeptieren/i,
  /^tout\s+accepter$/i, /^accepter\s+tout$/i, /^j'accepte$/i,
  /tout\s+accepter/i,
  /^aceptar\s+todas?$/i, /^aceptar$/i, /aceptar\s+todas/i,
  /^accetta\s+tutti$/i, /^accettare$/i, /accetta\s+tutti/i,
  /^alles\s+accepteren$/i, /^akkoord$/i, /alles\s+accepteren/i,
  /^aceitar\s+todos$/i, /^aceitar$/i, /aceitar\s+todos/i,
  /^accept\s+additional\s+cookies$/i,
  /accept\s+additional/i,
];

const OVERLAY_SELECTORS = [
  '[class*="cookie"][class*="overlay"]',
  '[class*="cookie"][class*="backdrop"]',
  '[class*="consent"][class*="overlay"]',
  '[class*="consent"][class*="backdrop"]',
  '.modal-backdrop',
  '.cdk-overlay-backdrop',
  '[class*="cookie"][class*="mask"]',
  '[class*="consent"][class*="mask"]',
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 900;
const INITIAL_DELAY_MS = 1200;
const VERIFY_DELAY_MS = 600;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const handled = new Set<Element>();
let activeBanner: HTMLElement | null = null;
let cookieObserver: MutationObserver | null = null;
let cookieEnabled = false;
let bannerDetected = false;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
function cookieBannerInit(): void {
  console.log('COOKIE INIT CALLED');
  chrome.storage.local.get(
    ['isCookieBannerBlockingOn', 'isProtectionOn', 'allowlistedSites', 'cookiePreferences'],
    (result) => {
      if (result.isProtectionOn === false) return;

      const allowlisted: string[] = result.allowlistedSites || [];
      const host = window.location.hostname;
      if (allowlisted.some(site => host === site || host.endsWith('.' + site))) {
        console.log('[Echo Cookie] Site is allowlisted — standing down');
        return;
      }

      cookieEnabled = result.isCookieBannerBlockingOn !== false;
      if (!cookieEnabled) {
        console.log('[Echo Cookie] Disabled via settings');
        return;
      }

      console.log('[Echo Cookie] Active — starting detection');
      setTimeout(() => {
        detect(result.cookiePreferences || {});
        startObserver(result.cookiePreferences || {});
      }, INITIAL_DELAY_MS);
    }
  );

  // Listen for instructions from background (user made a choice in popup)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'COOKIE_EXECUTE_PREFERENCE') {
      executePreference(message.preference);
    }
  });

  // React to settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.isCookieBannerBlockingOn) {
      cookieEnabled = changes.isCookieBannerBlockingOn.newValue;
      if (!cookieEnabled) stopObserver();
    }
    if (changes.isProtectionOn && changes.isProtectionOn.newValue === false) {
      cookieEnabled = false;
      stopObserver();
    }
  });
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------
function detect(savedPreferences: Record<string, string>): void {
  if (!cookieEnabled) return;

  let found = false;

  for (const selector of COOKIE_BANNER_SELECTORS) {
    try {
      document.querySelectorAll<HTMLElement>(selector).forEach(banner => {
        if (!handled.has(banner) && isVisible(banner)) {
          console.log('[Echo Cookie] Banner found:', selector);
          found = true;
          handled.add(banner);
          activeBanner = banner;
          handleDetection(banner, savedPreferences);
        }
      });
    } catch { /* invalid selector */ }
  }

  if (!found) textSearch(savedPreferences);
}

function textSearch(savedPreferences: Record<string, string>): void {
  const candidates = document.querySelectorAll<HTMLElement>(
    'div, section, aside, [role="dialog"], [role="alertdialog"], [role="banner"], [role="region"]'
  );

  for (const el of candidates) {
    if (handled.has(el) || !isVisible(el)) continue;
    const text = (el.textContent || '').toLowerCase();
    const hasCookieLanguage =
      text.includes('cookie') ||
      (text.includes('consent') && text.includes('data')) ||
      (text.includes('privacy') && text.includes('accept'));

      if (hasCookieLanguage && text.length > 80 && text.length < 5000) {
        // Walk up to find the container that actually has buttons
        let container: HTMLElement = el;
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.querySelectorAll('button').length > 0) {
            container = parent;
            break;
          }
          parent = parent.parentElement;
        }
        
        console.log('[Echo Cookie] Banner found via text search');
        handled.add(container);
        activeBanner = container;
        handleDetection(container, savedPreferences);
        break;
      }
    }
  }

// ---------------------------------------------------------------------------
// Handle detection — check saved preference first, else notify background
// ---------------------------------------------------------------------------
function handleDetection(
  banner: HTMLElement,
  savedPreferences: Record<string, string>
): void {
  if (bannerDetected) return;
  bannerDetected = true;
  const host = window.location.hostname;
  const saved = savedPreferences[host] as string | undefined;

  if (saved) {
    // Return visit — apply saved preference silently
    console.log(`[Echo Cookie] Applying saved preference for ${host}: ${saved}`);
    executePreference(saved);
    return;
  }

  // First visit — analyse the banner and notify background
  const analysis = analyseBanner(banner);

  chrome.runtime.sendMessage({
    type: 'COOKIE_BANNER_DETECTED',
    hostname: host,
    analysis,
  });
}

// ---------------------------------------------------------------------------
// Analyse what options the banner actually offers
// ---------------------------------------------------------------------------
function analyseBanner(banner: HTMLElement): {
  hasRejectAll: boolean;
  hasEssentialOnly: boolean;
  hasAcceptAll: boolean;
  isSafeToHide: boolean;
} {
  const findBtn = (patterns: RegExp[]) =>
    findButton(banner, patterns) || findButton(document.body, patterns);

  return {
    hasRejectAll: !!findBtn(REJECT_ALL_PATTERNS),
    hasEssentialOnly: !!findBtn(NECESSARY_ONLY_PATTERNS),
    hasAcceptAll: !!findBtn(ACCEPT_ALL_PATTERNS),
    isSafeToHide: isSafeToHide(banner),
  };
}

// ---------------------------------------------------------------------------
// Execute a preference on the active banner
// Called either from background relay (user chose in popup) or saved preference
// ---------------------------------------------------------------------------
function executePreference(preference: string): void {
  if (!activeBanner) {
    console.warn('[Echo Cookie] No active banner to act on');
    return;
  }

  const banner = activeBanner;

  // Try finding buttons in banner first, fall back to full document
  const findBtn = (patterns: RegExp[]) =>
    findButton(banner, patterns) || findButton(document.body, patterns);

  switch (preference) {
    case 'block': {
      const rejectBtn = findBtn(REJECT_ALL_PATTERNS);
      if (rejectBtn) {
        console.log('[Echo Cookie] Executing: Reject All');
        click(rejectBtn);
        verify(banner, 'block');
        return;
      }
      const essentialBtn = findBtn(NECESSARY_ONLY_PATTERNS);
      if (essentialBtn) {
        console.log('[Echo Cookie] Executing: Essential Only (fallback from block)');
        click(essentialBtn);
        verify(banner, 'block');
        return;
      }
      if (isSafeToHide(banner)) hide(banner);
      break;
    }

    case 'essential': {
      const essentialBtn = findBtn(NECESSARY_ONLY_PATTERNS);
      if (essentialBtn) {
        console.log('[Echo Cookie] Executing: Essential Only');
        click(essentialBtn);
        verify(banner, 'essential');
        return;
      }
      const rejectBtn = findBtn(REJECT_ALL_PATTERNS);
      if (rejectBtn) {
        console.log('[Echo Cookie] Executing: Reject All (fallback for essential)');
        click(rejectBtn);
        verify(banner, 'essential');
        return;
      }
      if (isSafeToHide(banner)) hide(banner);
      break;
    }

    case 'all': {
      const acceptBtn = findBtn(ACCEPT_ALL_PATTERNS);
      if (acceptBtn) {
        console.log('[Echo Cookie] Executing: Accept All');
        click(acceptBtn);
        verify(banner, 'all');
        return;
      }
      if (isSafeToHide(banner)) hide(banner);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Verify banner was dismissed after clicking
// ---------------------------------------------------------------------------
function verify(banner: HTMLElement, preference: string): void {
  setTimeout(() => {
    if (!isVisible(banner)) {
      console.log(`[Echo Cookie] ✓ Banner dismissed (${preference})`);
      restoreScroll();
      // Notify background so popup can show confirmation
      chrome.runtime.sendMessage({ type: 'COOKIE_BANNER_RESOLVED' });
      return;
    }
    // Still visible — hide if safe, otherwise accept all as last resort
    if (isSafeToHide(banner)) {
      hide(banner);
    } else {
      const acceptBtn = findButton(banner, ACCEPT_ALL_PATTERNS);
      if (acceptBtn) {
        click(acceptBtn);
        setTimeout(restoreScroll, VERIFY_DELAY_MS);
      }
    }
    chrome.runtime.sendMessage({ type: 'COOKIE_BANNER_RESOLVED' });
  }, VERIFY_DELAY_MS);
}

// ---------------------------------------------------------------------------
// Safety check
// ---------------------------------------------------------------------------
function isSafeToHide(banner: HTMLElement): boolean {
  const style = window.getComputedStyle(banner);
  if (style.position === 'fixed' || style.position === 'absolute') return true;

  const rect = banner.getBoundingClientRect();
  if (rect.height < window.innerHeight * 0.8) return true;

  // Scroll locked — we can restore it ourselves so still safe
  const bodyOverflow = window.getComputedStyle(document.body).overflow;
  if (bodyOverflow === 'hidden') return true;

  return false;
}

function isConsentWall(banner: HTMLElement): boolean {
  const rect = banner.getBoundingClientRect();
  const coversViewport =
    rect.height >= window.innerHeight * 0.9 &&
    rect.width >= window.innerWidth * 0.9;
  if (!coversViewport) return false;
  const scrollLocked = window.getComputedStyle(document.body).overflow === 'hidden';
  return coversViewport && scrollLocked && !findButton(banner, ACCEPT_ALL_PATTERNS);
}

// ---------------------------------------------------------------------------
// Hide banner visually
// ---------------------------------------------------------------------------
function hide(banner: HTMLElement): void {
  banner.style.setProperty('display', 'none', 'important');
  banner.style.setProperty('visibility', 'hidden', 'important');
  banner.style.setProperty('opacity', '0', 'important');
  banner.style.setProperty('pointer-events', 'none', 'important');

  OVERLAY_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll<HTMLElement>(selector).forEach(overlay => {
        overlay.style.setProperty('display', 'none', 'important');
      });
    } catch { /* skip */ }
  });

  restoreScroll();
  console.log('[Echo Cookie] Banner hidden');
}

// ---------------------------------------------------------------------------
// Restore body scroll
// ---------------------------------------------------------------------------
function restoreScroll(): void {
  const body = document.body;
  const html = document.documentElement;
  ['overflow', 'overflow-y'].forEach(prop => {
    if (window.getComputedStyle(body).getPropertyValue(prop) === 'hidden') {
      body.style.removeProperty(prop);
    }
    if (window.getComputedStyle(html).getPropertyValue(prop) === 'hidden') {
      html.style.removeProperty(prop);
    }
  });
}

// ---------------------------------------------------------------------------
// Click a button reliably
// ---------------------------------------------------------------------------
function click(el: HTMLElement): void {
  try {
    el.click();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  } catch { /* silently fail */ }
}

// ---------------------------------------------------------------------------
// Find button matching patterns
// ---------------------------------------------------------------------------
function findButton(
  container: HTMLElement | Document,
  patterns: RegExp[]
): HTMLElement | null {
  const selectors = [
    'button', 'a[role="button"]', '[role="button"]',
    'input[type="button"]', 'input[type="submit"]',
    '[onclick]', '[class*="button"]', '[class*="btn"]',
  ];

  for (const selector of selectors) {
    try {
      const elements = container.querySelectorAll<HTMLElement>(selector);
      for (const el of elements) {
        if (!isVisible(el)) continue;
        const texts = [
          el.textContent,
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.getAttribute('value'),
          el.getAttribute('alt'),
        ].filter(Boolean).map(t => (t || '').trim());

        for (const text of texts) {
          for (const pattern of patterns) {
            if (pattern.test(text)) return el;
          }
        }
      }
    } catch { /* skip */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Visibility check
// ---------------------------------------------------------------------------
function isVisible(el: HTMLElement): boolean {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// ---------------------------------------------------------------------------
// MutationObserver
// ---------------------------------------------------------------------------
function startObserver(savedPreferences: Record<string, string>): void {
  if (cookieObserver) return;
  cookieObserver = new MutationObserver(() => detect(savedPreferences));
  const attach = () => {
    cookieObserver!.observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) attach();
  else document.addEventListener('DOMContentLoaded', attach);
}

function stopObserver(): void {
  cookieObserver?.disconnect();
  cookieObserver = null;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
cookieBannerInit();