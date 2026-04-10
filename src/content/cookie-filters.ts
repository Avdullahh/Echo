/**
 * cookie-filters.ts
 * Pattern definitions for cookie banner detection and handling.
 * Separated from logic so patterns can be updated independently.
 */

// ---------------------------------------------------------------------------
// BANNER DETECTION SELECTORS
// Used to find the cookie banner container element on the page
// ---------------------------------------------------------------------------
export const COOKIE_BANNER_SELECTORS = [
  // ID-based
  '#cookie-banner',
  '#cookie-consent',
  '#cookie-notice',
  '#cookie-bar',
  '#cookie-policy',
  '#cookiebanner',
  '#cookieconsent',
  '#cookie-popup',
  '#cookie-modal',
  '#gdpr-banner',
  '#gdpr-consent',
  '#gdpr-popup',
  '#consent-banner',
  '#consent-popup',
  '#consent-modal',
  '#privacy-banner',
  '#privacy-notice',
  '#privacy-popup',
  '#cc-window',
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '#onetrust-pc-sdk',
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBody',
  '#cookieConsentModal',
  '#sp_message_container',
  '#didomi-popup',
  '#didomi-notice',
  '#didomi-host',
  '#usercentrics-root',
  '#cmp-root',
  '#cmp-container',
  '#gdpr-cookie-consent',
  '#cookie_notice',
  '#cookie-law-info-bar',

  // Class-based
  '.cookie-banner',
  '.cookie-consent',
  '.cookie-notice',
  '.cookie-bar',
  '.cookie-popup',
  '.cookie-modal',
  '.cookie-dialog',
  '.cookie-wall',
  '.cookie-overlay',
  '.gdpr-banner',
  '.gdpr-consent',
  '.gdpr-popup',
  '.consent-banner',
  '.consent-popup',
  '.consent-modal',
  '.consent-dialog',
  '.privacy-banner',
  '.privacy-notice',
  '.cc-window',
  '.cc-banner',
  '.cc-dialog',
  '.cmp-popup',
  '.cmp-dialog',

  // Attribute-based
  '[aria-label*="cookie" i]',
  '[aria-label*="consent" i]',
  '[aria-label*="privacy" i]',
  '[aria-describedby*="cookie" i]',
  '[role="dialog"][aria-label*="cookie" i]',
  '[role="dialog"][aria-label*="consent" i]',
  '[role="dialog"][aria-label*="privacy" i]',
  '[role="alertdialog"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="consent" i]',

  // Generic class fragments — lower priority
  '[class*="cookie-banner"]',
  '[class*="cookie-consent"]',
  '[class*="cookie-notice"]',
  '[class*="cookie-popup"]',
  '[class*="cookie-dialog"]',
  '[class*="cookie-modal"]',
  '[class*="consent-banner"]',
  '[class*="consent-dialog"]',
  '[class*="privacy-banner"]',
  '[class*="privacy-notice"]',
  '[class*="cookie-notification"]',
  '[class*="data-processing"]',
  '[class*="gdpr-banner"]',
  '[class*="privacy-consent"]',
];

// ---------------------------------------------------------------------------
// REJECT ALL PATTERNS — Priority 1
// Explicit rejections — user opts out of all non-essential cookies
// ---------------------------------------------------------------------------
export const REJECT_ALL_PATTERNS = [
  // English
  /^reject\s+all$/i,
  /^decline\s+all$/i,
  /^deny\s+all$/i,
  /^refuse\s+all$/i,
  /^reject\s+optional$/i,
  /^decline\s+optional$/i,
  /^reject\s+non-essential$/i,
  /^decline\s+non-essential$/i,
  /^do\s+not\s+accept$/i,
  /^i\s+decline$/i,
  /^no\s+thanks$/i,
  /^continue\s+without\s+accepting$/i,
  /^continue\s+without\s+agreeing$/i,
  /^continue\s+without$/i,
  /reject\s+all/i,
  /decline\s+all/i,
  /deny\s+all/i,
  /refuse\s+all/i,
  /reject\s+non-essential/i,
  /decline\s+non-essential/i,

  // German
  /^alle\s+ablehnen$/i,
  /^ablehnen$/i,
  /^nicht\s+akzeptieren$/i,
  /alle\s+ablehnen/i,
  /ablehnen/i,

  // French
  /^tout\s+refuser$/i,
  /^refuser\s+tout$/i,
  /^continuer\s+sans\s+accepter$/i,
  /tout\s+refuser/i,
  /refuser\s+tout/i,

  // Spanish
  /^rechazar\s+todas$/i,
  /^denegar\s+todas$/i,
  /^rechazar$/i,
  /rechazar\s+todas/i,

  // Italian
  /^rifiuta\s+tutti$/i,
  /^rifiuta$/i,
  /rifiuta\s+tutti/i,

  // Dutch
  /^alles\s+weigeren$/i,
  /^weigeren$/i,
  /alles\s+weigeren/i,

  // Portuguese
  /^rejeitar\s+todos$/i,
  /^rejeitar$/i,
  /rejeitar\s+todos/i,
];

