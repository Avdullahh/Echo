(function echoAdBlockerMain() {
  'use strict';

  if ((window as any).__echoAdBlockerInjected) return;
  (window as any).__echoAdBlockerInjected = true;

  // ---------------------------------------------------------------------------
  // STATE — controlled by isolated world via postMessage
  // Starts as false — isolated world explicitly enables it if appropriate
  // ---------------------------------------------------------------------------
  let blockingEnabled = false;

  // Listen for enable/disable signals from the isolated world
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'ECHO_ENABLE_BLOCKING') {
      blockingEnabled = true;
      bypassAlternateContentDetection(); 
      console.log('[Echo AdBlock] MAIN: Blocking enabled via message');
    }
    if (event.data?.type === 'ECHO_DISABLE_BLOCKING') {
      blockingEnabled = false;
      console.log('[Echo AdBlock] MAIN: Blocking disabled via message');
    }
  });

  // ===========================================
  // 1. SMART POPUP INTERCEPTOR
  // ===========================================

  const GESTURE_TIMEOUT_MS = 1000; // AdGuard uses ~1000ms
  let lastTrustedGestureTime = 0;
  let lastTrustedGestureTarget: EventTarget | null = null;

  // Track ALL trusted user input events — AdGuard tracks these specifically
  const TRUSTED_EVENT_TYPES = [
    'click', 'mousedown', 'mouseup',
    'touchstart', 'touchend',
    'keydown', 'keyup', 'keypress'
  ];

  function recordTrustedGesture(event: Event): void {
    if (event.isTrusted) {
      lastTrustedGestureTime = Date.now();
      lastTrustedGestureTarget = event.target;
    }
  }

  // Register listeners at capture phase so they fire before any page handlers
  TRUSTED_EVENT_TYPES.forEach(type => {
    window.addEventListener(type, recordTrustedGesture, true);
  });

  // ---------------------------------------------------------------------------
  // Trusted domains popups from these are always allowed immediately
  // ---------------------------------------------------------------------------
  const TRUSTED_POPUP_DOMAINS = new Set([
    'google.com', 'accounts.google.com', 'mail.google.com',
    'docs.google.com', 'drive.google.com', 'meet.google.com',
    'facebook.com', 'twitter.com', 'x.com',
    'apple.com', 'appleid.apple.com',
    'microsoft.com', 'login.microsoftonline.com', 'outlook.com',
    'office.com', 'live.com', 'teams.microsoft.com',
    'github.com', 'gitlab.com',
    'paypal.com', 'checkout.paypal.com',
    'stripe.com', 'checkout.stripe.com',
    'youtube.com', 'vimeo.com', 'spotify.com',
    'linkedin.com', 'instagram.com', 'reddit.com',
    'zoom.us', 'whereby.com',
    'amazon.com', 'ebay.com', 'etsy.com',
    'wikipedia.org', 'stackoverflow.com',
    'dropbox.com', 'notion.so', 'slack.com',
    'discord.com', 'telegram.org',
    'twitch.tv', 'netflix.com',
    'bankofamerica.com', 'chase.com', 'barclays.co.uk',
    'revolut.com', 'monzo.com', 'paypal.com',
  ]);

  // ---------------------------------------------------------------------------
  // Known ad popup patterns from EasyList $popup rules + uBO filter lists
  // These are blocked silently without showing any toast
  // ---------------------------------------------------------------------------
  const AD_POPUP_PATTERNS = [
    'doubleclick', 'googlesyndication', 'googleadservices',
    'popads', 'popcash', 'popunder', 'pop-under',
    'adnxs', 'adform', 'criteo', 'taboola', 'outbrain',
    'adsrvr', 'rubiconproject', 'pubmatic', 'openx',
    'exoclick', 'juicyads', 'plugrush', 'propellerads',
    'trafficjunky', 'trafficfactory', 'adcash', 'adclick',
    'yllix', 'hilltopads', 'bidvertiser', 'clickadu',
    'adsterra', 'ero-advertising', 'zeropark',
    'mgid', 'revcontent', 'content.ad', 'sharethrough',
    'adf.ly', 'shorte.st', 'linkbucks', 'bc.vc',
    '/ads/', '/ad/', 'adserver', 'adclick',
    'aff=', 'affid=', 'affiliate',
    'popuptraffic', 'popup-ad', 'adpop',
  ];

  // ---------------------------------------------------------------------------
  // Helper: extract hostname safely
  // ---------------------------------------------------------------------------
  function getHostname(urlStr: string): string {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  // ---------------------------------------------------------------------------
  // Helper: check if hostname is trusted
  // ---------------------------------------------------------------------------
  function isTrustedDomain(hostname: string): boolean {
    for (const trusted of TRUSTED_POPUP_DOMAINS) {
      if (hostname === trusted || hostname.endsWith('.' + trusted)) {
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Helper: check if URL matches known ad patterns
  // ---------------------------------------------------------------------------
  function isKnownAdUrl(urlStr: string): boolean {
    const lower = urlStr.toLowerCase();
    return AD_POPUP_PATTERNS.some(p => lower.includes(p));
  }

  // ---------------------------------------------------------------------------
  // Helper: check if called within a trusted gesture window
  // ---------------------------------------------------------------------------
  function hasRecentTrustedGesture(): boolean {
    return (Date.now() - lastTrustedGestureTime) < GESTURE_TIMEOUT_MS;
  }

  // ---------------------------------------------------------------------------
  // Toast notification
  // ---------------------------------------------------------------------------
  function showPopupToast(
    urlStr: string,
    onAllow: () => void,
    onBlock: () => void
  ): void {
    // Remove any existing toast first
    document.getElementById('echo-popup-toast')?.remove();

    const hostname = getHostname(urlStr) || urlStr.substring(0, 40);

    const toast = document.createElement('div');
    toast.id = 'echo-popup-toast';
    toast.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      background: #0f1117 !important;
      border: 1px solid rgba(77,255,188,0.25) !important;
      border-radius: 14px !important;
      padding: 14px 16px !important;
      color: #e2e8f0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 13px !important;
      max-width: 300px !important;
      min-width: 260px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(77,255,188,0.08) !important;
      animation: echo-toast-in 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
      pointer-events: all !important;
    `;

    toast.innerHTML = `
      <style>
        @keyframes echo-toast-in {
          from { transform: translateY(12px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1);       opacity: 1; }
        }
        #echo-popup-toast * { box-sizing: border-box !important; }
      </style>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(77,255,188,0.1);border:1px solid rgba(77,255,188,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;">🛡️</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#4dffbc;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Echo — Popup Blocked</div>
          <div style="color:#94a3b8;font-size:12px;margin-bottom:10px;line-height:1.4;">
            <strong style="color:#cbd5e1;">${hostname}</strong> wants to open a new window
          </div>
          <div style="display:flex;gap:6px;">
            <button id="echo-popup-allow" style="
              flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(77,255,188,0.3);
              background:rgba(77,255,188,0.12);color:#4dffbc;
              font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;
              transition:background 0.15s;
            " onmouseover="this.style.background='rgba(77,255,188,0.22)'" 
              onmouseout="this.style.background='rgba(77,255,188,0.12)'">
              Allow
            </button>
            <button id="echo-popup-block" style="
              flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(239,68,68,0.25);
              background:rgba(239,68,68,0.08);color:#f87171;
              font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;
              transition:background 0.15s;
            " onmouseover="this.style.background='rgba(239,68,68,0.18)'" 
              onmouseout="this.style.background='rgba(239,68,68,0.08)'">
              Block
            </button>
          </div>
          <div style="margin-top:7px;font-size:10px;color:#475569;text-align:center;">
            Auto-blocking in <span id="echo-popup-countdown">8</span>s
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Countdown timer
    let secondsLeft = 8;
    const countdownEl = toast.querySelector('#echo-popup-countdown') as HTMLElement;
    const countdownInterval = setInterval(() => {
      secondsLeft--;
      if (countdownEl) countdownEl.textContent = secondsLeft.toString();
    }, 1000);

    // Auto-block after 8 seconds
    const autoTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      toast.remove();
      onBlock();
    }, 8000);

    const cleanup = () => {
      clearTimeout(autoTimer);
      clearInterval(countdownInterval);
      toast.remove();
    };

    toast.querySelector('#echo-popup-allow')!.addEventListener('click', () => {
      cleanup();
      onAllow();
    });

    toast.querySelector('#echo-popup-block')!.addEventListener('click', () => {
      cleanup();
      onBlock();
    });
  }

  // ---------------------------------------------------------------------------
  // The intercepted window.open
  // ---------------------------------------------------------------------------
  const originalWindowOpen = window.open.bind(window);

  window.open = function(
    url?: string | URL,
    target?: string,
    features?: string
  ): Window | null {

    if (!blockingEnabled) {
      return originalWindowOpen(url, target, features);
    }

    const urlStr = (url || '').toString().trim();

    // 1. Empty or about:blank — classic click hijacking, silent block
    if (!urlStr || urlStr === '' || urlStr.toLowerCase() === 'about:blank') {
      console.log('[Echo PopupBlocker] ✓ Silently blocked click hijack popup');
      return null;
    }

    // 2. Known ad URL pattern — silent block
    if (isKnownAdUrl(urlStr)) {
      console.log('[Echo PopupBlocker] ✓ Silently blocked ad popup:', urlStr.substring(0, 80));
      return null;
    }

    const hostname = getHostname(urlStr);

    // 3. Trusted domain — allow immediately, no toast
    if (isTrustedDomain(hostname)) {
      console.log('[Echo PopupBlocker] ✓ Allowed trusted popup:', hostname);
      return originalWindowOpen(url, target, features);
    }

    // 4. Recent genuine user gesture (AdGuard PopupBlocker core technique)
    // If the user genuinely clicked something in the last 1 second, allow it
    if (hasRecentTrustedGesture()) {
      console.log('[Echo PopupBlocker] ✓ Allowed gesture-triggered popup:', hostname);
      return originalWindowOpen(url, target, features);
    }

    // 5. No recent gesture and not a known ad or trusted site
    // Show toast — let the user decide (AdGuard-style notification)
    console.log('[Echo PopupBlocker] ⚠ Intercepted ambiguous popup:', urlStr.substring(0, 80));

    showPopupToast(
      urlStr,
      () => {
        // User clicked Allow
        console.log('[Echo PopupBlocker] User allowed popup:', hostname);
        originalWindowOpen(url, target, features);
      },
      () => {
        // User clicked Block or toast timed out
        console.log('[Echo PopupBlocker] User blocked popup:', hostname);
      }
    );

    return null;
  };

  // ---------------------------------------------------------------------------
  // Also intercept setTimeout/setInterval delayed popups
  // ---------------------------------------------------------------------------
  const originalSetTimeout = window.setTimeout.bind(window);
  const originalSetInterval = window.setInterval.bind(window);

  (window as any).setTimeout = function(
    fn: TimerHandler,
    delay?: number,
    ...args: any[]
  ): number {
    const capturedGestureTime = lastTrustedGestureTime;
    return originalSetTimeout(function() {
      // If this setTimeout inherited a gesture timestamp from before it was
      // scheduled, reset it so window.open inside cannot abuse it
      if (lastTrustedGestureTime === capturedGestureTime && delay && delay > 100) {
        lastTrustedGestureTime = 0;
      }
      if (typeof fn === 'function') {
        fn(...args);
      } else {
        // String-based setTimeout (eval) — just run it
        (new Function(fn as string))();
      }
    }, delay);
  };

  (window as any).setInterval = function(
    fn: TimerHandler,
    delay?: number,
    ...args: any[]
  ): number {
    return originalSetInterval(function() {
      if (delay && delay > 100) {
        lastTrustedGestureTime = 0;
      }
      if (typeof fn === 'function') {
        fn(...args);
      }
    }, delay);
  };

  // ===========================================
  // 2. PUSH NOTIFICATION BLOCKING
  // ===========================================
  if ('Notification' in window) {
    const OriginalNotification = window.Notification;
    const FakeNotification = function(this: any, title: string, options?: NotificationOptions) {
      if (!blockingEnabled) return new OriginalNotification(title, options);
      console.log('[Echo AdBlock] ✓ Blocked notification:', title);
    } as any;
    FakeNotification.permission = 'denied';
    FakeNotification.requestPermission = () => Promise.resolve('denied' as NotificationPermission);
    FakeNotification.prototype = OriginalNotification.prototype;
    window.Notification = FakeNotification;
  }

  if ('serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = function(
      scriptURL: string | URL,
      options?: RegistrationOptions
    ): Promise<ServiceWorkerRegistration> {
      if (!blockingEnabled) return originalRegister(scriptURL, options);
      const urlStr = scriptURL.toString().toLowerCase();
      if (urlStr.includes('push') || urlStr.includes('notification') || urlStr.includes('onesignal')) {
        console.log('[Echo AdBlock] ✓ Blocked push service worker:', scriptURL);
        return Promise.reject(new Error('Push SW blocked by Echo'));
      }
      return originalRegister(scriptURL, options);
    };
  }

  // ===========================================
  // 3. ANTI-ADBLOCK DETECTION BYPASS
  // Always active regardless of blocking state —
  // this doesn't affect site functionality
  // ===========================================
  const adblockProperties = [
    'adsbygoogle', 'google_ad_client', 'googletag', 'google_ads',
    '__google_ad_urls', 'googlefc', 'adBlocker', 'adblockDetector',
    'blockAdBlock', 'fuckAdBlock', 'sniffAdBlock', 'canRunAds',
    'isAdBlockActive', 'adBlockDetected', 'adBlockEnabled', 'hasAdblock',
    'detectAdBlock', 'adblock_detected', 'adblock_test'
  ];

  for (const prop of adblockProperties) {
    try {
      Object.defineProperty(window, prop, {
        get() {
          if (prop === 'canRunAds') return true;
          if (prop === 'adsbygoogle') return { loaded: true, push: function() {} };
          if (prop === 'googletag') return {
            cmd: { push: function(fn: Function) { try { fn(); } catch(e) {} } },
            pubads: function() {
              return {
                refresh: function() {},
                setTargeting: function() { return this; },
                addEventListener: function() {}
              };
            },
            enableServices: function() {},
            display: function() {},
            defineSlot: function() { return { addService: function() { return this; } }; },
            companionAds: function() { return { setRefreshUnfilledSlots: function() {} }; }
          };
          return undefined;
        },
        set() {},
        configurable: true
      });
    } catch (e) {}
  }

  // Neutralise Google Analytics execution
  (window as any).ga = function() {};
  (window as any).gtag = function() {};
  (window as any).__ga_disable = true;
  (window as any)[`ga-disable-UA-XXXXX-Y`] = true;

  // Neutralise Sentry execution  
  (window as any).Sentry = {
    init: function() {},
    captureException: function() {},
    captureMessage: function() {},
    configureScope: function() {},
    withScope: function() {},
  };

  (window as any).BlockAdBlock = function() {
    this.onDetected = function() { return this; };
    this.onNotDetected = function(fn: Function) { if (fn) fn(); return this; };
    this.check = function() { return this; };
    this.emitEvent = function() { return this; };
  };
  (window as any).blockAdBlock = new (window as any).BlockAdBlock();
  (window as any).FuckAdBlock = (window as any).BlockAdBlock;
  (window as any).fuckAdBlock = (window as any).blockAdBlock;
  (window as any).detectAdBlocker = function() { return false; };
  (window as any).checkAdBlocker = function() { return false; };
  (window as any).isAdBlockerActive = function() { return false; };

  console.log('[Echo AdBlock] ✓ Anti-adblock bypass active');

  // ===========================================
  // 4. INTERSTITIAL/OVERLAY REMOVAL
  // ===========================================
  function removeInterstitials(): void {
    if (!blockingEnabled) return;

    document.querySelectorAll('div, section, aside').forEach(function(el) {
      const htmlEl = el as HTMLElement;
      const style = getComputedStyle(htmlEl);
      const zIndex = parseInt(style.zIndex) || 0;
      const isFixed = style.position === 'fixed';
      const isAbsolute = style.position === 'absolute';

      if (zIndex > 999999 && (isFixed || isAbsolute)) {
        const width = htmlEl.offsetWidth;
        const height = htmlEl.offsetHeight;
        if (width > window.innerWidth * 0.7 || height > window.innerHeight * 0.7) {
          htmlEl.remove();
          console.log('[Echo AdBlock] ✓ Removed interstitial overlay');
        }
      }
    });

    const interstitialSelectors = [
      '[class*="interstitial"]', '[id*="interstitial"]',
      '[class*="overlay-ad"]', '[class*="ad-overlay"]',
      '[class*="modal-ad"]', '[class*="popup-ad"]',
      '[class*="fullscreen-ad"]', '[class*="splash-ad"]',
      '[class*="welcome-ad"]', '[class*="subscribe-modal"]',
      '[class*="newsletter-popup"]'
    ];

    interstitialSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        el.remove();
      });
    });

    if (document.body?.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
  }

  // ===========================================
  // 5. VIDEO AD REMOVAL
  // ===========================================
  function removeVideoAds(): void {
    if (!blockingEnabled) return;
    const videoAdSelectors = [
      '.video-ads', '.videoAdUi', '[class*="video-ad"]',
      '.ytp-ad-player-overlay', '.ytp-ad-action-interstitial',
      '.ytp-ad-skip-button-container', '.ad-showing .ytp-chrome-bottom'
    ];
    videoAdSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  // ===========================================
  // 6. BANNER AD REMOVAL
  // ===========================================
  function removeBannerAds(): void {
    if (!blockingEnabled) return;
    const bannerSelectors = [
      '[class*="banner-ad"]', '[id*="banner-ad"]',
      '[class*="leaderboard-ad"]', '[class*="mrec-ad"]',
      '[class*="skyscraper-ad"]', '[class*="halfpage-ad"]'
    ];
    bannerSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  // ===========================================
  // 7. PUSH AD REMOVAL
  // ===========================================
  function removePushAds(): void {
    if (!blockingEnabled) return;
    const pushSelectors = [
      '#onesignal-bell-container', '#onesignal-slidedown-container',
      '[class*="push-prompt"]', '[class*="notification-prompt"]'
    ];
    pushSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  // ===========================================
  // 8. DIRECT LINK AD BLOCKING
  // ===========================================
  document.addEventListener('click', function(e: MouseEvent) {
    if (!blockingEnabled) return;
    const target = e.target as HTMLElement;
    const anchor = target.closest ? target.closest('a') : null;
    if (anchor && anchor.target === '_blank') {
      const href = (anchor.href || '').toLowerCase();
      if (href.includes('ad.') || href.includes('/ads/') ||
          href.includes('click.') || href.includes('doubleclick') ||
          href.includes('track.') || href.includes('redirect') ||
          href.includes('affiliate') || href.includes('aff=')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[Echo AdBlock] ✓ Blocked ad link click');
      }
    }
  }, true);


  // ===========================================
  // 9. ALTERNATE CONTENT BYPASS
  // ===========================================
  function bypassAlternateContentDetection(): void {
    if (!blockingEnabled) return;

    const adClassPatterns = [
      'ad-widget', 'adbox', 'adsbox', 'ad-container',
      'advertisement', 'adsbygoogle', 'banner_ads',
      'ad-placeholder', 'ad-slot', 'ad-unit'
    ];

    // Override offsetHeight/offsetWidth for known ad containers
    // so detection scripts think the ad loaded normally
    const observer = new MutationObserver(() => {
      adClassPatterns.forEach(pattern => {
        document.querySelectorAll(`[class*="${pattern}"]`).forEach(el => {
          const htmlEl = el as HTMLElement;
          if (getComputedStyle(htmlEl).display === 'none') {
            // Make the element report non-zero dimensions
            Object.defineProperty(htmlEl, 'offsetHeight', {
              get: () => 1,
              configurable: true
            });
            Object.defineProperty(htmlEl, 'offsetWidth', {
              get: () => 1,
              configurable: true
            });
          }
        });
      });
    });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
}
  // ===========================================
  // 10. MAIN EXECUTION
  // ===========================================
  function runBlockers(): void {
    if (!blockingEnabled) return;
    removeInterstitials();
    removeVideoAds();
    removeBannerAds();
    removePushAds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBlockers);
  } else {
    runBlockers();
  }

  const observer = new MutationObserver(function(mutations) {
    if (!blockingEnabled) return;
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) { shouldCheck = true; break; }
    }
    if (shouldCheck) runBlockers();
  });

  function startObserver(): void {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 10);
    }
  }
  startObserver();

  setInterval(runBlockers, 1500);

  console.log('[Echo AdBlock] ✓ MAIN world script ready — awaiting enable signal');
})();