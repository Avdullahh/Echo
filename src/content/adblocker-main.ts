(function echoAdBlockerMain() {
  'use strict';

  if ((window as any).__echoAdBlockerInjected) return;
  (window as any).__echoAdBlockerInjected = true;

  let blockingEnabled = false;
  const IS_YOUTUBE = window.location.hostname.includes('youtube.com');

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

  const GESTURE_TIMEOUT_MS = 1000;
  let lastTrustedGestureTime = 0;
  let lastTrustedGestureTarget: EventTarget | null = null;

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

  TRUSTED_EVENT_TYPES.forEach(type => {
    window.addEventListener(type, recordTrustedGesture, true);
  });

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

  function getHostname(urlStr: string): string {
    try { return new URL(urlStr).hostname.replace(/^www\./, ''); } catch { return ''; }
  }

  function isTrustedDomain(hostname: string): boolean {
    for (const trusted of TRUSTED_POPUP_DOMAINS) {
      if (hostname === trusted || hostname.endsWith('.' + trusted)) return true;
    }
    return false;
  }

  function isKnownAdUrl(urlStr: string): boolean {
    const lower = urlStr.toLowerCase();
    return AD_POPUP_PATTERNS.some(p => lower.includes(p));
  }

  function hasRecentTrustedGesture(): boolean {
    return (Date.now() - lastTrustedGestureTime) < GESTURE_TIMEOUT_MS;
  }

  function showPopupToast(urlStr: string, onAllow: () => void, onBlock: () => void): void {
    document.getElementById('echo-popup-toast')?.remove();
    const hostname = getHostname(urlStr) || urlStr.substring(0, 40);
    const toast = document.createElement('div');
    toast.id = 'echo-popup-toast';
    toast.style.cssText = `
      position: fixed !important; bottom: 24px !important; right: 24px !important;
      z-index: 2147483647 !important; background: #0f1117 !important;
      border: 1px solid rgba(77,255,188,0.25) !important; border-radius: 14px !important;
      padding: 14px 16px !important; color: #e2e8f0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 13px !important; max-width: 300px !important; min-width: 260px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(77,255,188,0.08) !important;
      animation: echo-toast-in 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
      pointer-events: all !important;
    `;
    toast.innerHTML = `
      <style>
        @keyframes echo-toast-in { from { transform: translateY(12px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
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
            <button id="echo-popup-allow" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(77,255,188,0.3);background:rgba(77,255,188,0.12);color:#4dffbc;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;">Allow</button>
            <button id="echo-popup-block" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(239,68,68,0.25);background:rgba(239,68,68,0.08);color:#f87171;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;">Block</button>
          </div>
          <div style="margin-top:7px;font-size:10px;color:#475569;text-align:center;">Auto-blocking in <span id="echo-popup-countdown">8</span>s</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    let secondsLeft = 8;
    const countdownEl = toast.querySelector('#echo-popup-countdown') as HTMLElement;
    const countdownInterval = setInterval(() => { secondsLeft--; if (countdownEl) countdownEl.textContent = secondsLeft.toString(); }, 1000);
    const autoTimer = setTimeout(() => { clearInterval(countdownInterval); toast.remove(); onBlock(); }, 8000);
    const cleanup = () => { clearTimeout(autoTimer); clearInterval(countdownInterval); toast.remove(); };
    toast.querySelector('#echo-popup-allow')!.addEventListener('click', () => { cleanup(); onAllow(); });
    toast.querySelector('#echo-popup-block')!.addEventListener('click', () => { cleanup(); onBlock(); });
  }

  const originalWindowOpen = window.open.bind(window);
  window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
    if (!blockingEnabled) return originalWindowOpen(url, target, features);
    const urlStr = (url || '').toString().trim();
    if (!urlStr || urlStr === '' || urlStr.toLowerCase() === 'about:blank') return null;
    if (isKnownAdUrl(urlStr)) return null;
    const hostname = getHostname(urlStr);
    if (isTrustedDomain(hostname)) return originalWindowOpen(url, target, features);
    if (hasRecentTrustedGesture()) return originalWindowOpen(url, target, features);
    showPopupToast(urlStr, () => originalWindowOpen(url, target, features), () => {});
    return null;
  };

  const originalSetTimeout = window.setTimeout.bind(window);
  const originalSetInterval = window.setInterval.bind(window);

  (window as any).setTimeout = function(fn: TimerHandler, delay?: number, ...args: any[]): number {
    const capturedGestureTime = lastTrustedGestureTime;
    return originalSetTimeout(function() {
      if (lastTrustedGestureTime === capturedGestureTime && delay && delay > 100) lastTrustedGestureTime = 0;
      if (typeof fn === 'function') fn(...args);
      else (new Function(fn as string))();
    }, delay);
  };

  (window as any).setInterval = function(fn: TimerHandler, delay?: number, ...args: any[]): number {
    return originalSetInterval(function() {
      if (delay && delay > 100) lastTrustedGestureTime = 0;
      if (typeof fn === 'function') fn();
    }, delay);
  };

  // ===========================================
  // 2. PUSH NOTIFICATION BLOCKING
  // ===========================================
  if ('Notification' in window) {
    const OriginalNotification = window.Notification;
    const FakeNotification = function(this: any, title: string, options?: NotificationOptions) {
      if (!blockingEnabled) return new OriginalNotification(title, options);
    } as any;
    FakeNotification.permission = 'denied';
    FakeNotification.requestPermission = () => Promise.resolve('denied' as NotificationPermission);
    FakeNotification.prototype = OriginalNotification.prototype;
    window.Notification = FakeNotification;
  }

  if ('serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = function(scriptURL: string | URL, options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
      if (!blockingEnabled) return originalRegister(scriptURL, options);
      const urlStr = scriptURL.toString().toLowerCase();
      if (urlStr.includes('push') || urlStr.includes('notification') || urlStr.includes('onesignal')) {
        return Promise.reject(new Error('Push SW blocked by Echo'));
      }
      return originalRegister(scriptURL, options);
    };
  }

  // ===========================================
  // 3. ANTI-ADBLOCK DETECTION BYPASS
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
            pubads: function() { return { refresh: function() {}, setTargeting: function() { return this; }, addEventListener: function() {} }; },
            enableServices: function() {}, display: function() {},
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

  (window as any).ga = function() {};
  (window as any).gtag = function() {};
  (window as any).__ga_disable = true;
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

  // ===========================================
  // 4. YOUTUBE AD HANDLER
  //
  // Strategy: never touch the video player elements.
  // - Auto-click the skip button the moment it becomes visible.
  // - Fast-forward non-skippable ads via video.currentTime.
  // - Only hide floating overlay banners that sit above the player
  //   and have no effect on playback or controls.
  // ===========================================
  function handleYouTubeAds(): void {
    if (!blockingEnabled || !IS_YOUTUBE) return;

    // 4a. Auto-click skip button — check all known selector variants
    const skipSelectors = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-slot button',
    ];
    for (const sel of skipSelectors) {
      const btn = document.querySelector<HTMLElement>(sel);
      // offsetParent is null when element is hidden — only click a visible button
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return; // One click per cycle is enough
      }
    }

    // 4b. Non-skippable ad: fast-forward the video element to its end.
    // Only do this when an ad badge is visible so we don't fast-forward
    // the main video by accident.
    const adBadge = document.querySelector(
      '.ytp-ad-simple-ad-badge, .ytp-ad-duration-remaining, .ytp-ad-badge'
    );
    if (adBadge) {
      const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
      if (video && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      }
    }

    // 4c. Remove floating overlay banners — safe because these are absolutely-
    // positioned elements rendered on top of the player, not part of it.
    const safeOverlaySelectors = [
      '.ytp-ad-overlay-container',       // bottom-left banner overlay
      '.ytp-ad-text-overlay',            // text overlay on video
      '.ytp-ad-image-overlay',           // image overlay on video
      '.ytp-suggested-action',           // "Visit advertiser" button
      '.ytp-ad-overlay-close-container', // overlay close button
    ];
    for (const sel of safeOverlaySelectors) {
      document.querySelectorAll<HTMLElement>(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    }
  }

  // ===========================================
  // 5. INTERSTITIAL/OVERLAY REMOVAL
  //    Skipped on YouTube — the DOM is too large
  //    for this sweep to be performant, and YouTube
  //    doesn't use the interstitial pattern anyway.
  // ===========================================
  function removeInterstitials(): void {
    if (!blockingEnabled) return;
    if (IS_YOUTUBE) return; // ← Performance guard

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
      document.querySelectorAll(selector).forEach(function(el) { el.remove(); });
    });

    if (document.body?.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
  }

  // ===========================================
  // 6. VIDEO AD REMOVAL
  //    YouTube player elements are intentionally
  //    excluded here — they are handled exclusively
  //    by handleYouTubeAds() to avoid breaking the
  //    player or hiding the skip button.
  // ===========================================
  function removeVideoAds(): void {
    if (!blockingEnabled) return;
    const videoAdSelectors = [
      // Generic non-YouTube selectors only
      '.video-ads:not(.ytp-ad-module)',
      '.videoAdUi',
      '[class*="video-ad"]:not([class*="ytp"])',
    ];
    videoAdSelectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  // ===========================================
  // 7. BANNER AD REMOVAL
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
  // 8. PUSH AD REMOVAL
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
  // 9. DIRECT LINK AD BLOCKING
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
      }
    }
  }, true);

  // ===========================================
  // 10. ANTI-ADBLOCK DETECTION BYPASS (DOM)
  //     Skipped on YouTube — the observer fires
  //     on every player mutation which is constant.
  // ===========================================
  function bypassAlternateContentDetection(): void {
    if (!blockingEnabled || IS_YOUTUBE) return; // ← Performance guard

    const adClassPatterns = [
      'ad-widget', 'adbox', 'adsbox', 'ad-container',
      'advertisement', 'adsbygoogle', 'banner_ads',
      'ad-placeholder', 'ad-slot', 'ad-unit'
    ];

    const obs = new MutationObserver(() => {
      adClassPatterns.forEach(pattern => {
        document.querySelectorAll(`[class*="${pattern}"]`).forEach(el => {
          const htmlEl = el as HTMLElement;
          if (getComputedStyle(htmlEl).display === 'none') {
            Object.defineProperty(htmlEl, 'offsetHeight', { get: () => 1, configurable: true });
            Object.defineProperty(htmlEl, 'offsetWidth',  { get: () => 1, configurable: true });
          }
        });
      });
    });

    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // ===========================================
  // 11. MAIN EXECUTION
  // ===========================================
  function runBlockers(): void {
    if (!blockingEnabled) return;
    removeInterstitials(); // no-op on YouTube
    removeVideoAds();
    removeBannerAds();
    removePushAds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runBlockers();
      handleYouTubeAds();
    });
  } else {
    runBlockers();
    handleYouTubeAds();
  }

  // General MutationObserver for dynamically injected content
  const observer = new MutationObserver(function(mutations) {
    if (!blockingEnabled) return;
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
    if (!hasAddedNodes) return;
    runBlockers();
    handleYouTubeAds();
  });

  function startObserver(): void {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 10);
    }
  }
  startObserver();

  // General interval — increased from 1500ms to 3000ms to reduce CPU load.
  // YouTube skip logic gets its own faster dedicated interval below.
  setInterval(runBlockers, 3000);

  // YouTube-specific fast interval just for skip-button detection.
  // Separate from the general interval so other sites are not affected.
  // 600ms is fast enough to click the button before the user notices it,
  // without being so frequent it impacts player frame budget.
  if (IS_YOUTUBE) {
    setInterval(handleYouTubeAds, 600);
  }

  console.log('[Echo AdBlock] ✓ MAIN world script ready — awaiting enable signal');
})();