// ---------------------------------------------------------------------------
// NECESSARY ONLY PATTERNS — Priority 2
// Accept only essential/required cookies
// ---------------------------------------------------------------------------
export const NECESSARY_ONLY_PATTERNS = [
  // English
  /^necessary\s+only$/i,
  /^essential\s+only$/i,
  /^required\s+only$/i,
  /^only\s+necessary$/i,
  /^only\s+essential$/i,
  /^only\s+required$/i,
  /^accept\s+necessary$/i,
  /^accept\s+essential$/i,
  /^accept\s+required$/i,
  /^use\s+necessary$/i,
  /^use\s+essential$/i,
  /^essential\s+cookies?\s+only$/i,
  /^necessary\s+cookies?\s+only$/i,
  /necessary\s+only/i,
  /essential\s+only/i,
  /accept\s+necessary/i,
  /accept\s+essential/i,
  /only\s+necessary/i,
  /only\s+essential/i,
  /necessary\s+cookies?\s+only/i,
  /essential\s+cookies?\s+only/i,

  // German
  /^nur\s+notwendige$/i,
  /^nur\s+erforderliche$/i,
  /nur\s+notwendige/i,
  /nur\s+erforderliche/i,

  // French
  /^seulement\s+nécessaires$/i,
  /^essentiels\s+seulement$/i,
  /seulement\s+nécessaires/i,

  // Spanish
  /^solo\s+necesarias$/i,
  /solo\s+necesarias/i,

  // Italian
  /^solo\s+necessari$/i,
  /solo\s+necessari/i,

  // Dutch
  /^alleen\s+noodzakelijk$/i,
  /alleen\s+noodzakelijk/i,

  // Portuguese
  /^apenas\s+necessários$/i,
  /apenas\s+necessários/i,
];

// ---------------------------------------------------------------------------
// ACCEPT ALL PATTERNS
// Used to identify accept-all buttons so we know what we are dealing with
// NOTE: We never click these except as absolute last resort
// ---------------------------------------------------------------------------
export const ACCEPT_ALL_PATTERNS = [
  // English
  /^accept\s+all$/i,
  /^allow\s+all$/i,
  /^agree\s+to\s+all$/i,
  /^accept\s+all\s+cookies$/i,
  /^allow\s+all\s+cookies$/i,
  /^i\s+agree$/i,
  /^i\s+accept$/i,
  /^i\s+consent$/i,
  /^i\s+understand$/i,
  /^got\s+it$/i,
  /^ok$/i,
  /^okay$/i,
  /accept\s+all/i,
  /allow\s+all/i,
  /agree\s+to\s+all/i,

  // German
  /^alle\s+akzeptieren$/i,
  /^zustimmen$/i,
  /^allen\s+zustimmen$/i,
  /alle\s+akzeptieren/i,

  // French
  /^tout\s+accepter$/i,
  /^accepter\s+tout$/i,
  /^j'accepte$/i,
  /tout\s+accepter/i,

  // Spanish
  /^aceptar\s+todas?$/i,
  /^aceptar$/i,
  /aceptar\s+todas/i,

  // Italian
  /^accetta\s+tutti$/i,
  /^accettare$/i,
  /accetta\s+tutti/i,

  // Dutch
  /^alles\s+accepteren$/i,
  /^akkoord$/i,
  /alles\s+accepteren/i,

  // Portuguese
  /^aceitar\s+todos$/i,
  /^aceitar$/i,
  /aceitar\s+todos/i,
];

// ---------------------------------------------------------------------------
// OVERLAY SELECTORS
// Backdrop elements to remove when hiding a banner
// ---------------------------------------------------------------------------
export const OVERLAY_SELECTORS = [
  '[class*="cookie"][class*="overlay"]',
  '[class*="cookie"][class*="backdrop"]',
  '[class*="consent"][class*="overlay"]',
  '[class*="consent"][class*="backdrop"]',
  '.modal-backdrop',
  '.cdk-overlay-backdrop',
  '[class*="cookie"][class*="mask"]',
  '[class*="consent"][class*="mask"]',
];