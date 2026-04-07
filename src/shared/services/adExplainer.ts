/**
 * adExplainer.ts
 * Generates a plain-English explanation of why ads appeared on the current page.
 * FR4: "Present a non-technical explanation of why a particular ad was shown."
 *
 * Pure function — no side effects, no API calls, no storage access.
 * All inputs come from what background/index.ts already saves to chrome.storage.
 */

import { TrackerEvent } from '../types/index';

export interface AdExplanation {
  /** One or two sentence plain-English explanation shown in the popup. */
  sentence: string;
  /** The single most significant tracker company on this page. */
  topCompany: string;
  /** How many distinct sites this company has tracked the user across. */
  siteCount: number;
  /** Inferred interest category label, e.g. "Tech Shopper". */
  inferredCategory: string;
  /** The source websites that contributed to the inference. */
  contributingSites: string[];
}

// ---------------------------------------------------------------------------
// Domain → human-readable company name mapping
// Covers the most common trackers background/index.ts will encounter.
// ---------------------------------------------------------------------------
const COMPANY_NAMES: Record<string, string> = {
  'doubleclick.net':          'Google (DoubleClick)',
  'adservice.google.com':     'Google Ads',
  'analytics.google.com':     'Google Analytics',
  'googletagmanager.com':     'Google Tag Manager',
  'googlesyndication.com':    'Google AdSense',
  'facebook.net':             'Meta (Facebook)',
  'connect.facebook.net':     'Meta (Facebook)',
  'criteo.com':               'Criteo',
  'hotjar.com':               'Hotjar',
  'tiktok.com':               'TikTok',
  'ads.tiktok.com':           'TikTok Ads',
  'bing.com':                 'Microsoft (Bing)',
  'bat.bing.com':             'Microsoft Ads',
  'amazon-adsystem.com':      'Amazon Ads',
  'scorecardresearch.com':    'Comscore',
  'quantserve.com':           'Quantcast',
  'taboola.com':              'Taboola',
  'outbrain.com':             'Outbrain',
  'pubmatic.com':             'PubMatic',
  'rubiconproject.com':       'Magnite',
  'openx.net':                'OpenX',
  'casalemedia.com':          'Index Exchange',
};

// ---------------------------------------------------------------------------
// Site patterns → inferred interest category
// Matches against sourceWebsite values saved by background/index.ts.
// ---------------------------------------------------------------------------
import { CATEGORY_PATTERNS } from '../constants/categoryKeywords';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveCompanyName(event: TrackerEvent): string {
  if (event.company && event.company !== 'Unknown') return event.company;
  for (const [pattern, name] of Object.entries(COMPANY_NAMES)) {
    if (event.domain.includes(pattern)) return name;
  }
  // Capitalise the second-level domain as a fallback
  const parts = event.domain.replace(/^www\./, '').split('.');
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

function inferCategory(sourceSites: string[]): string {
  const joined = sourceSites.join(' ').toLowerCase();
  for (const { keywords, label } of CATEGORY_PATTERNS) {
    if (keywords.some(kw => joined.includes(kw))) return label;
  }
  return 'General Browser';
}

function cleanSiteName(raw: string): string {
  return raw.replace(/^www\./, '').split('/')[0];
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Given all stored tracker events and the hostname of the current tab,
 * returns a plain-English explanation of why ads appeared on this page.
 *
 * @param allEvents   Full detectedTrackers array from chrome.storage.local
 * @param currentHost The hostname of the active tab (e.g. "bbc.com")
 */
export function explainAds(
  allEvents: TrackerEvent[],
  currentHost: string
): AdExplanation | null {
  if (allEvents.length === 0) return null;

  // 1. Find events fired ON the current page
  const pageEvents = allEvents.filter(e =>
    cleanSiteName(e.sourceWebsite || '') === cleanSiteName(currentHost)
  );

  // If nothing was detected on this exact page, work from all events
  // so the popup is never empty.
  const relevantEvents = pageEvents.length > 0 ? pageEvents : allEvents.slice(0, 30);

  // 2. Find the most frequent company across all stored events
  //    (cross-site reach is the key insight for FR4)
  const companySiteCounts: Record<string, Set<string>> = {};
  for (const e of allEvents) {
    const name = resolveCompanyName(e);
    if (!companySiteCounts[name]) companySiteCounts[name] = new Set();
    companySiteCounts[name].add(cleanSiteName(e.sourceWebsite || 'unknown'));
  }

  // Pick the company with the widest site reach that also appeared on this page
  const pageCompanies = new Set(relevantEvents.map(resolveCompanyName));
  let topCompany = '';
  let topSiteCount = 0;

  for (const [company, sites] of Object.entries(companySiteCounts)) {
    if (pageCompanies.has(company) && sites.size > topSiteCount) {
      topCompany = company;
      topSiteCount = sites.size;
    }
  }

  // Fallback: just use the most frequent company overall
  if (!topCompany) {
    for (const [company, sites] of Object.entries(companySiteCounts)) {
      if (sites.size > topSiteCount) {
        topCompany = company;
        topSiteCount = sites.size;
      }
    }
  }

  // 3. Collect the distinct source sites that contributed to profiling
  const contributingSites = Array.from(
    new Set(relevantEvents.map(e => cleanSiteName(e.sourceWebsite || 'unknown')))
  ).filter(s => s !== 'unknown' && s !== cleanSiteName(currentHost)).slice(0, 3);

  // 4. Infer the interest category from source sites
  const allSites = Array.from(
    new Set(allEvents.map(e => cleanSiteName(e.sourceWebsite || '')))
  );
  const inferredCategory = inferCategory(allSites);

  // 5. Build the plain-English sentence
  let sentence: string;

  if (topSiteCount > 1 && contributingSites.length > 0) {
    sentence =
      `${topCompany} has tracked you across ${topSiteCount} site${topSiteCount !== 1 ? 's' : ''}. ` +
      `You were categorised as a "${inferredCategory}" based on visits to ${contributingSites.join(', ')}.`;
  } else if (topSiteCount > 1) {
    sentence =
      `${topCompany} has tracked you across ${topSiteCount} site${topSiteCount !== 1 ? 's' : ''}, ` +
      `building a "${inferredCategory}" profile to target ads on this page.`;
  } else if (pageEvents.length > 0) {
    sentence =
      `${topCompany} detected on this page. ` +
      `Your browsing pattern has been categorised as "${inferredCategory}".`;
  } else {
    sentence =
      `Ads on this page are likely targeted based on your "${inferredCategory}" browsing profile ` +
      `tracked by ${topCompany}.`;
  }

  return { sentence, topCompany, siteCount: topSiteCount, inferredCategory, contributingSites };
}