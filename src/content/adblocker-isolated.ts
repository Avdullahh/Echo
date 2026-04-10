/**
 * Echo Privacy - Ad Blocker (ISOLATED World)
 * Runs in Chrome's isolated content script world.
 * Checks both isProtectionOn AND isAdBlockingOn before injecting.
 * Responds to storage changes to enable/disable without page reload.
 *
 * Cosmetic removal strategy (researched from top 5 open source adblockers):
 * - uBlock Origin: :root-prefixed CSS for high specificity, :upward() parent collapse
 * - AdGuard: DOM removal over display:none, :style() layout fixes
 * - Ghostery: MutationObserver empty-parent detection
 * - Adblock Plus: display:none !important for natural browser reflow
 */

// ---------------------------------------------------------------------------
// COSMETIC AD SELECTORS — single source of truth
// Used both for CSS injection and parent collapse logic
// display:none removes elements from layout flow so siblings fill the gap
// ---------------------------------------------------------------------------
const COSMETIC_AD_SELECTORS = [
  // Google Ads — specific IDs only
  'ins.adsbygoogle',
  '[id*="google_ads"]',
  '[id*="div-gpt-ad"]',
  'div[id^="google_ads_"]',
  'div[id^="div-gpt-"]',
  '.adsbygoogle',
  // Common ad containers — conservative exclusions to protect site UI
  '[class*="ad-container"]:not([class*="head"]):not([class*="read"]):not([class*="thread"]):not([class*="upload"]):not([class*="download"]):not([class*="spread"])',
  '[id*="ad-container"]:not([id*="head"]):not([id*="read"]):not([id*="upload"]):not([id*="download"])',
  '[class*="advertisement"]:not([class*="manage"]):not([class*="settings"])',
  // Ad networks — named networks only
  '[class*="taboola-widget"]',
  '[class*="outbrain-widget"]',
  '[class*="revcontent-widget"]',
  '[class*="mgid-widget"]',
  '[class*="native-ad-widget"]',
  // Video ads
  '[class*="video-ad-overlay"]',
  '[class*="preroll-ad"]',
  '[class*="ima-ad-container"]',
  '.ytp-ad-module',
  '.ytp-ad-overlay-container',
  // Banner ads — specific iframe sources only
  'iframe[src*="doubleclick.net/"]',
  'iframe[src*="googlesyndication.com/"]',
  'iframe[src*="googleadservices.com/"]',
  // Standard IAB banner sizes — exact dimensions only
  'iframe[width="728"][height="90"]',
  'iframe[width="300"][height="250"]',
  'iframe[width="160"][height="600"]',
  'iframe[width="300"][height="600"]',
  'iframe[width="970"][height="250"]',
  'iframe[width="320"][height="50"]',
  // FOMO / social proof popups
  '.fomo-notification',
  '[class*="fomo-notification"]',
  '[class*="sales-pop"]',
  '[class*="recent-sales"]',
  '[class*="proof-notification"]',
  // Push notification prompts
  '#onesignal-bell-container',
  '#onesignal-slidedown-container',
  '[class*="onesignal"]',
  '.notifyjs-corner',
  // Newsletter popups
  '[class*="newsletter-popup"]',
  '[class*="subscribe-popup"]',
  '[id*="newsletter-popup"]',
];

// Sponsored content — reduced opacity rather than hidden
// so page layout is unaffected but content is visually de-emphasised
const COSMETIC_DIMMED_SELECTORS = [
  '.sponsored-post',
  '.promoted-post',
];

// Parent wrapper selectors — containers that exist purely to hold ads
// When all their children are hidden, collapse the wrapper too
// Technique: uBlock Origin :upward() + Ghostery empty-parent detection
const WRAPPER_SELECTORS = [
  '[class*="ad-wrapper"]',
  '[class*="ad-slot"]',
  '[class*="ad-unit"]',
  '[class*="ad-zone"]',
  '[class*="ad-space"]',
  '[class*="ad-placeholder"]',
  '[id*="ad-wrapper"]',
  '[id*="ad-slot"]',
  '[id*="ad-unit"]',
  '[class*="sidebar-ad"]',
  '[class*="banner-wrapper"]',
  '[class*="sponsored-wrapper"]',
];

// Tags that should never be collapsed — they are structural page elements
const SAFE_TAGS = new Set([
  'body', 'main', 'article', 'section', 'nav',
  'header', 'footer', 'html', 'aside', 'form',
]);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let isEnabled = false;
let domainRulesCache: Record<string, string[]> | null = null;
let layoutObserver: MutationObserver | null = null;
let collapseScheduled = false;

// ---------------------------------------------------------------------------
// Build high-specificity CSS stylesheet
// Technique: uBlock Origin's :root prefix to beat inline styles
// display:none !important — removes elements from layout flow entirely
// so the browser's own reflow fills vacated space with sibling elements
// ---------------------------------------------------------------------------
function buildCosmeticStylesheet(): string {
  const hideRules = COSMETIC_AD_SELECTORS.map(sel => {
    try {
      document.querySelector(sel); // validate selector
      return `:root ${sel}`;
    } catch {
      return null;
    }
  }).filter(Boolean).join(',\n');

  const dimRules = COSMETIC_DIMMED_SELECTORS
    .map(sel => `:root ${sel}`)
    .join(',\n');

  return (
    `${hideRules} {\n  display: none !important;\n}\n\n` +
    `${dimRules} {\n  opacity: 0.3 !important;\n}`
  );
}

