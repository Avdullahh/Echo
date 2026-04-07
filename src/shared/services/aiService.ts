import { buildFullProfile } from './profileAnalyzer';

// ---------------------------------------------------------------------------
// Formats a category key from camelCase to readable label
// e.g. "socialMedia" → "Social Media", "tech" → "Tech"
// ---------------------------------------------------------------------------
function formatCategory(raw: string): string {
  return raw
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Converts a raw tracker domain into a readable company name
// e.g. "browser.events.data.microsoft.com" → "Microsoft"
// Falls back to capitalising the most recognisable part of the domain
// ---------------------------------------------------------------------------
function friendlyCompanyName(domain: string): string {
  const knownMap: Record<string, string> = {
    // Google ecosystem
    'google': 'Google', 'doubleclick': 'Google', 'googlesyndication': 'Google',
    'googletagmanager': 'Google', 'googletagservices': 'Google',
    'googleadservices': 'Google', 'googlevideo': 'Google', 'gstatic': 'Google',
    'googleapis': 'Google', 'googleusercontent': 'Google', 'gmail': 'Google',
    'youtube': 'Google', 'ytimg': 'Google', 'ggpht': 'Google',

    // Meta ecosystem
    'facebook': 'Meta', 'meta': 'Meta', 'instagram': 'Meta',
    'whatsapp': 'Meta', 'threads': 'Meta', 'fbcdn': 'Meta',
    'fbsbx': 'Meta', 'atdmt': 'Meta',

    // Microsoft ecosystem
    'microsoft': 'Microsoft', 'bing': 'Microsoft', 'msn': 'Microsoft',
    'live': 'Microsoft', 'outlook': 'Microsoft', 'hotmail': 'Microsoft',
    'azure': 'Microsoft', 'msecnd': 'Microsoft', 'msocdn': 'Microsoft',
    'office': 'Microsoft', 'sharepoint': 'Microsoft', 'linkedin': 'Microsoft',
    'bat.bing': 'Microsoft', 'clarity': 'Microsoft',

    // Amazon ecosystem
    'amazon': 'Amazon', 'amazon-adsystem': 'Amazon', 'amazonwebservices': 'Amazon',
    'amazonaws': 'Amazon', 'cloudfront': 'Amazon', 'alexa': 'Amazon',
    'twitch': 'Amazon', 'audible': 'Amazon', 'goodreads': 'Amazon',

    // Apple
    'apple': 'Apple', 'icloud': 'Apple', 'itunes': 'Apple',
    'mzstatic': 'Apple', 'aaplimg': 'Apple',

    // TikTok / ByteDance
    'tiktok': 'TikTok', 'bytedance': 'TikTok', 'tiktokcdn': 'TikTok',
    'musical.ly': 'TikTok', 'tik.tok': 'TikTok',

    // Twitter / X
    'twitter': 'X (Twitter)', 'twimg': 'X (Twitter)', 't.co': 'X (Twitter)',
    'ads-twitter': 'X (Twitter)',

    // Snapchat
    'snapchat': 'Snapchat', 'snap.com': 'Snapchat', 'sc-cdn': 'Snapchat',

    // Pinterest
    'pinterest': 'Pinterest', 'pinimg': 'Pinterest',

    // Reddit
    'reddit': 'Reddit', 'redd.it': 'Reddit', 'redditmedia': 'Reddit',
    'redditusercontentcdn': 'Reddit',

    // Adobe
    'adobe': 'Adobe', 'omtrdc': 'Adobe', 'demdex': 'Adobe',
    'adobedtm': 'Adobe', '2o7': 'Adobe', 'everesttech': 'Adobe',
    'marketo': 'Adobe', 'scene7': 'Adobe',

    // Advertising networks
    'criteo': 'Criteo', 'hotjar': 'Hotjar', 'taboola': 'Taboola',
    'outbrain': 'Outbrain', 'pubmatic': 'PubMatic', 'openx': 'OpenX',
    'quantcast': 'Quantcast', 'comscore': 'Comscore', 'nielsen': 'Nielsen',
    'rubiconproject': 'Magnite', 'magnite': 'Magnite',
    'casalemedia': 'Index Exchange', 'indexexchange': 'Index Exchange',
    'appnexus': 'Xandr', 'xandr': 'Xandr',
    'adnxs': 'Xandr', 'mediamath': 'MediaMath',
    'tradedesk': 'The Trade Desk', 'adsrvr': 'The Trade Desk',
    'liveramp': 'LiveRamp', 'rlcdn': 'LiveRamp',
    'sharetthrough': 'Sharethrough', 'sharethrough': 'Sharethrough',
    'triplelift': 'TripleLift', 'spotxchange': 'SpotX', 'spotx': 'SpotX',
    'teads': 'Teads', 'yieldmo': 'Yieldmo', 'sovrn': 'Sovrn',
    'contextweb': 'Playwire', 'pulsepoint': 'PulsePoint',
    'undertone': 'Undertone', 'rhythmone': 'RhythmOne',
    '33across': '33Across', 'smartadserver': 'Smart AdServer',
    'improvedigital': 'Improve Digital', 'emxdgt': 'EMX Digital',
    'appier': 'Appier', 'adform': 'Adform', 'adroll': 'AdRoll',
    'turn': 'Amobee', 'amobee': 'Amobee',

    // Analytics
    'scorecardresearch': 'Comscore', 'chartbeat': 'Chartbeat',
    'parsely': 'Parse.ly', 'newrelic': 'New Relic',
    'segment': 'Segment', 'mixpanel': 'Mixpanel', 'amplitude': 'Amplitude',
    'fullstory': 'FullStory', 'logrocket': 'LogRocket',
    'mouseflow': 'Mouseflow', 'crazyegg': 'Crazy Egg',
    'luckyorange': 'Lucky Orange', 'inspectlet': 'Inspectlet',
    'heap': 'Heap', 'intercom': 'Intercom', 'drift': 'Drift',
    'hubspot': 'HubSpot', 'pardot': 'Salesforce',
    'salesforce': 'Salesforce', 'eloqua': 'Oracle',

    // CDN / Infrastructure that tracks
    'cloudflare': 'Cloudflare', 'fastly': 'Fastly',
    'akamai': 'Akamai', 'akamaized': 'Akamai',
    'edgekey': 'Akamai', 'edgesuite': 'Akamai',

    // Social login / identity
    'auth0': 'Auth0', 'okta': 'Okta', 'onelogin': 'OneLogin',

    // News & media trackers
    'permutive': 'Permutive',
    'onetrust': 'OneTrust', 'cookielaw': 'OneTrust',
    'trustarc': 'TrustArc', 'quantserve': 'Quantcast',

    // Shopping & retail
    'shopify': 'Shopify', 'shopifycdn': 'Shopify',
    'ebay': 'eBay', 'etsy': 'Etsy', 'walmart': 'Walmart',
    'target': 'Target', 'bestbuy': 'Best Buy',

    // Entertainment & streaming
    'netflix': 'Netflix', 'nflximg': 'Netflix', 'nflxvideo': 'Netflix',
    'spotify': 'Spotify', 'scdn': 'Spotify',
    'disneyplus': 'Disney+', 'disney': 'Disney',
    'hulu': 'Hulu', 'hbomax': 'HBO Max', 'max.com': 'HBO Max',
    'peacocktv': 'Peacock', 'paramountplus': 'Paramount+',

    // Gaming
    'steam': 'Steam', 'steampowered': 'Steam',
    'epicgames': 'Epic Games', 'ea.com': 'EA',
    'riotgames': 'Riot Games', 'blizzard': 'Blizzard',
    'ubisoft': 'Ubisoft', 'rockstargames': 'Rockstar Games',
    'xbox': 'Xbox', 'playstation': 'PlayStation', 'nintendo': 'Nintendo',

    // Finance
    'paypal': 'PayPal', 'paypalobjects': 'PayPal',
    'stripe': 'Stripe', 'braintree': 'Braintree',
    'coinbase': 'Coinbase', 'binance': 'Binance',
    'revolut': 'Revolut', 'monzo': 'Monzo',

    // Travel
    'booking': 'Booking.com', 'airbnb': 'Airbnb',
    'expedia': 'Expedia', 'tripadvisor': 'TripAdvisor',
    'skyscanner': 'Skyscanner', 'kayak': 'Kayak',

    // Food delivery
    'ubereats': 'Uber Eats', 'uber': 'Uber',
    'deliveroo': 'Deliveroo', 'justeat': 'Just Eat',
    'doordash': 'DoorDash',

    // Productivity & comms
    'slack': 'Slack', 'zoom': 'Zoom', 'notion': 'Notion',
    'atlassian': 'Atlassian', 'jira': 'Atlassian',
    'confluence': 'Atlassian', 'dropbox': 'Dropbox',

    // Developer tools
    'github': 'GitHub', 'gitlab': 'GitLab',
    'stackoverflow': 'Stack Overflow', 'npmjs': 'npm',
    'vercel': 'Vercel', 'netlify': 'Netlify',
    'heroku': 'Heroku', 'digitalocean': 'DigitalOcean',
  };

  const lower = domain.toLowerCase();
  for (const [key, name] of Object.entries(knownMap)) {
    if (lower.includes(key)) return name;
  }

  // Fall back to the second-level domain, capitalised
  const parts = domain.replace(/^www\./, '').split('.');
  const meaningful = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return meaningful.charAt(0).toUpperCase() + meaningful.slice(1);
}

// ---------------------------------------------------------------------------
// Maps riskLevel + trackingIntensity into a single plain-English summary
// that a non-technical user immediately understands
// ---------------------------------------------------------------------------
function buildRiskSummary(
  riskLevel: string,
  trackingIntensity: string,
): string {
  if (riskLevel === 'Critical' || trackingIntensity === 'Extreme') {
    return `You are heavily tracked. Advertisers have built a detailed profile of your online behaviour.`;
  }
  if (riskLevel === 'High' || trackingIntensity === 'Heavy') {
    return `You are significantly tracked across multiple sites. Your browsing habits are being used to target you with ads.`;
  }
  if (riskLevel === 'Medium' || trackingIntensity === 'Moderate') {
    return `Some tracking is happening. Advertisers have a partial picture of your interests based on your browsing.`;
  }
  return `Low tracking detected. You have a limited advertising profile at this time.`;
}

// ---------------------------------------------------------------------------
// Main export — returns clean, human-readable markdown
// ---------------------------------------------------------------------------
export const analyzePrivacyFootprint = async (
  topCompanies: { name: string; count: number }[],
  categories: { label: string; percent: number }[],
  recentActivity: any[]
): Promise<string> => {

  if (!topCompanies || topCompanies.length === 0) {
    return [
      `**No data yet**`,
      ``,
      `Browse the web with Echo active and come back — your digital profile will appear here.`,
    ].join('\n');
  }

  if (!categories || categories.length === 0) {
    return [
      `**Still building your profile**`,
      ``,
      `Keep browsing with Echo running. More data is needed to infer your profile accurately.`,
    ].join('\n');
  }

  try {
    const profile = buildFullProfile(topCompanies, categories);

    // Clean up company names — no raw domains shown to users
    const readableTrackers = profile.trackerCompanies
      .map(friendlyCompanyName)
      .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
      .slice(0, 3);

    // Clean up category labels — no camelCase shown to users
    const readableInterests = profile.dominantCategories
      .map(cat => {
        // dominantCategories are formatted as "Tech (42%)" — strip the percentage
        // and reformat the category name
        const name = cat.split('(')[0].trim();
        return formatCategory(name);
      })
      .slice(0, 3);

    const lines: string[] = [
      // Identity
      `**${profile.personaEmoji} ${profile.personaTitle}**`,
      ``,
      // One plain-English sentence about what this means
      buildRiskSummary(profile.riskLevel, profile.trackingIntensity),
      ``,
      // Why they are targeted — already plain English from profileAnalyzer
      profile.whyTargeted,
      ``,
    ];

    // What advertisers think they're interested in
    if (readableInterests.length > 0) {
      lines.push(`**Advertisers think you're interested in:** ${readableInterests.join(', ')}`);
    }

    // Which companies are watching
    if (readableTrackers.length > 0) {
      lines.push(`**Who is tracking you:** ${readableTrackers.join(', ')}`);
    }

    // Data value — simplified label only, no CPM jargon
    const valueLabel =
      profile.dataValue === 'Very High' ? 'very valuable to advertisers' :
      profile.dataValue === 'High'      ? 'valuable to advertisers' :
      profile.dataValue === 'Medium'    ? 'moderately valuable to advertisers' :
                                          'not yet highly valuable to advertisers';
    lines.push(`**Your data is:** ${valueLabel}`);
    lines.push(``);
    lines.push(`*Your profile is built from your browsing history. No data leaves your device.*`);

    return lines.filter(line => line !== undefined).join('\n');

  } catch (error: any) {
    console.error("Profile Analysis Error:", error);
    return `**Could not generate profile**\n\nSomething went wrong. Please try again.`;
  }
};