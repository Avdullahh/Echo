const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const JSONStream = require('JSONStream');
const { generateAdBlockRules } = require('./easylist-parser');
require('dotenv').config(); // <--- LOADS THE HIDDEN .ENV FILE

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- SECURE MONGODB CONNECTION ---
// Now uses the variable from your .env file
const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
    console.error("❌ FATAL ERROR: MONGO_URI is missing. Check your .env file.");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- DATA MODELS ---
const TrackerSchema = new mongoose.Schema({
  id: Number,
  domain: String,
  owner: String,
  category: String,
  risk: String
});
const Tracker = mongoose.model('Tracker', TrackerSchema);

// Ad Block Rules Cache Schema
const AdBlockCacheSchema = new mongoose.Schema({
  rules: Array,
  metadata: Object,
  cachedAt: { type: Date, default: Date.now }
});
const AdBlockCache = mongoose.model('AdBlockCache', AdBlockCacheSchema);

// --- KNOWN DATA SCHEMA ---
// Stores category definitions, known brands, and company name mappings.
// These are the constants that drive profile inference and interest tag generation.
// Seeded once via /api/knowndata/seed and fetched by the extension on startup.
const KnownDataSchema = new mongoose.Schema({
  type: { type: String, unique: true }, // 'categoryDefinitions' | 'knownBrands' | 'companyNames'
  data: Object,
  seededAt: { type: Date, default: Date.now }
});
const KnownData = mongoose.model('KnownData', KnownDataSchema, 'main');

// --- STREAMING SEED ROUTE ---
app.get('/api/seed', async (req, res) => {
  console.log("🦆 Starting DuckDuckGo Stream...");

  try {
    const TDS_URL = 'https://staticcdn.duckduckgo.com/trackerblocking/v2.1/tds.json';
    
    console.log(`⬇️ Connecting to Stream: ${TDS_URL}`);
    const response = await axios.get(TDS_URL, {
      responseType: 'stream'
    });

    const rules = [];
    let count = 0;
    const MAX_RULES = 2000; 

    const stream = response.data.pipe(JSONStream.parse('trackers.$*')); 

    console.log("⬇️ Stream started. Processing on the fly...");

    stream.on('data', (data) => {
      if (count >= MAX_RULES) {
        response.data.destroy(); 
        return;
      }

      const domain = data.key;
      const details = data.value;

      rules.push({
        id: count + 1,
        domain: domain,
        owner: details.owner && details.owner.displayName ? details.owner.displayName : "Unknown",
        category: details.categories && details.categories.length > 0 ? details.categories[0] : "Advertising",
        risk: "WARNING"
      });

      count++;
    });

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('close', resolve);
      stream.on('error', reject);
    });

    console.log(`✅ Stream finished. Saving ${rules.length} rules to MongoDB...`);
    await Tracker.deleteMany({});
    await Tracker.insertMany(rules);
    
    console.log(`💾 Database hydrated with ${rules.length} rules.`);
    res.json({ 
      message: "Success", 
      source: "DuckDuckGo TDS (Streamed)", 
      count: rules.length 
    });

  } catch (error) {
    console.error("❌ Stream Failed:", error.message);
    res.status(500).json({ error: "Streaming failed: " + error.message });
  }
});

