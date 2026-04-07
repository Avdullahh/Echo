export interface TrackerSummary {
  name: string;
  count: number;
}
 
export interface WebsiteData {
  label: string;
  percent: number;
}
 
export interface DigitalProfile {
  // Core identity
  personaTitle: string;
  personaEmoji: string;
  whyTargeted: string;
 
  // Scores
  privacyScore: number;        // 0–100, LOWER is better
  confidenceScore: number;     // 0–100, how confident the inference is
  estimatedAdValue: string;    // e.g. "$4.20 CPM"
 
  // Classification
  dataValue: 'Low' | 'Medium' | 'High' | 'Very High';
  trackingIntensity: 'Light' | 'Moderate' | 'Heavy' | 'Extreme';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
 
  // Detail
  topInterests: string[];
  dominantCategories: string[];   // e.g. ["Tech (42%)", "News (28%)"]
  trackerCompanies: string[];     // top 3 named companies tracking you
  behavioralInsights: string[];   // plain-English observations
}
 
// ---------------------------------------------------------------------------
// Category keyword maps — broader than before
// ---------------------------------------------------------------------------
 
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  shopping:    ['amazon', 'ebay', 'etsy', 'shopify', 'asos', 'walmart', 'target',
                'bestbuy', 'argos', 'currys', 'johnlewis', 'next', 'zara', 'hm',
                'nike', 'adidas', 'shein', 'boohoo', 'wayfair', 'ikea', 'aliexpress',
                'vinted', 'depop', 'wish', 'shop', 'store', 'buy'],
  socialMedia: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'snapchat',
                'reddit', 'pinterest', 'tumblr', 'discord', 'telegram', 'whatsapp',
                'threads', 'bluesky', 'mastodon', 'quora'],
  video:       ['youtube', 'netflix', 'twitch', 'vimeo', 'dailymotion', 'disneyplus',
                'hulu', 'primevideo', 'appletv', 'hbomax', 'peacocktv', 'crunchyroll',
                'tubi', 'dazn', 'nowtv', 'channel4', 'itv', 'bbciplayer'],
  news:        ['bbc', 'cnn', 'guardian', 'nytimes', 'wsj', 'reuters', 'bloomberg',
                'forbes', 'theverge', 'techcrunch', 'wired', 'dailymail', 'telegraph',
                'independent', 'mirror', 'thesun', 'sky', 'aljazeera', 'washingtonpost',
                'huffpost', 'buzzfeed', 'vice', 'vox', 'economist', 'ft', 'newsweek', 'news'],
  tech:        ['github', 'stackoverflow', 'gitlab', 'npmjs', 'medium', 'dev',
                'hackernews', 'producthunt', 'digitalocean', 'vercel', 'netlify',
                'cloudflare', 'heroku', 'aws', 'azure', 'docker', 'figma', 'canva',
                'codepen', 'replit', 'notion', 'jira', 'confluence'],
  finance:     ['paypal', 'revolut', 'monzo', 'starling', 'hsbc', 'barclays', 'lloyds',
                'natwest', 'santander', 'halifax', 'nationwide', 'chase', 'coinbase',
                'binance', 'kraken', 'trading212', 'freetrade', 'moneysavingexpert',
                'comparethemarket', 'moneysupermarket', 'bank', 'investing', 'trading',
                'finance', 'crypto', 'stock'],
  gaming:      ['steam', 'epicgames', 'gog', 'xbox', 'playstation', 'nintendo',
                'ign', 'gamespot', 'polygon', 'eurogamer', 'pcgamer', 'riotgames',
                'blizzard', 'ea', 'ubisoft', 'rockstargames', 'twitch', 'gaming'],
  travel:      ['booking', 'airbnb', 'expedia', 'tripadvisor', 'skyscanner', 'kayak',
                'ryanair', 'easyjet', 'britishairways', 'virginatlantic', 'hotels',
                'hostelworld', 'lonelyplanet', 'timeout', 'travel', 'flight', 'holiday'],
  food:        ['ubereats', 'deliveroo', 'justeat', 'doordash', 'grubhub', 'instacart',
                'ocado', 'tesco', 'sainsburys', 'asda', 'morrisons', 'waitrose',
                'hellofresh', 'gousto', 'recipe', 'food', 'restaurant'],
  health:      ['nhs', 'webmd', 'healthline', 'mayoclinic', 'patient', 'myfitnesspal',
                'strava', 'garmin', 'peloton', 'headspace', 'calm', 'health',
                'fitness', 'medical', 'pharmacy', 'boots'],
  education:   ['coursera', 'udemy', 'edx', 'khanacademy', 'duolingo', 'skillshare',
                'pluralsight', 'futurelearn', 'openuniversity', 'chegg', 'learn',
                'university', 'college', 'ac.uk', 'edu'],
  sports:      ['bbc sport', 'skysports', 'espn', 'goal', 'premierleague', 'fifa',
                'nfl', 'nba', 'cricket', 'rugby', 'tennis', 'sport', 'athletic'],
};
 
