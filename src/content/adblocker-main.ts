/**
 * Echo Privacy - Ad Blocker (MAIN World)
 *
 * This script runs in the page's MAIN world (not isolated)
 * It can intercept JavaScript APIs but CANNOT access chrome.* APIs
 *
 * Features:
 * - Pop-under/popup blocking (window.open intercept)
 * - Push notification blocking (Notification API intercept)
 * - Anti-adblock detection bypass
 * - Interstitial/overlay removal
 * - Video ad hiding
 * - Banner ad removal
 * - Direct link ad blocking
 */

(function echoAdBlockerMain() {
  'use strict';

  // Prevent multiple injections
  if ((window as any).__echoAdBlockerInjected) return;
  (window as any).__echoAdBlockerInjected = true;

  console.log('[Echo AdBlock] MAIN world script initializing...');

  // ===========================================
  // 1. POPUP/POP-UNDER BLOCKING
  // ===========================================

  const originalWindowOpen = window.open;
  let popupBlockCount = 0;

  window.open = function(
    url?: string | URL,
    target?: string,
    features?: string
  ): Window | null {
    const urlStr = (url || '').toString().toLowerCase();

    // Block if URL looks like an ad
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

    // Block if no URL or about:blank (click hijacking)
    const isClickHijack = !url || urlStr === '' || urlStr === 'about:blank';

    // Block popups triggered without user interaction
    const hasUserGesture = (navigator as any).userActivation?.isActive;

    if (isAdUrl || isClickHijack || !hasUserGesture) {
      popupBlockCount++;
      console.log('[Echo AdBlock] ✓ Blocked popup:', urlStr.substring(0, 60) || 'empty/hijack');
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
  };

  // ===========================================
  // 2. PUSH NOTIFICATION BLOCKING
  // ===========================================

  // Block Notification API
  if ('Notification' in window) {
    const FakeNotification = function(this: any, title: string, options?: NotificationOptions) {
      console.log('[Echo AdBlock] ✓ Blocked notification:', title);
      return {};
    } as any;

    FakeNotification.permission = 'denied';
    FakeNotification.requestPermission = function(): Promise<NotificationPermission> {
      console.log('[Echo AdBlock] ✓ Blocked notification permission request');
      return Promise.resolve('denied');
    };
    FakeNotification.prototype = Notification.prototype;

    Object.defineProperty(window, 'Notification', {
      value: FakeNotification,
      writable: false,
      configurable: false
    });
  }

  // Block Push API
  if ('PushManager' in window) {
    const FakePushManager = function() {} as any;
    FakePushManager.prototype.subscribe = function(): Promise<any> {
      console.log('[Echo AdBlock] ✓ Blocked push subscription');
      return Promise.reject(new Error('Push blocked by Echo'));
    };
    FakePushManager.prototype.getSubscription = function(): Promise<null> {
      return Promise.resolve(null);
    };

    Object.defineProperty(window, 'PushManager', {
      value: FakePushManager,
      writable: false,
      configurable: false
    });
  }

  // Block Service Worker push registrations
  if ('serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = function(
      scriptURL: string | URL,
      options?: RegistrationOptions
    ): Promise<ServiceWorkerRegistration> {
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
  // ===========================================

  // Properties used to detect ad blockers
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
          // Return values that make scripts think ads are working
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
        set(v: any) {
          // Silently ignore attempts to set detection flags
        },
        configurable: true
      });
    } catch (e) {
      // Property may already be defined
    }
  }

  // Neutralize BlockAdBlock
  (window as any).BlockAdBlock = function() {
    this.onDetected = function() { return this; };
    this.onNotDetected = function(fn: Function) { if (fn) fn(); return this; };
    this.check = function() { return this; };
    this.emitEvent = function() { return this; };
  };
  (window as any).blockAdBlock = new (window as any).BlockAdBlock();

  // Neutralize FuckAdBlock
  (window as any).FuckAdBlock = (window as any).BlockAdBlock;
  (window as any).fuckAdBlock = (window as any).blockAdBlock;

  // Neutralize common detection functions
  (window as any).detectAdBlocker = function() { return false; };
  (window as any).checkAdBlocker = function() { return false; };
  (window as any).isAdBlockerActive = function() { return false; };

  console.log('[Echo AdBlock] ✓ Anti-adblock bypass active');

  // ===========================================
  // 4. INTERSTITIAL/OVERLAY REMOVAL
  // ===========================================

  function removeInterstitials(): void {
    // High z-index overlays
    document.querySelectorAll('div, section, aside').forEach(function(el) {
      const htmlEl = el as HTMLElement;
      const style = getComputedStyle(htmlEl);
      const zIndex = parseInt(style.zIndex) || 0;
      const isFixed = style.position === 'fixed';
      const isAbsolute = style.position === 'absolute';

      if (zIndex > 999999 && (isFixed || isAbsolute)) {
        const width = htmlEl.offsetWidth;
        const height = htmlEl.offsetHeight;

        // Full-screen overlay
        if (width > window.innerWidth * 0.7 || height > window.innerHeight * 0.7) {
          htmlEl.remove();
          console.log('[Echo AdBlock] ✓ Removed interstitial overlay');
        }
      }
    });

    // Known interstitial patterns
    const interstitialSelectors = [
      '[class*="interstitial"]',
      '[id*="interstitial"]',
      '[class*="overlay-ad"]',
      '[class*="ad-overlay"]',
      '[class*="modal-ad"]',
      '[class*="popup-ad"]',
      '[class*="fullscreen-ad"]',
      '[class*="splash-ad"]',
      '[class*="welcome-ad"]',
      '.fancybox-overlay',
      '.lightbox-overlay',
      '[class*="subscribe-modal"]',
      '[class*="newsletter-popup"]'
    ];

    interstitialSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        el.remove();
        console.log('[Echo AdBlock] ✓ Removed interstitial:', selector);
      });
    });

    // Restore body scroll if locked
    if (document.body && document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.documentElement.style.overflow === 'hidden') {
      document.documentElement.style.overflow = '';
    }
  }

  // ===========================================
  // 5. VIDEO AD HIDING
  // ===========================================

  function removeVideoAds(): void {
    const videoAdSelectors = [
      '[class*="video-ad"]',
      '[class*="preroll"]',
      '[class*="midroll"]',
      '[class*="postroll"]',
      '[id*="video-ad"]',
      '[id*="preroll"]',
      '[class*="ima-ad-container"]',
      '[id*="ima-ad-container"]',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '[class*="ad-container"][class*="video"]',
      '.video-ads',
      '.videoAdUi',
      '.videoAdUiSkipButton'
    ];

    videoAdSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        const htmlEl = el as HTMLElement;
        // Don't remove actual video players
        if (!htmlEl.querySelector('video') || htmlEl.classList.toString().includes('ad')) {
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.height = '0';
          htmlEl.style.width = '0';
        }
      });
    });

    // Auto-click skip buttons
    const skipButtons = document.querySelectorAll(
      '.ytp-ad-skip-button, .ytp-skip-ad-button, [class*="skip-ad"], [class*="skipAd"], [class*="ad-skip"]'
    );
    skipButtons.forEach(function(btn) {
      (btn as HTMLElement).click();
      console.log('[Echo AdBlock] ✓ Clicked skip ad button');
    });
  }

  // ===========================================
  // 6. BANNER AD REMOVAL
  // ===========================================

  function removeBannerAds(): void {
    const bannerSelectors = [
      'ins.adsbygoogle',
      '[id*="google_ads"]',
      '[id*="div-gpt-ad"]',
      '[class*="adsbygoogle"]',
      '[data-ad-slot]',
      '[data-google-query-id]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'iframe[src*="googleadservices"]',
      '[class*="banner-ad"]',
      '[class*="ad-banner"]',
      '[id*="banner-ad"]',
      '[id*="ad-banner"]',
      '[class*="taboola"]',
      '[class*="outbrain"]',
      '[class*="revcontent"]',
      '[class*="mgid"]',
      'a[href*="click."][target="_blank"]',
      'a[href*="/aff/"]',
      'a[href*="affiliate"]'
    ];

    bannerSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = 'none';
        htmlEl.style.visibility = 'hidden';
        htmlEl.style.height = '0';
        htmlEl.style.width = '0';
        htmlEl.style.position = 'absolute';
        htmlEl.style.left = '-9999px';
      });
    });

    // IAB standard sizes
    const iabSizes = [
      [728, 90], [300, 250], [160, 600], [300, 600],
      [970, 250], [320, 50], [468, 60], [234, 60],
      [120, 600], [970, 90], [336, 280], [180, 150]
    ];

    document.querySelectorAll('iframe').forEach(function(iframe) {
      const width = parseInt(iframe.getAttribute('width') || String(iframe.offsetWidth));
      const height = parseInt(iframe.getAttribute('height') || String(iframe.offsetHeight));
      const src = (iframe.src || '').toLowerCase();

      const isAdSize = iabSizes.some(function(size) {
        return width === size[0] && height === size[1];
      });

      const isAdSrc = src.includes('ad') || src.includes('doubleclick') ||
                      src.includes('googlesyndication') || src.includes('banner');

      if (isAdSize || isAdSrc) {
        iframe.style.display = 'none';
        iframe.remove();
      }
    });
  }

  // ===========================================
  // 7. PUSH/FOMO NOTIFICATION REMOVAL
  // ===========================================

  function removePushAds(): void {
    const pushSelectors = [
      '[class*="push-notification"]',
      '[class*="web-push"]',
      '[id*="push-notification"]',
      '#onesignal-bell-container',
      '#onesignal-slidedown-container',
      '[class*="onesignal"]',
      '.notifyjs-corner',
      '.fomo-notification',
      '[class*="fomo-notification"]',
      '[class*="sales-pop"]',
      '[class*="recent-sales"]',
      '[class*="proof-notification"]',
      '[class*="social-proof"]',
      '[class*="notification-box"]'
    ];

    pushSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        el.remove();
      });
    });
  }

  // ===========================================
  // 8. DIRECT LINK AD BLOCKING
  // ===========================================

  document.addEventListener('click', function(e: MouseEvent) {
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
  // 9. MAIN EXECUTION
  // ===========================================

  function runBlockers(): void {
    removeInterstitials();
    removeVideoAds();
    removeBannerAds();
    removePushAds();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBlockers);
  } else {
    runBlockers();
  }

  // Watch for dynamically added ads
  const observer = new MutationObserver(function(mutations) {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    if (shouldCheck) {
      runBlockers();
    }
  });

  // Start observing once DOM is ready
  function startObserver(): void {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 10);
    }
  }
  startObserver();

  // Periodic cleanup
  setInterval(runBlockers, 1500);

  console.log('[Echo AdBlock] ✓ MAIN world blocking active');
})();
