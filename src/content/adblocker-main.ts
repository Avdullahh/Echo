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
  // 1. POPUP/POP-UNDER BLOCKING
  // ===========================================
  const originalWindowOpen = window.open;

  window.open = function(
    url?: string | URL,
    target?: string,
    features?: string
  ): Window | null {
    if (!blockingEnabled) return originalWindowOpen.call(window, url, target, features);

    const urlStr = (url || '').toString().toLowerCase();
    const isAdUrl =
      urlStr.includes('ad.') ||
      urlStr.includes('/ads/') ||
      urlStr.includes('doubleclick') ||
      urlStr.includes('googlesyndication') ||
      urlStr.includes('click.') ||
      urlStr.includes('popup') ||
      urlStr.includes('popunder') ||
      urlStr.includes('track.') ||
      urlStr.includes('redirect') ||
      urlStr.includes('aff=') ||
      urlStr.includes('affiliate') ||
      urlStr.includes('banner') ||
      urlStr.includes('promo');

    const isClickHijack = !url || urlStr === '' || urlStr === 'about:blank';
    const hasUserGesture = (navigator as any).userActivation?.isActive;

    if (isAdUrl || isClickHijack || !hasUserGesture) {
      console.log('[Echo AdBlock] ✓ Blocked popup:', urlStr.substring(0, 60) || 'empty/hijack');
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
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