// ---------------------------------------------------------------------------
// High-risk tracker companies (weighted for privacy score)
// ---------------------------------------------------------------------------
 
const HIGH_RISK_TRACKERS: Record<string, number> = {
  'google':     9,
  'doubleclick': 9,
  'facebook':   9,
  'meta':       9,
  'amazon':     7,
  'microsoft':  6,
  'criteo':     8,
  'hotjar':     7,
  'tiktok':     8,
  'twitter':    6,
  'linkedin':   6,
  'taboola':    7,
  'outbrain':   7,
  'pubmatic':   6,
  'openx':      6,
  'quantcast':  7,
  'comscore':   6,
};
 
// ---------------------------------------------------------------------------
// IAB audience CPM estimates (USD) by category
// ---------------------------------------------------------------------------
 
const CATEGORY_CPM: Record<string, number> = {
  finance:    12.0,
  shopping:    8.5,
  tech:        7.0,
  travel:      6.5,
  health:      6.0,
  gaming:      4.5,
  socialMedia: 4.0,
  video:       3.5,
  news:        3.0,
  food:        2.5,
  sports:      3.0,
  education:   2.0,
};
 
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
 
function getScore(websiteMap: Map<string, number>, keywords: string[]): number {
  let total = 0;
  websiteMap.forEach((percent, site) => {
    if (keywords.some(kw => site.includes(kw))) total += percent;
  });
  return Math.min(100, total);
}
 
function getCompanyRiskWeight(name: string): number {
  const lower = name.toLowerCase();
  for (const [key, weight] of Object.entries(HIGH_RISK_TRACKERS)) {
    if (lower.includes(key)) return weight;
  }
  return 3; // unknown company baseline
}
 
// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------
 
function buildCategoryScores(websiteMap: Map<string, number>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = getScore(websiteMap, keywords);
  }
  return scores;
}
 
function buildPersona(
  scores: Record<string, number>,
  topCompanies: TrackerSummary[]
): { title: string; emoji: string; reason: string } {
 
  // Sort categories by score descending
  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 10)
    .sort((a, b) => b[1] - a[1]);
 
  const top = ranked[0];
  const second = ranked[1];
 
  const topCompanyNames = topCompanies.slice(0, 3).map(c => c.name).join(', ');
 
  // Compound persona: if two signals are both strong (within 20 points of each other)
  if (top && second && second[1] >= top[1] * 0.65) {
    const compound = COMPOUND_PERSONAS[`${top[0]}+${second[0]}`]
      || COMPOUND_PERSONAS[`${second[0]}+${top[0]}`];
    if (compound) {
      return {
        title: compound.title,
        emoji: compound.emoji,
        reason: compound.reason(topCompanyNames),
      };
    }
  }
 
  // Single dominant persona
  if (top) {
    const single = SINGLE_PERSONAS[top[0]];
    if (single) {
      return {
        title: single.title,
        emoji: single.emoji,
        reason: single.reason(topCompanyNames),
      };
    }
  }
 
  // Fallback
  const hasGoogle = topCompanies.some(c => c.name.toLowerCase().includes('google'));
  const hasMeta = topCompanies.some(c =>
    c.name.toLowerCase().includes('facebook') || c.name.toLowerCase().includes('meta')
  );
 
  if (hasGoogle && hasMeta) {
    return {
      title: 'The Broadly Tracked User',
      emoji: '🕸️',
      reason: `Both Google and Meta are building profiles on you across multiple sites. Your browsing data is being aggregated by the two largest advertising networks simultaneously.`,
    };
  }
 
  return {
    title: 'The General Browser',
    emoji: '🌐',
    reason: `Your browsing patterns are varied. Trackers (${topCompanyNames || 'unknown companies'}) are monitoring your activity but haven't yet built a dominant interest profile.`,
  };
}
 
