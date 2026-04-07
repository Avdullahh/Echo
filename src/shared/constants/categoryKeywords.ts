/**
 * categoryKeywords.ts
 * Single source of truth for category → keyword mappings.
 * Used by both profileAnalyzer.ts (scoring) and adExplainer.ts (label inference).
 * Update here and both services stay in sync automatically.
 */

export interface CategoryDefinition {
    /** Keywords matched against site hostnames for scoring */
    keywords: string[];
    /** Human-readable label shown in the UI, e.g. "Online Shopper" */
    label: string;
  }
  
  export const CATEGORY_DEFINITIONS: Record<string, CategoryDefinition> = {
    shopping: {
      label: 'Online Shopper',
      keywords: ['amazon', 'ebay', 'etsy', 'shopify', 'asos', 'walmart', 'target',
                 'bestbuy', 'argos', 'currys', 'johnlewis', 'next', 'zara', 'hm',
                 'nike', 'adidas', 'shein', 'boohoo', 'wayfair', 'ikea', 'aliexpress',
                 'vinted', 'depop', 'wish', 'shop', 'store', 'buy'],
    },
    socialMedia: {
      label: 'Social Media User',
      keywords: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'snapchat',
                 'reddit', 'pinterest', 'tumblr', 'discord', 'telegram', 'whatsapp',
                 'threads', 'bluesky', 'mastodon', 'quora'],
    },
    video: {
      label: 'Entertainment Browser',
      keywords: ['youtube', 'netflix', 'twitch', 'vimeo', 'dailymotion', 'disneyplus',
                 'hulu', 'primevideo', 'appletv', 'hbomax', 'peacocktv', 'crunchyroll',
                 'tubi', 'dazn', 'nowtv', 'channel4', 'itv', 'bbciplayer', 'spotify'],
    },
    news: {
      label: 'News Reader',
      keywords: ['bbc', 'cnn', 'guardian', 'nytimes', 'wsj', 'reuters', 'bloomberg',
                 'forbes', 'theverge', 'techcrunch', 'wired', 'dailymail', 'telegraph',
                 'independent', 'mirror', 'thesun', 'sky', 'aljazeera', 'washingtonpost',
                 'huffpost', 'buzzfeed', 'vice', 'vox', 'economist', 'ft', 'newsweek', 'news'],
    },
    tech: {
      label: 'Developer',
      keywords: ['github', 'stackoverflow', 'gitlab', 'npmjs', 'medium', 'dev',
                 'hackernews', 'producthunt', 'digitalocean', 'vercel', 'netlify',
                 'cloudflare', 'heroku', 'aws', 'azure', 'docker', 'figma', 'canva',
                 'codepen', 'replit', 'notion', 'jira', 'confluence', 'vscode'],
    },
    finance: {
      label: 'Finance Browser',
      keywords: ['paypal', 'revolut', 'monzo', 'starling', 'hsbc', 'barclays', 'lloyds',
                 'natwest', 'santander', 'halifax', 'nationwide', 'chase', 'coinbase',
                 'binance', 'kraken', 'trading212', 'freetrade', 'moneysavingexpert',
                 'comparethemarket', 'moneysupermarket', 'bank', 'investing', 'trading',
                 'finance', 'crypto', 'stock'],
    },
    gaming: {
      label: 'Gamer',
      keywords: ['steam', 'epicgames', 'gog', 'xbox', 'playstation', 'nintendo',
                 'ign', 'gamespot', 'polygon', 'eurogamer', 'pcgamer', 'riotgames',
                 'blizzard', 'ea', 'ubisoft', 'rockstargames', 'twitch', 'gaming'],
    },
    travel: {
      label: 'Travel Planner',
      keywords: ['booking', 'airbnb', 'expedia', 'tripadvisor', 'skyscanner', 'kayak',
                 'ryanair', 'easyjet', 'britishairways', 'virginatlantic', 'hotels',
                 'hostelworld', 'lonelyplanet', 'timeout', 'travel', 'flight', 'holiday'],
    },
    food: {
      label: 'Food & Delivery Fan',
      keywords: ['ubereats', 'deliveroo', 'justeat', 'doordash', 'grubhub', 'instacart',
                 'ocado', 'tesco', 'sainsburys', 'asda', 'morrisons', 'waitrose',
                 'hellofresh', 'gousto', 'recipe', 'food', 'restaurant'],
    },
    health: {
      label: 'Health Researcher',
      keywords: ['nhs', 'webmd', 'healthline', 'mayoclinic', 'patient', 'myfitnesspal',
                 'strava', 'garmin', 'peloton', 'headspace', 'calm', 'health',
                 'fitness', 'medical', 'pharmacy', 'boots'],
    },
    education: {
      label: 'Lifelong Learner',
      keywords: ['coursera', 'udemy', 'edx', 'khanacademy', 'duolingo', 'skillshare',
                 'pluralsight', 'futurelearn', 'openuniversity', 'chegg', 'learn',
                 'university', 'college', 'ac.uk', 'edu'],
    },
    sports: {
      label: 'Sports Fan',
      keywords: ['bbcsport', 'skysports', 'espn', 'goal', 'premierleague', 'fifa',
                 'nfl', 'nba', 'cricket', 'rugby', 'tennis', 'sport', 'athletic'],
    },
  };
  
  /**
   * Flat keyword map for profileAnalyzer.ts scoring — same data, different shape.
   * Record<categoryKey, keywords[]>
   */
  export const CATEGORY_KEYWORDS: Record<string, string[]> = Object.fromEntries(
    Object.entries(CATEGORY_DEFINITIONS).map(([key, def]) => [key, def.keywords])
  );
  
  /**
   * Pattern list for adExplainer.ts inference — same data, different shape.
   * Array<{ keywords, label }>
   */
  export const CATEGORY_PATTERNS: Array<{ keywords: string[]; label: string }> =
    Object.values(CATEGORY_DEFINITIONS).map(def => ({
      keywords: def.keywords,
      label: def.label,
    }));