app.get('/api/blocklist', async (req, res) => {
  try {
    const trackers = await Tracker.find({});
    res.json(trackers);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- KNOWN DATA ENDPOINTS ---

// Seed /api/knowndata/seed — populates the 'main' collection with all
// category definitions, known brands, and company name mappings.
// Run once after starting the backend. Safe to re-run — upserts, not deletes.
// KNOWN LIMITATION: No authentication. Do not expose this endpoint publicly.
app.post('/api/knowndata/seed', async (req, res) => {
  console.log("🌱 Seeding known data into 'main' collection...");

  const categoryDefinitions = {
    shopping:    { label: 'Online Shopper',        keywords: ['amazon','ebay','etsy','shopify','asos','walmart','target','bestbuy','argos','currys','johnlewis','next','zara','hm','nike','adidas','shein','boohoo','wayfair','ikea','aliexpress','vinted','depop','wish','shop','store','buy'] },
    socialMedia: { label: 'Social Media User',     keywords: ['facebook','instagram','twitter','tiktok','linkedin','snapchat','reddit','pinterest','tumblr','discord','telegram','whatsapp','threads','bluesky','mastodon','quora'] },
    video:       { label: 'Entertainment Browser', keywords: ['youtube','netflix','twitch','vimeo','dailymotion','disneyplus','hulu','primevideo','appletv','hbomax','peacocktv','crunchyroll','tubi','dazn','nowtv','channel4','itv','bbciplayer','spotify'] },
    news:        { label: 'News Reader',            keywords: ['bbc','cnn','guardian','nytimes','wsj','reuters','bloomberg','forbes','theverge','techcrunch','wired','dailymail','telegraph','independent','mirror','thesun','sky','aljazeera','washingtonpost','huffpost','buzzfeed','vice','vox','economist','ft','newsweek','news'] },
    tech:        { label: 'Developer',              keywords: ['github','stackoverflow','gitlab','npmjs','medium','dev','hackernews','producthunt','digitalocean','vercel','netlify','cloudflare','heroku','aws','azure','docker','figma','canva','codepen','replit','notion','jira','confluence','vscode'] },
    finance:     { label: 'Finance Browser',        keywords: ['paypal','revolut','monzo','starling','hsbc','barclays','lloyds','natwest','santander','halifax','nationwide','chase','coinbase','binance','kraken','trading212','freetrade','moneysavingexpert','comparethemarket','moneysupermarket','bank','investing','trading','finance','crypto','stock'] },
    gaming:      { label: 'Gamer',                  keywords: ['steam','epicgames','gog','xbox','playstation','nintendo','ign','gamespot','polygon','eurogamer','pcgamer','riotgames','blizzard','ea','ubisoft','rockstargames','twitch','gaming'] },
    travel:      { label: 'Travel Planner',         keywords: ['booking','airbnb','expedia','tripadvisor','skyscanner','kayak','ryanair','easyjet','britishairways','virginatlantic','hotels','hostelworld','lonelyplanet','timeout','travel','flight','holiday'] },
    food:        { label: 'Food & Delivery Fan',    keywords: ['ubereats','deliveroo','justeat','doordash','grubhub','instacart','ocado','tesco','sainsburys','asda','morrisons','waitrose','hellofresh','gousto','recipe','food','restaurant'] },
    health:      { label: 'Health Researcher',      keywords: ['nhs','webmd','healthline','mayoclinic','patient','myfitnesspal','strava','garmin','peloton','headspace','calm','health','fitness','medical','pharmacy','boots'] },
    education:   { label: 'Lifelong Learner',       keywords: ['coursera','udemy','edx','khanacademy','duolingo','skillshare','pluralsight','futurelearn','openuniversity','chegg','learn','university','college','ac.uk','edu'] },
    sports:      { label: 'Sports Fan',             keywords: ['bbcsport','skysports','espn','goal','premierleague','fifa','nfl','nba','cricket','rugby','tennis','sport','athletic'] },
  };

  const knownBrands = {
    'youtube':'YouTube','netflix':'Netflix','twitch':'Twitch','spotify':'Spotify',
    'disneyplus':'Disney+','hulu':'Hulu','primevideo':'Prime Video','appletv':'Apple TV',
    'hbomax':'HBO Max','peacocktv':'Peacock','crunchyroll':'Crunchyroll','vimeo':'Vimeo',
    'dailymotion':'Dailymotion','tubi':'Tubi','dazn':'DAZN','nowtv':'Now TV',
    'channel4':'Channel 4','itv':'ITV','bbc':'BBC iPlayer',
    'facebook':'Facebook','instagram':'Instagram','twitter':'Twitter','linkedin':'LinkedIn',
    'tiktok':'TikTok','snapchat':'Snapchat','reddit':'Reddit','pinterest':'Pinterest',
    'tumblr':'Tumblr','mastodon':'Mastodon','discord':'Discord','telegram':'Telegram',
    'whatsapp':'WhatsApp','threads':'Threads','bluesky':'Bluesky','quora':'Quora',
    'cnn':'CNN','guardian':'The Guardian','nytimes':'New York Times',
    'wsj':'Wall Street Journal','reuters':'Reuters','bloomberg':'Bloomberg',
    'forbes':'Forbes','theverge':'The Verge','techcrunch':'TechCrunch','wired':'Wired',
    'dailymail':'Daily Mail','telegraph':'The Telegraph','independent':'The Independent',
    'mirror':'The Mirror','thesun':'The Sun','sky':'Sky News','aljazeera':'Al Jazeera',
    'washingtonpost':'Washington Post','huffpost':'HuffPost','buzzfeed':'BuzzFeed',
    'vice':'Vice','vox':'Vox','economist':'The Economist','ft':'Financial Times',
    'newsweek':'Newsweek',
    'amazon':'Amazon','ebay':'eBay','etsy':'Etsy','asos':'ASOS','shopify':'Shopify',
    'walmart':'Walmart','target':'Target','bestbuy':'Best Buy','argos':'Argos',
    'currys':'Currys','johnlewis':'John Lewis','next':'Next','zara':'Zara','hm':'H&M',
    'nike':'Nike','adidas':'Adidas','shein':'Shein','boohoo':'Boohoo','wayfair':'Wayfair',
    'ikea':'IKEA','aliexpress':'AliExpress','wish':'Wish','vinted':'Vinted','depop':'Depop',
    'github':'GitHub','stackoverflow':'Stack Overflow','gitlab':'GitLab','npmjs':'npm',
    'medium':'Medium','dev':'DEV Community','hackernews':'Hacker News',
    'producthunt':'Product Hunt','digitalocean':'DigitalOcean','vercel':'Vercel',
    'netlify':'Netlify','cloudflare':'Cloudflare','heroku':'Heroku','aws':'AWS',
    'azure':'Azure','docker':'Docker','jira':'Jira','confluence':'Confluence',
    'notion':'Notion','figma':'Figma','canva':'Canva','codepen':'CodePen','replit':'Replit',
    'paypal':'PayPal','revolut':'Revolut','monzo':'Monzo','starling':'Starling Bank',
    'hsbc':'HSBC','barclays':'Barclays','lloyds':'Lloyds','natwest':'NatWest',
    'santander':'Santander','halifax':'Halifax','nationwide':'Nationwide','chase':'Chase',
    'coinbase':'Coinbase','binance':'Binance','kraken':'Kraken','trading212':'Trading 212',
    'freetrade':'Freetrade','moneysavingexpert':'MoneySavingExpert',
    'comparethemarket':'Compare the Market','moneysupermarket':'MoneySuperMarket',
    'gocompare':'Go Compare',
    'steam':'Steam','epicgames':'Epic Games','gog':'GOG','xbox':'Xbox',
    'playstation':'PlayStation','nintendo':'Nintendo','ign':'IGN','gamespot':'GameSpot',
    'polygon':'Polygon','eurogamer':'Eurogamer','pcgamer':'PC Gamer',
    'riotgames':'Riot Games','blizzard':'Blizzard','ea':'EA','ubisoft':'Ubisoft',
    'rockstargames':'Rockstar Games',
    'booking':'Booking.com','airbnb':'Airbnb','expedia':'Expedia',
    'tripadvisor':'TripAdvisor','skyscanner':'Skyscanner','kayak':'Kayak',
    'ryanair':'Ryanair','easyjet':'easyJet','britishairways':'British Airways',
    'virginatlantic':'Virgin Atlantic','hotels':'Hotels.com','hostelworld':'Hostelworld',
    'lonelyplanet':'Lonely Planet','timeout':'Time Out',
    'ubereats':'Uber Eats','deliveroo':'Deliveroo','justeat':'Just Eat',
    'doordash':'DoorDash','grubhub':'Grubhub','instacart':'Instacart','ocado':'Ocado',
    'tesco':'Tesco','sainsburys':"Sainsbury's",'asda':'ASDA','morrisons':'Morrisons',
    'waitrose':'Waitrose','hellofresh':'HelloFresh','gousto':'Gousto',
    'nhs':'NHS','webmd':'WebMD','healthline':'Healthline','mayoclinic':'Mayo Clinic',
    'patient':'Patient.info','myfitnesspal':'MyFitnessPal','strava':'Strava',
    'garmin':'Garmin','peloton':'Peloton','headspace':'Headspace','calm':'Calm',
    'coursera':'Coursera','udemy':'Udemy','edx':'edX','khanacademy':'Khan Academy',
    'duolingo':'Duolingo','skillshare':'Skillshare','pluralsight':'Pluralsight',
    'futurelearn':'FutureLearn','openuniversity':'Open University','chegg':'Chegg',
    'google':'Google','bing':'Bing','duckduckgo':'DuckDuckGo','dropbox':'Dropbox',
    'trello':'Trello','asana':'Asana','slack':'Slack','zoom':'Zoom',
  };

  const companyNames = {
    'doubleclick.net':       'Google (DoubleClick)',
    'adservice.google.com':  'Google Ads',
    'analytics.google.com':  'Google Analytics',
    'googletagmanager.com':  'Google Tag Manager',
    'googlesyndication.com': 'Google AdSense',
    'facebook.net':          'Meta (Facebook)',
    'connect.facebook.net':  'Meta (Facebook)',
    'criteo.com':            'Criteo',
    'hotjar.com':            'Hotjar',
    'tiktok.com':            'TikTok',
    'ads.tiktok.com':        'TikTok Ads',
    'bing.com':              'Microsoft (Bing)',
    'bat.bing.com':          'Microsoft Ads',
    'amazon-adsystem.com':   'Amazon Ads',
    'scorecardresearch.com': 'Comscore',
    'quantserve.com':        'Quantcast',
    'taboola.com':           'Taboola',
    'outbrain.com':          'Outbrain',
    'pubmatic.com':          'PubMatic',
    'rubiconproject.com':    'Magnite',
    'openx.net':             'OpenX',
    'casalemedia.com':       'Index Exchange',
  };

  try {
    await KnownData.findOneAndUpdate(
      { type: 'categoryDefinitions' },
      { type: 'categoryDefinitions', data: categoryDefinitions, seededAt: new Date() },
      { upsert: true, new: true }
    );
    await KnownData.findOneAndUpdate(
      { type: 'knownBrands' },
      { type: 'knownBrands', data: knownBrands, seededAt: new Date() },
      { upsert: true, new: true }
    );
    await KnownData.findOneAndUpdate(
      { type: 'companyNames' },
      { type: 'companyNames', data: companyNames, seededAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("💾 Known data seeded into 'main' collection.");
    res.json({ message: "Success", seeded: ['categoryDefinitions', 'knownBrands', 'companyNames'] });

  } catch (error) {
    console.error("❌ Known data seed failed:", error.message);
    res.status(500).json({ error: "Seed failed: " + error.message });
  }
});

// Fetch all known data — called by background/index.ts on startup
app.get('/api/knowndata', async (req, res) => {
  try {
    const docs = await KnownData.find({});
    if (docs.length === 0) {
      return res.status(404).json({ error: "No known data found. Run /api/knowndata/seed first." });
    }
    const result = {};
    docs.forEach(doc => { result[doc.type] = doc.data; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- AD BLOCKING ENDPOINTS (currently unused by extension) ---
// These endpoints generate and cache EasyList rules. The extension uses
// statically bundled rules at build time instead. Kept for potential
// future use or manual cache inspection during development.
// KNOWN LIMITATION: No authentication on any endpoint.
// KNOWN LIMITATION: cors() allows all origins — acceptable for local FYP use.
app.get('/api/adblock/rules', async (req, res) => {
  console.log("🚫 Ad block rules requested");
  try {
    const cached = await AdBlockCache.findOne({});
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
    if (cached && (Date.now() - cached.cachedAt.getTime()) < CACHE_DURATION) {
      console.log("✅ Serving cached ad block rules");
      return res.json(cached);
    }
    const rulesData = await generateAdBlockRules();
    await AdBlockCache.deleteMany({});
    await AdBlockCache.create(rulesData);
    console.log(`💾 Cached ${rulesData.rules.length} ad block rules`);
    res.json(rulesData);
  } catch (error) {
    console.error("❌ Ad block rules generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate ad block rules: " + error.message });
  }
});

app.get('/api/adblock/refresh', async (req, res) => {
  console.log("🔄 Force refresh ad block rules");
  try {
    const rulesData = await generateAdBlockRules();
    await AdBlockCache.deleteMany({});
    await AdBlockCache.create(rulesData);
    console.log(`💾 Refreshed ${rulesData.rules.length} ad block rules`);
    res.json({ message: "Success", count: rulesData.rules.length });
  } catch (error) {
    console.error("❌ Ad block refresh failed:", error.message);
    res.status(500).json({ error: "Failed to refresh rules: " + error.message });
  }
});

// --- AD BLOCKING RULES ENDPOINT ---
app.get('/api/adblock/rules', async (req, res) => {
  console.log("🚫 Ad block rules requested");

  try {
    // Check cache (refresh if older than 7 days)
    const cached = await AdBlockCache.findOne({});
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (cached && (Date.now() - cached.cachedAt.getTime()) < CACHE_DURATION) {
      console.log("✅ Serving cached ad block rules");
      return res.json(cached);
    }

    // Generate fresh rules
    console.log("🔄 Generating fresh ad block rules from EasyList...");
    const rulesData = await generateAdBlockRules();

    // Save to cache
    await AdBlockCache.deleteMany({});
    await AdBlockCache.create(rulesData);

    console.log(`💾 Cached ${rulesData.rules.length} ad block rules`);
    res.json(rulesData);

  } catch (error) {
    console.error("❌ Ad block rules generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate ad block rules: " + error.message });
  }
});

// --- FORCE REFRESH AD BLOCK RULES ---
app.get('/api/adblock/refresh', async (req, res) => {
  console.log("🔄 Force refresh ad block rules");

  try {
    const rulesData = await generateAdBlockRules();
    await AdBlockCache.deleteMany({});
    await AdBlockCache.create(rulesData);

    console.log(`💾 Refreshed ${rulesData.rules.length} ad block rules`);
    res.json({ message: "Success", count: rulesData.rules.length });

  } catch (error) {
    console.error("❌ Ad block refresh failed:", error.message);
    res.status(500).json({ error: "Failed to refresh rules: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Echo Backend running at: ${PORT}`);
});

app.post('/api/seed/turtlecute', async (req, res) => {
  console.log("🐢 Seeding Turtlecute missing domains...");

  const missingDomains = [
    // Amazon ad/analytics
    { domain: 'adtago.s3.amazonaws.com',           owner: 'Amazon',    category: 'Advertising' },
    { domain: 'analyticsengine.s3.amazonaws.com',  owner: 'Amazon',    category: 'Analytics'   },
    { domain: 'analytics.s3.amazonaws.com',        owner: 'Amazon',    category: 'Analytics'   },
    { domain: 'advice-ads.s3.amazonaws.com',       owner: 'Amazon',    category: 'Advertising' },
    // Google
    { domain: 'pagead2.googlesyndication.com',     owner: 'Google',    category: 'Advertising' },
    { domain: 'afs.googlesyndication.com',         owner: 'Google',    category: 'Advertising' },
    { domain: 'click.googleanalytics.com',         owner: 'Google',    category: 'Analytics'   },
    { domain: 'analytics.google.com',              owner: 'Google',    category: 'Analytics'   },
    // Meta
    { domain: 'an.facebook.com',                   owner: 'Meta',      category: 'Advertising' },
    { domain: 'pixel.facebook.com',                owner: 'Meta',      category: 'Analytics'   },
    // FreshWorks
    { domain: 'freshmarketer.com',                 owner: 'Freshworks', category: 'Analytics'  },
    // MouseFlow
    { domain: 'mouseflow.com',                     owner: 'Mouseflow', category: 'Analytics'   },
    // Reddit
    { domain: 'events.reddit.com',                 owner: 'Reddit',    category: 'Analytics'   },
    { domain: 'events.redditmedia.com',            owner: 'Reddit',    category: 'Analytics'   },
    // Pinterest
    { domain: 'log.pinterest.com',                 owner: 'Pinterest', category: 'Analytics'   },
    { domain: 'ads.pinterest.com',                 owner: 'Pinterest', category: 'Advertising' },
    { domain: 'trk.pinterest.com',                 owner: 'Pinterest', category: 'Analytics'   },
    // TikTok
    { domain: 'analytics.tiktok.com',             owner: 'TikTok',    category: 'Analytics'   },
    { domain: 'analytics-sg.tiktok.com',          owner: 'TikTok',    category: 'Analytics'   },
    { domain: 'ads-api.tiktok.com',               owner: 'TikTok',    category: 'Advertising' },
    { domain: 'ads-api.twitter.com',              owner: 'X',         category: 'Advertising' },
    { domain: 'ads.tiktok.com',                   owner: 'TikTok',    category: 'Advertising' },
    { domain: 'business-api.tiktok.com',          owner: 'TikTok',    category: 'Advertising' },
    { domain: 'log.byteoversea.com',              owner: 'TikTok',    category: 'Analytics'   },
    { domain: 'ads-sg.tiktok.com',               owner: 'TikTok',    category: 'Advertising' },
    // Yahoo
    { domain: 'log.fc.yahoo.com',                 owner: 'Yahoo',     category: 'Analytics'   },
    { domain: 'udcm.yahoo.com',                   owner: 'Yahoo',     category: 'Analytics'   },
    { domain: 'analytics.query.yahoo.com',        owner: 'Yahoo',     category: 'Analytics'   },
    { domain: 'geo.yahoo.com',                    owner: 'Yahoo',     category: 'Analytics'   },
    { domain: 'gemini.yahoo.com',                 owner: 'Yahoo',     category: 'Advertising' },
    { domain: 'adtech.yahooinc.com',             owner: 'Yahoo',     category: 'Advertising' },
    { domain: 'partnerads.ysm.yahoo.com',        owner: 'Yahoo',     category: 'Advertising' },
    { domain: 'analytics.yahoo.com',             owner: 'Yahoo',     category: 'Analytics'   },
    // Unity Ads
    { domain: 'auction.unityads.unity3d.com',    owner: 'Unity',     category: 'Advertising' },
    { domain: 'config.unityads.unity3d.com',     owner: 'Unity',     category: 'Advertising' },
    { domain: 'webview.unityads.unity3d.com',    owner: 'Unity',     category: 'Advertising' },
    // Yandex
    { domain: 'adfstat.yandex.ru',              owner: 'Yandex',    category: 'Advertising' },
    { domain: 'appmetrica.yandex.ru',           owner: 'Yandex',    category: 'Analytics'   },
    { domain: 'metrika.yandex.ru',              owner: 'Yandex',    category: 'Analytics'   },
    { domain: 'adfox.yandex.ru',               owner: 'Yandex',    category: 'Advertising' },
    // Realme / OPPO
    { domain: 'iot-eu-logser.realme.com',       owner: 'Realme',    category: 'Analytics'   },
    { domain: 'bdapi-in-ads.realmemobile.com',  owner: 'Realme',    category: 'Advertising' },
    { domain: 'bdapi-ads.realmemobile.com',     owner: 'Realme',    category: 'Advertising' },
    { domain: 'iot-logser.realme.com',          owner: 'Realme',    category: 'Analytics'   },
    { domain: 'data.ads.oppomobile.com',        owner: 'OPPO',      category: 'Advertising' },
    { domain: 'adx.ads.oppomobile.com',         owner: 'OPPO',      category: 'Advertising' },
    { domain: 'adsfs.oppomobile.com',           owner: 'OPPO',      category: 'Advertising' },
    { domain: 'ck.ads.oppomobile.com',          owner: 'OPPO',      category: 'Advertising' },
    // Samsung
    { domain: 'analytics-api.samsunghealthcn.com', owner: 'Samsung', category: 'Analytics'  },
    { domain: 'samsungads.com',                 owner: 'Samsung',   category: 'Advertising' },
    { domain: 'smetrics.samsung.com',           owner: 'Samsung',   category: 'Analytics'   },
    // Apple
    { domain: 'notes-analytics-events.apple.com',   owner: 'Apple', category: 'Analytics'   },
    { domain: 'weather-analytics-events.apple.com', owner: 'Apple', category: 'Analytics'   },
    { domain: 'books-analytics-events.apple.com',   owner: 'Apple', category: 'Analytics'   },
    { domain: 'api-adservices.apple.com',        owner: 'Apple',    category: 'Advertising' },
    { domain: 'iadsdk.apple.com',               owner: 'Apple',    category: 'Advertising' },
    { domain: 'metrics.icloud.com',             owner: 'Apple',    category: 'Analytics'   },
    { domain: 'metrics.mzstatic.com',           owner: 'Apple',    category: 'Analytics'   },
    // Xiaomi
    { domain: 'data.mistat.xiaomi.com',         owner: 'Xiaomi',   category: 'Analytics'   },
    { domain: 'data.mistat.rus.xiaomi.com',     owner: 'Xiaomi',   category: 'Analytics'   },
    { domain: 'data.mistat.india.xiaomi.com',   owner: 'Xiaomi',   category: 'Analytics'   },
    { domain: 'tracking.rus.miui.com',          owner: 'Xiaomi',   category: 'Analytics'   },
    // Hicloud (Huawei)
    { domain: 'logbak.hicloud.com',             owner: 'Huawei',   category: 'Analytics'   },
    { domain: 'grs.hicloud.com',                owner: 'Huawei',   category: 'Analytics'   },
    { domain: 'logservice.hicloud.com',         owner: 'Huawei',   category: 'Analytics'   },
    { domain: 'logservice1.hicloud.com',        owner: 'Huawei',   category: 'Analytics'   },
    // LinkedIn
    { domain: 'analytics.pointdrive.linkedin.com', owner: 'LinkedIn', category: 'Analytics' },
    // Extras
    { domain: 'mc.yandex.ru',               owner: 'Yandex',        category: 'Analytics'   },
    { domain: 'browser.sentry-cdn.com',     owner: 'Sentry',        category: 'Analytics'   },
    { domain: 'app.getsentry.com',          owner: 'Sentry',        category: 'Analytics'   },
    { domain: 'notify.bugsnag.com',         owner: 'Bugsnag',       category: 'Analytics'   },
    { domain: 'sessions.bugsnag.com',       owner: 'Bugsnag',       category: 'Analytics'   },
    { domain: 'api.bugsnag.com',            owner: 'Bugsnag',       category: 'Analytics'   },
    { domain: 'app.bugsnag.com',            owner: 'Bugsnag',       category: 'Analytics'   },
    { domain: 'static.ads-twitter.com',     owner: 'X',             category: 'Advertising' },
    { domain: 'ads.linkedin.com',           owner: 'LinkedIn',      category: 'Advertising' },
    { domain: 'ads.youtube.com',            owner: 'Google',        category: 'Advertising' },
    { domain: 'ads.yahoo.com',              owner: 'Yahoo',         category: 'Advertising' },
  ];

  try {
    // Get current max ID to avoid collisions
    const lastTracker = await Tracker.findOne({}).sort({ id: -1 });
    let nextId = lastTracker ? lastTracker.id + 1 : 1;

    // Only insert domains that don't already exist
    const existingDomains = new Set(
      (await Tracker.find({}, 'domain')).map(t => t.domain)
    );

    const toInsert = missingDomains
      .filter(d => !existingDomains.has(d.domain))
      .map(d => ({ ...d, id: nextId++, risk: 'WARNING' }));

    if (toInsert.length === 0) {
      return res.json({ message: "All domains already exist", added: 0 });
    }

    await Tracker.insertMany(toInsert);
    console.log(`💾 Added ${toInsert.length} missing domains from Turtlecute list.`);
    res.json({ message: "Success", added: toInsert.length });

  } catch (error) {
    console.error("❌ Turtlecute seed failed:", error.message);
    res.status(500).json({ error: "Seed failed: " + error.message });
  }
});

app.post('/api/seed/consent-domains', async (req, res) => {
  const consentDomains = [
    // Google consent iframe — blocks the consent wall, Google falls back to cookieless
    { domain: 'consent.google.com',     owner: 'Google',    category: 'Advertising' },
    // Other common consent management platforms served cross-origin
    { domain: 'consent.youtube.com',    owner: 'Google',    category: 'Advertising' },
    { domain: 'consentcdn.cookiebot.com', owner: 'Cookiebot', category: 'Analytics' },
  ];

  try {
    const lastTracker = await Tracker.findOne({}).sort({ id: -1 });
    let nextId = lastTracker ? lastTracker.id + 1 : 1;
    const existingDomains = new Set(
      (await Tracker.find({}, 'domain')).map(t => t.domain)
    );
    const toInsert = consentDomains
      .filter(d => !existingDomains.has(d.domain))
      .map(d => ({ ...d, id: nextId++, risk: 'WARNING' }));

    if (toInsert.length === 0) {
      return res.json({ message: 'All domains already exist', added: 0 });
    }
    await Tracker.insertMany(toInsert);
    res.json({ message: 'Success', added: toInsert.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