// ---------------------------------------------------------------------------
// Persona definitions
// ---------------------------------------------------------------------------
 
const SINGLE_PERSONAS: Record<string, {
  title: string;
  emoji: string;
  reason: (companies: string) => string;
}> = {
  shopping: {
    title: 'The Online Shopper',
    emoji: '🛍️',
    reason: (c) => `Your frequent e-commerce visits tell advertisers you're actively looking to buy. ${c} are tracking your purchase intent and will retarget you with product ads on unrelated sites.`,
  },
  socialMedia: {
    title: 'The Social Media Regular',
    emoji: '📱',
    reason: (c) => `Heavy social platform usage gives ${c} a detailed map of your interests, political leanings, and social connections — some of the most valuable data in digital advertising.`,
  },
  video: {
    title: 'The Content Streamer',
    emoji: '🎬',
    reason: (c) => `Your streaming habits reveal your entertainment preferences and viewing schedule. ${c} use this to place pre-roll and mid-roll ads timed to your routine.`,
  },
  news: {
    title: 'The News Reader',
    emoji: '📰',
    reason: (c) => `Regular news consumption exposes your political and regional interests. ${c} use reading patterns to infer your opinions and serve politically targeted ads.`,
  },
  tech: {
    title: 'The Tech Enthusiast',
    emoji: '💻',
    reason: (c) => `Developer and tech platform usage marks you as a high-value B2B target. ${c} will target you with SaaS products, developer tools, and premium tech subscriptions.`,
  },
  finance: {
    title: 'The Finance Browser',
    emoji: '💰',
    reason: (c) => `Financial site visits signal high purchasing power. ${c} categorise you as a premium target for investment products, credit cards, and financial services.`,
  },
  gaming: {
    title: 'The Gamer',
    emoji: '🎮',
    reason: (c) => `Gaming platform usage reveals your spending on digital entertainment. ${c} target you with in-game purchases, hardware, and subscription promotions.`,
  },
  travel: {
    title: 'The Travel Planner',
    emoji: '✈️',
    reason: (c) => `Travel site visits indicate upcoming purchase intent — one of the highest-value signals in advertising. ${c} will retarget you with flights, hotels, and insurance for weeks.`,
  },
  food: {
    title: 'The Food & Delivery Fan',
    emoji: '🍕',
    reason: (c) => `Food delivery and grocery browsing tells ${c} your dietary habits, location patterns, and household size — used to target FMCG and lifestyle ads.`,
  },
  health: {
    title: 'The Health-Conscious Browser',
    emoji: '🏃',
    reason: (c) => `Health and fitness browsing is sensitive data. ${c} use it to infer medical conditions, lifestyle choices, and target pharmaceutical or wellness ads.`,
  },
  education: {
    title: 'The Lifelong Learner',
    emoji: '📚',
    reason: (c) => `Education platform usage signals career development goals. ${c} target you with professional courses, certifications, and productivity software.`,
  },
  sports: {
    title: 'The Sports Fan',
    emoji: '⚽',
    reason: (c) => `Sports content consumption tells ${c} your team loyalties and viewing habits, used to serve betting, sports merchandise, and broadcast subscription ads.`,
  },
};
 
