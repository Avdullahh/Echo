/**
 * Cookie Banner Detection Filters
 * Comprehensive list of selectors and patterns for detecting cookie consent banners
 */

// Common cookie banner container selectors
export const COOKIE_BANNER_SELECTORS = [
  // OneTrust
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '.onetrust-pc-dark-filter',
  '[class*="onetrust"]',

  // CookieBot
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBodyUnderlay',
  '.CookieConsent',

  // Termly
  '#termly-code-snippet-support',
  '[data-name="termly-consent-banner"]',

  // Osano
  '.osano-cm-dialog',
  '.osano-cm-widget',

  // TrustArc
  '#truste-consent-track',
  '#teconsent',

  // Cookielaw (OneTrust variant)
  '#cookielaw',
  '.cookielaw',

  // Quantcast Choice
  '#qc-cmp2-container',
  '.qc-cmp2-container',

  // Cookie Notice Plugin
  '#cookie-notice',
  '.cookie-notice-container',

  // GDPR Cookie Consent
  '.gdpr-cookie-notice',
  '.gdpr-wrapper',

  // Evidon
  '#_evidon_banner',
  '#_evidon-barrier-wrapper',

  // Generic patterns (be conservative)
  '[class*="cookie-banner"]',
  '[class*="cookie-consent"]',
  '[class*="cookie-notice"]',
  '[class*="cookie-bar"]',
  '[class*="cookiebar"]',
  '[id*="cookie-banner"]',
  '[id*="cookie-consent"]',
  '[id*="cookie-notice"]',
  '[id*="gdpr"]',
  '[id*="privacy-notice"]',
  '[aria-label*="cookie" i]',
  '[aria-label*="consent" i]',

  // Common container classes
  '.cc-window',
  '.cc-banner',
  '.cookie-modal',
  '.consent-modal'
];

// Button text patterns for "Accept Necessary Only" or "Reject All"
export const NECESSARY_ONLY_PATTERNS = [
  // English - Reject variants
  /reject\s+all/i,
  /reject\s+optional/i,
  /decline\s+all/i,
  /decline\s+optional/i,
  /deny\s+all/i,
  /refuse\s+all/i,

  // English - Necessary/Essential variants
  /necessary\s+only/i,
  /essential\s+only/i,
  /required\s+only/i,
  /accept\s+necessary/i,
  /accept\s+essential/i,
  /accept\s+required/i,
  /use\s+necessary/i,
  /use\s+essential/i,

  // English - Specific phrases from major platforms
  /reject\s+non-essential/i,
  /decline\s+non-essential/i,
  /essential\s+cookies?\s+only/i,
  /necessary\s+cookies?\s+only/i,
  /minimum/i,
  /continue\s+without\s+accepting/i,
  /no\s+thanks/i,
  /i\s+decline/i,

  // German
  /nur\s+notwendige/i,
  /nur\s+erforderliche/i,
  /alle\s+ablehnen/i,
  /ablehnen/i,
  /nicht\s+akzeptieren/i,

  // French
  /seulement\s+nécessaires/i,
  /essentiels\s+seulement/i,
  /refuser\s+tout/i,
  /tout\s+refuser/i,
  /continuer\s+sans\s+accepter/i,

  // Spanish
  /solo\s+necesarias/i,
  /rechazar\s+todas/i,
  /denegar\s+todas/i,
  /rechazar/i,

  // Italian
  /solo\s+necessari/i,
  /rifiuta\s+tutti/i,
  /rifiuta/i,

  // Dutch
  /alleen\s+noodzakelijk/i,
  /alles\s+weigeren/i,
  /weigeren/i,

  // Portuguese
  /apenas\s+necessários/i,
  /rejeitar\s+todos/i,
  /rejeitar/i
];

// Button text patterns for "Accept All" (we avoid clicking these)
export const ACCEPT_ALL_PATTERNS = [
  // English
  /accept\s+all/i,
  /allow\s+all/i,
  /agree/i,
  /consent/i,
  /ok/i,
  /i\s+understand/i,
  /got\s+it/i,

  // German
  /alle\s+akzeptieren/i,
  /zustimmen/i,

  // French
  /tout\s+accepter/i,
  /accepter/i,

  // Spanish
  /aceptar\s+todas/i,
  /aceptar/i,

  // Italian
  /accetta\s+tutti/i,
  /accettare/i,

  // Dutch
  /alles\s+accepteren/i,
  /akkoord/i,

  // Portuguese
  /aceitar\s+todos/i,
  /aceitar/i
];

// Settings/Customize button patterns (we might use these to find the necessary-only option)
export const SETTINGS_PATTERNS = [
  /settings/i,
  /customize/i,
  /preferences/i,
  /options/i,
  /manage/i,
  /einstellungen/i,
  /anpassen/i,
  /paramètres/i,
  /personalizar/i,
  /impostazioni/i,
  /configurações/i
];

// Overlay/backdrop selectors to hide
export const OVERLAY_SELECTORS = [
  '[class*="cookie"][class*="overlay"]',
  '[class*="cookie"][class*="backdrop"]',
  '[class*="consent"][class*="overlay"]',
  '[class*="consent"][class*="backdrop"]',
  '.modal-backdrop',
  '.cdk-overlay-backdrop'
];