// ---------------------------------------------------------------------------
// Style injection / removal
// ---------------------------------------------------------------------------
function injectStyles(): void {
  // Remove stale tag if present before re-injecting
  document.getElementById('echo-adblock-styles')?.remove();

  const style = document.createElement('style');
  style.id = 'echo-adblock-styles';
  style.textContent = buildCosmeticStylesheet();
  (document.head || document.documentElement)?.appendChild(style);
}

function removeStyles(): void {
  ['echo-adblock-styles', 'echo-cosmetic-generic', 'echo-cosmetic-domain'].forEach(id => {
    document.getElementById(id)?.remove();
  });
}

// ---------------------------------------------------------------------------
// Generated cosmetic rules from EasyList (cosmetic-generic.css)
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

// ---------------------------------------------------------------------------
// Domain-specific cosmetic rules (cosmetic-domains.json)
// ---------------------------------------------------------------------------
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
// Shadow DOM ad hiding
// ---------------------------------------------------------------------------
const SHADOW_AD_SELECTORS = [
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
      style.textContent = buildCosmeticStylesheet();
      node.shadowRoot.appendChild(style);
    }
  });
}

// ---------------------------------------------------------------------------
// SEAMLESS LAYOUT RECOVERY
// ---------------------------------------------------------------------------

// Check if an element is visually empty — all children are hidden
// Technique: Ghostery empty-parent detection
function isVisuallyEmpty(el: HTMLElement): boolean {
  if (el.children.length === 0) {
    return (el.textContent?.trim() || '').length === 0;
  }
  return Array.from(el.children).every(child => {
    const style = window.getComputedStyle(child as HTMLElement);
    return (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      (child as HTMLElement).offsetHeight === 0
    );
  });
}

// Collapse empty wrapper containers after their ad children are hidden
// Technique: uBlock Origin :upward() operator + Ghostery empty-parent check
function collapseEmptyContainers(): void {
  // Pass 1: collapse known wrapper selectors
  WRAPPER_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll<HTMLElement>(selector).forEach(wrapper => {
        if (isVisuallyEmpty(wrapper)) {
          wrapper.style.setProperty('display', 'none', 'important');
        }
      });
    } catch {
      // Invalid selector — skip
    }
  });

  // Pass 2: walk up from each hidden ad element and collapse its parent
  // if the parent is now empty — catches wrappers not in WRAPPER_SELECTORS
  // Technique: uBlock Origin :upward() behaviour
  COSMETIC_AD_SELECTORS.forEach(selector => {
    try {
      document.querySelectorAll<HTMLElement>(selector).forEach(adEl => {
        const parent = adEl.parentElement;
        if (!parent || SAFE_TAGS.has(parent.tagName.toLowerCase())) return;

        if (isVisuallyEmpty(parent)) {
          parent.style.setProperty('display', 'none', 'important');

          // One level further up — collapse grandparent if also empty
          // but only if it's not a structural page element
          const grandparent = parent.parentElement;
          if (
            grandparent &&
            !SAFE_TAGS.has(grandparent.tagName.toLowerCase()) &&
            isVisuallyEmpty(grandparent)
          ) {
            grandparent.style.setProperty('display', 'none', 'important');
          }
        }
      });
    } catch {
      // Invalid selector — skip
    }
  });
}

// Schedule a collapse on the next animation frame
// Technique: Ghostery's throttled MutationObserver pattern
// requestAnimationFrame ensures computedStyle reads are accurate post-reflow
function scheduleCollapse(): void {
  if (collapseScheduled) return;
  collapseScheduled = true;
  requestAnimationFrame(() => {
    collapseEmptyContainers();
    collapseScheduled = false;
  });
}

// MutationObserver — re-evaluate on structural DOM changes (SPAs, lazy loads)
function setupLayoutObserver(): void {
  if (layoutObserver) return;

  layoutObserver = new MutationObserver((mutations) => {
    const hasStructuralChange = mutations.some(m =>
      m.type === 'childList' &&
      (m.addedNodes.length > 0 || m.removedNodes.length > 0)
    );
    if (hasStructuralChange) scheduleCollapse();
  });

  const attach = () => {
    layoutObserver!.observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) {
    attach();
  } else {
    document.addEventListener('DOMContentLoaded', attach);
  }
}

function teardownLayoutObserver(): void {
  if (layoutObserver) {
    layoutObserver.disconnect();
    layoutObserver = null;
  }
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

  // Inject high-specificity :root-prefixed CSS
  injectStyles();
  loadGeneratedCSS().catch(() => {});
  applyDomainRules().catch(() => {});

  // Initial collapse pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      collapseEmptyContainers();
      hideAdsInShadowDOM();
    });
  } else {
    collapseEmptyContainers();
    hideAdsInShadowDOM();
  }

  // Watch for dynamically injected content
  setupLayoutObserver();

  // Periodic fallback for very late-loading content (3s — less aggressive)
  setInterval(() => {
    if (isEnabled) {
      collapseEmptyContainers();
      hideAdsInShadowDOM();
    }
  }, 3000);

  signalMainWorld(true);
  console.log('[Echo AdBlock] Blocking enabled with seamless layout recovery');
}

function disableBlocking(): void {
  isEnabled = false;
  removeStyles();
  teardownLayoutObserver();
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