const COMPOUND_PERSONAS: Record<string, {
  title: string;
  emoji: string;
  reason: (companies: string) => string;
}> = {
  'tech+shopping': {
    title: 'The Tech Shopper',
    emoji: '🖥️',
    reason: (c) => `You combine developer interest with active purchasing — a premium target for ${c}. Expect ads for high-end hardware, SaaS tools, and exclusive tech deals.`,
  },
  'shopping+socialMedia': {
    title: 'The Social Shopper',
    emoji: '🛒',
    reason: (c) => `Social browsing combined with e-commerce signals you discover products through social feeds. ${c} will serve you influencer-driven and social commerce ads.`,
  },
  'finance+tech': {
    title: 'The FinTech User',
    emoji: '📊',
    reason: (c) => `Finance and tech browsing together marks you as a high-value professional target. ${c} will target you with investment platforms, trading apps, and premium SaaS.`,
  },
  'news+tech': {
    title: 'The Tech-Informed Reader',
    emoji: '🗞️',
    reason: (c) => `Combining tech and news consumption signals an analytical, informed profile. ${c} target this segment with thought leadership content and premium subscriptions.`,
  },
  'travel+shopping': {
    title: 'The Lifestyle Spender',
    emoji: '🌍',
    reason: (c) => `Travel planning combined with shopping marks you as a high disposable income target. ${c} see you as a premium lifestyle consumer and price accordingly.`,
  },
  'health+food': {
    title: 'The Wellness Browser',
    emoji: '🥗',
    reason: (c) => `Health and food interests together signal a wellness-focused lifestyle. ${c} target you with organic brands, fitness subscriptions, and health products.`,
  },
  'gaming+video': {
    title: 'The Digital Entertainment Fan',
    emoji: '🎮',
    reason: (c) => `Gaming and streaming combined shows high digital entertainment spending. ${c} see you as a strong target for gaming peripherals, streaming bundles, and esports content.`,
  },
  'socialMedia+video': {
    title: 'The Content Browser',
    emoji: '📺',
    reason: (c) => `Heavy social and video consumption means ${c} have a rich behavioural map of your preferences, used to serve highly personalised entertainment and product ads.`,
  },
  'finance+shopping': {
    title: 'The Value-Conscious Buyer',
    emoji: '💳',
    reason: (c) => `Finance and shopping browsing tells ${c} you research before buying. Expect comparison site ads, cashback offers, and premium card promotions.`,
  },
  'education+tech': {
    title: 'The Developer in Training',
    emoji: '🧑‍💻',
    reason: (c) => `Learning combined with tech platform usage signals an upskilling professional. ${c} target this valuable segment with bootcamps, certifications, and developer tools.`,
  },
};
 
// ---------------------------------------------------------------------------
// Privacy score — weighted by company risk, not just volume
// ---------------------------------------------------------------------------
 
function calculatePrivacyScore(
  topCompanies: TrackerSummary[],
  uniqueSites: number,
  totalEvents: number
): number {
  // Company risk contribution (0–50)
  const companyRisk = Math.min(50,
    topCompanies.reduce((sum, c) => sum + getCompanyRiskWeight(c.name), 0) * 1.5
  );
 
  // Breadth penalty — how many sites are tracked (0–30)
  const breadthRisk = Math.min(30, (uniqueSites / 20) * 30);
 
  // Volume penalty (0–20)
  const volumeRisk = Math.min(20, (totalEvents / 200) * 20);
 
  return Math.round(Math.min(100, companyRisk + breadthRisk + volumeRisk));
}
 
// ---------------------------------------------------------------------------
// Estimated CPM value
// ---------------------------------------------------------------------------
 
function estimateAdValue(scores: Record<string, number>): string {
  let weightedCPM = 0;
  let totalWeight = 0;
 
  for (const [category, score] of Object.entries(scores)) {
    if (score > 10 && CATEGORY_CPM[category]) {
      weightedCPM += CATEGORY_CPM[category] * score;
      totalWeight += score;
    }
  }
 
  if (totalWeight === 0) return '$1.00–$2.00 CPM';
  const avg = weightedCPM / totalWeight;
  const low = (avg * 0.8).toFixed(2);
  const high = (avg * 1.2).toFixed(2);
  return `$${low}–$${high} CPM`;
}
 
// ---------------------------------------------------------------------------
// Behavioral insights — plain English observations
// ---------------------------------------------------------------------------
 
function buildBehavioralInsights(
  scores: Record<string, number>,
  topCompanies: TrackerSummary[],
  totalEvents: number,
  uniqueSites: number
): string[] {
  const insights: string[] = [];
 
  const hasGoogle = topCompanies.some(c => c.name.toLowerCase().includes('google'));
  const hasMeta = topCompanies.some(c =>
    c.name.toLowerCase().includes('facebook') || c.name.toLowerCase().includes('meta')
  );
  const hasCriteo = topCompanies.some(c => c.name.toLowerCase().includes('criteo'));
  const hasHotjar = topCompanies.some(c => c.name.toLowerCase().includes('hotjar'));
 
  if (hasGoogle && hasMeta) {
    insights.push('You are tracked by both Google and Meta — your profile exists on the two largest ad networks simultaneously.');
  } else if (hasGoogle) {
    insights.push('Google is tracking you across sites, linking your searches, YouTube views, and browsing into one profile.');
  } else if (hasMeta) {
    insights.push('Meta is building a shadow profile of your interests even on sites you visit outside of Facebook and Instagram.');
  }
 
  if (hasCriteo) {
    insights.push('Criteo is active — this is a retargeting network, meaning you will see the same products follow you across websites.');
  }
 
  if (hasHotjar) {
    insights.push('Hotjar is recording your mouse movements and clicks on some pages — session replay tools capture more than just your browsing habits.');
  }
 
  if (scores.finance > 20 && scores.shopping > 20) {
    insights.push('Your finance and shopping combination flags you as a high-purchasing-power user, one of the most valuable audience segments for advertisers.');
  }
 
  if (scores.health > 15) {
    insights.push('Health-related browsing is legally sensitive in many regions. Advertisers are prohibited from using health data for targeting in some jurisdictions, but enforcement is inconsistent.');
  }
 
  if (uniqueSites > 15) {
    insights.push(`You were tracked across ${uniqueSites} different sites — the wider this spread, the more complete your cross-site behavioural profile becomes.`);
  }
 
  if (totalEvents > 100) {
    const eventLabel = totalEvents >= 1000
      ? `${(totalEvents / 1000).toFixed(1)}k`
      : totalEvents.toString();
    insights.push(`With ${eventLabel} tracking events recorded, advertisers have enough data to build a statistically reliable model of your behaviour.`);
  }
 
  if (scores.travel > 20) {
    insights.push('Travel intent data can persist in ad systems for 30–90 days — expect travel ads for weeks after any holiday research.');
  }
 
  // Cap at 4 insights to avoid overwhelming the user
  return insights.slice(0, 4);
}
 
// ---------------------------------------------------------------------------
// Main export — now returns a structured object, not a markdown string
// ---------------------------------------------------------------------------
 
export function analyzeDigitalProfile(
  topCompanies: TrackerSummary[],
  websites: WebsiteData[]
): string {
  const profile = buildFullProfile(topCompanies, websites);
  return formatProfileAsMarkdown(profile);
}
 
export function buildFullProfile(
  topCompanies: TrackerSummary[],
  websites: WebsiteData[]
): DigitalProfile {
  const websiteMap = new Map(websites.map(w => [w.label.toLowerCase(), w.percent]));
  const totalEvents = topCompanies.reduce((sum, c) => sum + c.count, 0);
  const uniqueSites = websites.length;
 
  const scores = buildCategoryScores(websiteMap);
  const persona = buildPersona(scores, topCompanies);
  const privacyScore = calculatePrivacyScore(topCompanies, uniqueSites, totalEvents);
  const estimatedValue = estimateAdValue(scores);
 
  // Dominant categories for display (top 3 with >10% score)
  const dominantCategories = Object.entries(scores)
    .filter(([, s]) => s > 10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, score]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${Math.round(score)}%)`);

// Only add site-derived interests if the site matches a known category keyword
const KNOWN_BRANDS: Record<string, string> = {
  // Video & Streaming
  'youtube': 'YouTube', 'netflix': 'Netflix', 'twitch': 'Twitch',
  'spotify': 'Spotify', 'disneyplus': 'Disney+', 'hulu': 'Hulu',
  'primevideo': 'Prime Video', 'appletv': 'Apple TV', 'hbomax': 'HBO Max',
  'peacocktv': 'Peacock', 'paramountplus': 'Paramount+', 'crunchyroll': 'Crunchyroll',
  'vimeo': 'Vimeo', 'dailymotion': 'Dailymotion', 'tubi': 'Tubi',
  'discoveryplus': 'Discovery+', 'dazn': 'DAZN', 'skygo': 'Sky Go',
  'nowtv': 'Now TV', 'channel4': 'Channel 4', 'itv': 'ITV',
  'bbc': 'BBC iPlayer', 'channel5': 'Channel 5', 'uktvplay': 'UKTV Play',

  // Social Media
  'facebook': 'Facebook', 'instagram': 'Instagram', 'twitter': 'Twitter',
  'linkedin': 'LinkedIn', 'tiktok': 'TikTok', 'snapchat': 'Snapchat',
  'reddit': 'Reddit', 'pinterest': 'Pinterest', 'tumblr': 'Tumblr',
  'mastodon': 'Mastodon', 'discord': 'Discord', 'telegram': 'Telegram',
  'whatsapp': 'WhatsApp', 'signal': 'Signal', 'threads': 'Threads',
  'bluesky': 'Bluesky', 'quora': 'Quora', 'clubhouse': 'Clubhouse',

  // News & Media
  'cnn': 'CNN', 'guardian': 'The Guardian', 'bbcnews': 'BBC News',
  'nytimes': 'New York Times', 'wsj': 'Wall Street Journal',
  'reuters': 'Reuters', 'bloomberg': 'Bloomberg', 'forbes': 'Forbes',
  'theverge': 'The Verge', 'techcrunch': 'TechCrunch', 'wired': 'Wired',
  'dailymail': 'Daily Mail', 'telegraph': 'The Telegraph',
  'independent': 'The Independent', 'mirror': 'The Mirror',
  'thesun': 'The Sun', 'sky': 'Sky News', 'aljazeera': 'Al Jazeera',
  'washingtonpost': 'Washington Post', 'huffpost': 'HuffPost',
  'buzzfeed': 'BuzzFeed', 'vice': 'Vice', 'vox': 'Vox',
  'economist': 'The Economist', 'ft': 'Financial Times',
  'time': 'Time Magazine', 'newsweek': 'Newsweek',

  // E-Commerce & Shopping
  'amazon': 'Amazon', 'ebay': 'eBay', 'etsy': 'Etsy',
  'asos': 'ASOS', 'shopify': 'Shopify', 'walmart': 'Walmart',
  'target': 'Target', 'bestbuy': 'Best Buy', 'argos': 'Argos',
  'currys': 'Currys', 'johnlewis': 'John Lewis', 'next': 'Next',
  'marksandspencer': 'M&S', 'primark': 'Primark', 'zara': 'Zara',
  'hm': 'H&M', 'uniqlo': 'Uniqlo', 'nike': 'Nike', 'adidas': 'Adidas',
  'shein': 'Shein', 'boohoo': 'Boohoo', 'prettylittlething': 'PrettyLittleThing',
  'wayfair': 'Wayfair', 'ikea': 'IKEA', 'aliexpress': 'AliExpress',
  'wish': 'Wish', 'vinted': 'Vinted', 'depop': 'Depop',

  // Tech & Developer
  'github': 'GitHub', 'stackoverflow': 'Stack Overflow', 'gitlab': 'GitLab',
  'npmjs': 'npm', 'medium': 'Medium', 'dev': 'DEV Community',
  'hackernews': 'Hacker News', 'producthunt': 'Product Hunt',
  'digitalocean': 'DigitalOcean', 'vercel': 'Vercel', 'netlify': 'Netlify',
  'cloudflare': 'Cloudflare', 'heroku': 'Heroku', 'aws': 'AWS',
  'azure': 'Azure', 'docker': 'Docker', 'kubernetes': 'Kubernetes',
  'jira': 'Jira', 'confluence': 'Confluence', 'notion': 'Notion',
  'figma': 'Figma', 'canva': 'Canva', 'codepen': 'CodePen',
  'replit': 'Replit', 'codesandbox': 'CodeSandbox',

  // Finance & Banking
  'paypal': 'PayPal', 'revolut': 'Revolut', 'monzo': 'Monzo',
  'starling': 'Starling Bank', 'hsbc': 'HSBC', 'barclays': 'Barclays',
  'lloyds': 'Lloyds', 'natwest': 'NatWest', 'santander': 'Santander',
  'halifax': 'Halifax', 'nationwide': 'Nationwide', 'chase': 'Chase',
  'coinbase': 'Coinbase', 'binance': 'Binance', 'kraken': 'Kraken',
  'trading212': 'Trading 212', 'freetrade': 'Freetrade',
  'moneysavingexpert': 'MoneySavingExpert', 'comparethemarket': 'Compare the Market',
  'moneysupermarket': 'MoneySuperMarket', 'gocompare': 'Go Compare',

  // Gaming
  'steam': 'Steam', 'epicgames': 'Epic Games', 'gog': 'GOG',
  'itch': 'itch.io', 'xbox': 'Xbox', 'playstation': 'PlayStation',
  'nintendo': 'Nintendo', 'ign': 'IGN', 'gamespot': 'GameSpot',
  'polygon': 'Polygon', 'eurogamer': 'Eurogamer', 'pcgamer': 'PC Gamer',
  'riotgames': 'Riot Games', 'blizzard': 'Blizzard', 'ea': 'EA',
  'ubisoft': 'Ubisoft', 'rockstargames': 'Rockstar Games',

  // Travel
  'booking': 'Booking.com', 'airbnb': 'Airbnb', 'expedia': 'Expedia',
  'tripadvisor': 'TripAdvisor', 'skyscanner': 'Skyscanner',
  'kayak': 'Kayak', 'ryanair': 'Ryanair', 'easyjet': 'easyJet',
  'britishairways': 'British Airways', 'virginatlantic': 'Virgin Atlantic',
  'hotels': 'Hotels.com', 'hostelworld': 'Hostelworld',
  'lonelyplanet': 'Lonely Planet', 'timeout': 'Time Out',

  // Food & Delivery
  'ubereats': 'Uber Eats', 'deliveroo': 'Deliveroo', 'justeat': 'Just Eat',
  'doordash': 'DoorDash', 'grubhub': 'Grubhub', 'instacart': 'Instacart',
  'ocado': 'Ocado', 'tesco': 'Tesco', 'sainsburys': 'Sainsbury\'s',
  'asda': 'ASDA', 'morrisons': 'Morrisons', 'waitrose': 'Waitrose',
  'hellofresh': 'HelloFresh', 'gousto': 'Gousto',

  // Health & Fitness
  'nhs': 'NHS', 'webmd': 'WebMD', 'healthline': 'Healthline',
  'mayoclinic': 'Mayo Clinic', 'patient': 'Patient.info',
  'myfitnesspal': 'MyFitnessPal', 'strava': 'Strava', 'garmin': 'Garmin',
  'peloton': 'Peloton', 'fiit': 'Fiit', 'headspace': 'Headspace',
  'calm': 'Calm', 'noom': 'Noom',

  // Education
  'coursera': 'Coursera', 'udemy': 'Udemy', 'edx': 'edX',
  'khanacademy': 'Khan Academy', 'duolingo': 'Duolingo',
  'skillshare': 'Skillshare', 'pluralsight': 'Pluralsight',
  'linkedinlearning': 'LinkedIn Learning', 'futurelearn': 'FutureLearn',
  'openuniversity': 'Open University', 'chegg': 'Chegg',

  // Search & Productivity
  'google': 'Google', 'bing': 'Bing', 'duckduckgo': 'DuckDuckGo',
  'yahoo': 'Yahoo', 'dropbox': 'Dropbox', 'drive': 'Google Drive',
  'onedrive': 'OneDrive', 'evernote': 'Evernote', 'todoist': 'Todoist',
  'trello': 'Trello', 'asana': 'Asana', 'slack': 'Slack',
  'zoom': 'Zoom', 'teams': 'Microsoft Teams', 'meet': 'Google Meet',
};

const topInterests: string[] = [];
websiteMap.forEach((percent, site) => {
  if (percent > 10) {
    const key = site.replace(/^www\./, '').split('.')[0].toLowerCase();
    if (KNOWN_BRANDS[key] && !topInterests.includes(KNOWN_BRANDS[key])) {
      topInterests.push(KNOWN_BRANDS[key]);
    }
  }
});

// Data value
const topScore = Math.max(...Object.values(scores));
const hasHighValueCategory = scores.finance > 15 || scores.shopping > 20 || scores.travel > 20;
const dataValue: DigitalProfile['dataValue'] =
  hasHighValueCategory && totalEvents > 100 ? 'Very High' :
  hasHighValueCategory || totalEvents > 50  ? 'High' :
  totalEvents > 20                          ? 'Medium' : 'Low';

// Tracking intensity
const trackingIntensity: DigitalProfile['trackingIntensity'] =
  totalEvents > 150 ? 'Extreme' :
  totalEvents > 50  ? 'Heavy' :
  totalEvents > 20  ? 'Moderate' : 'Light';

// Risk level
const riskLevel: DigitalProfile['riskLevel'] =
  privacyScore > 75 ? 'Critical' :
  privacyScore > 50 ? 'High' :
  privacyScore > 25 ? 'Medium' : 'Low';

// Confidence score — based on data richness
const confidenceScore = Math.min(100,
  Math.round((totalEvents / 80) * 60 + (uniqueSites / 15) * 40)
);

const behavioralInsights = buildBehavioralInsights(scores, topCompanies, totalEvents, uniqueSites);

const trackerCompanies = topCompanies.slice(0, 3).map(c => c.name);

return {
  personaTitle: persona.title,
  personaEmoji: persona.emoji,
  whyTargeted: persona.reason,
  privacyScore,
  confidenceScore,
  estimatedAdValue: estimatedValue,
  dataValue,
  trackingIntensity,
  riskLevel,
  topInterests: topInterests.slice(0, 5),
  dominantCategories,
  trackerCompanies,
  behavioralInsights,
};
}

// ---------------------------------------------------------------------------
// Markdown formatter — kept for backward compatibility with dashboard
// ---------------------------------------------------------------------------

function formatProfileAsMarkdown(profile: DigitalProfile): string {
const scoreEmoji = profile.privacyScore < 25 ? '🟢' : profile.privacyScore < 50 ? '🟡' : profile.privacyScore < 75 ? '🟠' : '🔴';
const riskLabel = profile.riskLevel === 'Critical' ? '🔴 Critical' : profile.riskLevel === 'High' ? '🟠 High' : profile.riskLevel === 'Medium' ? '🟡 Medium' : '🟢 Low';

return `**${profile.personaEmoji} ${profile.personaTitle}**

${profile.whyTargeted}

**Privacy Risk**: ${riskLabel}
**Privacy Score**: ${scoreEmoji} ${profile.privacyScore}/100
**Tracking Intensity**: ${profile.trackingIntensity}
**Your Data Value**: ${profile.dataValue} (Est. ${profile.estimatedAdValue})
**Profile Confidence**: ${profile.confidenceScore}%

**Dominant Interests**: ${profile.dominantCategories.join(' · ')}
${profile.topInterests.length > 0 ? `**Sites Identified**: ${profile.topInterests.join(', ')}` : ''}
${profile.trackerCompanies.length > 0 ? `**Top Trackers**: ${profile.trackerCompanies.join(', ')}` : ''}

**What this means for you:**
${profile.behavioralInsights.map(i => `• ${i}`).join('\n')}

*All analysis performed locally — no data leaves your device.*`;
}
