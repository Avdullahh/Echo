/**
 * Standalone build script to generate ad block rules
 * No backend required - fetches directly from filter list URLs
 * Run: node scripts/generate-adblock-rules.js [--force]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Filter list configuration
const FILTER_LISTS = {
  easylist: {
    url: 'https://easylist.to/easylist/easylist.txt',
    outputFile: 'easylist_rules.json',
    startId: 1,
    maxRules: 70000,
    parseExceptions: false  // Block rules only
  },
  easyprivacy: {
    url: 'https://easylist.to/easylist/easyprivacy.txt',
    outputFile: 'easyprivacy_rules.json',
    startId: 100001,
    maxRules: 50000,
    parseExceptions: false  // Block rules only
  },
  annoyances: {
    url: 'https://easylist.to/easylist/fanboy-annoyance.txt',
    outputFile: 'annoyances_rules.json',
    startId: 200001,
    maxRules: 30000,
    parseExceptions: false  // Block rules only
  },
  // Exception rules from all lists combined
  exceptions: {
    urls: [
      'https://easylist.to/easylist/easylist.txt',
      'https://easylist.to/easylist/easyprivacy.txt',
      'https://easylist.to/easylist/fanboy-annoyance.txt'
    ],
    outputFile: 'exception_rules.json',
    startId: 300001,
    maxRules: 20000,
    parseExceptions: true  // Exception rules only
  }
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'rules');
const CACHE_FILE = path.join(OUTPUT_DIR, '.rules-cache.json');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Fetch content from URL via HTTPS
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`  Fetching: ${url}`);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirects
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse a single filter line into a Chrome declarativeNetRequest rule
 * @param {string} line - The filter line to parse
 * @param {number} id - The rule ID to assign
 * @param {boolean} parseExceptions - If true, only parse @@ rules; if false, skip @@ rules
 */
function parseLineToRule(line, id, parseExceptions = false) {
  line = line.trim();

  // Skip comments, empty lines, and cosmetic filters
  if (!line ||
      line.startsWith('!') ||
      line.startsWith('[') ||
      line.includes('##') ||
      line.includes('#@#') ||
      line.includes('#?#') ||
      line.includes('#$#')) {
    return null;
  }

  // Handle exception rules based on parseExceptions flag
  const isException = line.startsWith('@@');

  if (parseExceptions && !isException) {
    // We want exceptions only, but this is a block rule
    return null;
  }

  if (!parseExceptions && isException) {
    // We want block rules only, but this is an exception
    return null;
  }

  // Strip @@ prefix for exception rules
  if (isException) {
    line = line.substring(2);
  }

  let urlFilter = null;
  let resourceTypes = [
    'script', 'image', 'stylesheet', 'xmlhttprequest',
    'sub_frame', 'media', 'font', 'ping', 'other'
  ];
  let domainType = null;
  let excludedDomains = [];
  let initiatorDomains = [];

  // Split filter and options
  let filterPart = line;
  let optionsPart = '';

  const dollarIndex = line.lastIndexOf('$');
  if (dollarIndex > 0 && !line.substring(dollarIndex).includes('/')) {
    filterPart = line.substring(0, dollarIndex);
    optionsPart = line.substring(dollarIndex + 1);
  }

  // Parse options
  if (optionsPart) {
    const options = optionsPart.split(',').map(opt => opt.trim().toLowerCase());

    for (const option of options) {
      // Resource type filters
      if (option === 'script') resourceTypes = ['script'];
      else if (option === 'image') resourceTypes = ['image'];
      else if (option === 'stylesheet' || option === 'css') resourceTypes = ['stylesheet'];
      else if (option === 'xmlhttprequest' || option === 'xhr') resourceTypes = ['xmlhttprequest'];
      else if (option === 'subdocument' || option === 'frame') resourceTypes = ['sub_frame'];
      else if (option === 'media') resourceTypes = ['media'];
      else if (option === 'font') resourceTypes = ['font'];
      else if (option === 'ping' || option === 'beacon') resourceTypes = ['ping'];
      else if (option === 'websocket') resourceTypes = ['websocket'];
      else if (option === 'other') resourceTypes = ['other'];

      // Domain type (must be string, not array per Chrome MV3 spec)
      else if (option === 'third-party' || option === '3p') domainType = 'thirdParty';
      else if (option === '~third-party' || option === '~3p' || option === '1p') domainType = 'firstParty';

      // Domain restrictions
      else if (option.startsWith('domain=')) {
        const domains = option.substring(7).split('|');
        for (const domain of domains) {
          if (domain.startsWith('~')) {
            excludedDomains.push(domain.substring(1));
          } else if (domain) {
            initiatorDomains.push(domain);
          }
        }
      }
    }
  }

  // Convert filter pattern to urlFilter
  if (filterPart.startsWith('||')) {
    // ||example.com^ → domain match
    let domain = filterPart.substring(2);
    if (domain.endsWith('^')) {
      domain = domain.slice(0, -1);
    }
    domain = domain.replace(/\*/g, '*');

    if (!domain.includes('/') && !domain.includes('*')) {
      urlFilter = `*://*.${domain}/*`;
    } else {
      urlFilter = `*://${domain}*`;
    }
  } else if (filterPart.startsWith('|')) {
    // |https://example.com → URL prefix
    urlFilter = filterPart.substring(1);
    if (!urlFilter.endsWith('*')) urlFilter += '*';
  } else if (filterPart.includes('://')) {
    // Full URL pattern
    urlFilter = filterPart;
    if (!urlFilter.endsWith('*')) urlFilter += '*';
  } else if (filterPart.startsWith('/') && filterPart.endsWith('/')) {
    // Regex - skip (limited Chrome support)
    return null;
  } else if (filterPart) {
    // Simple substring match
    urlFilter = `*${filterPart}*`;
  }

  // Validation
  if (!urlFilter || urlFilter.length > 2048 || urlFilter.length < 3) return null;
  if (urlFilter === '*' || urlFilter === '**' || urlFilter === '*^*') return null;
  if (!resourceTypes || resourceTypes.length === 0) return null;

  // Build rule with appropriate action and priority
  const rule = {
    id,
    priority: isException ? 100 : 1,  // Exception rules have higher priority
    action: { type: isException ? 'allow' : 'block' },
    condition: {
      urlFilter,
      resourceTypes
    }
  };

  if (domainType) rule.condition.domainType = domainType;
  if (excludedDomains.length > 0) rule.condition.excludedInitiatorDomains = excludedDomains;
  if (initiatorDomains.length > 0) rule.condition.initiatorDomains = initiatorDomains;

  return rule;
}

/**
 * Process a filter list and generate rules
 */
async function processFilterList(name, config) {
  console.log(`\nProcessing ${name}...`);

  try {
    // Support both single URL and multiple URLs (for combined exception rules)
    const urls = config.urls || [config.url];
    let allLines = [];

    for (const url of urls) {
      const content = await fetchUrl(url);
      const lines = content.split('\n');
      allLines = allLines.concat(lines);
      console.log(`  Received ${lines.length} lines from ${url.split('/').pop()}`);
    }

    const rules = [];
    let ruleId = config.startId;
    let skipped = 0;
    const parseExceptions = config.parseExceptions || false;

    for (const line of allLines) {
      if (rules.length >= config.maxRules) {
        console.log(`  Reached max rule limit (${config.maxRules})`);
        break;
      }

      const rule = parseLineToRule(line, ruleId, parseExceptions);
      if (rule) {
        rules.push(rule);
        ruleId++;
      } else {
        skipped++;
      }
    }

    const ruleType = parseExceptions ? 'exception (allow)' : 'block';
    console.log(`  Parsed ${rules.length} ${ruleType} rules (skipped ${skipped} non-matching filters)`);

    // Write to file
    const outputPath = path.join(OUTPUT_DIR, config.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
    console.log(`  Saved to ${config.outputFile}`);

    return rules.length;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return 0;
  }
}

/**
 * Check if cache is still valid
 */
function isCacheValid() {
  if (!fs.existsSync(CACHE_FILE)) return false;

  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return Date.now() - cache.timestamp < CACHE_DURATION;
  } catch {
    return false;
  }
}

/**
 * Main entry point
 */
async function main() {
  const forceRefresh = process.argv.includes('--force');

  console.log('Ad Block Rules Generator');
  console.log('========================\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating directory: ${OUTPUT_DIR}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check cache
  if (!forceRefresh && isCacheValid()) {
    console.log('Using cached rules (less than 7 days old)');
    console.log('Use --force to regenerate');
    return;
  }

  let totalRules = 0;

  // Process each filter list
  for (const [name, config] of Object.entries(FILTER_LISTS)) {
    const count = await processFilterList(name, config);
    totalRules += count;
  }

  // Update cache timestamp
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    timestamp: Date.now(),
    generatedAt: new Date().toISOString()
  }));

  console.log(`\n========================`);
  console.log(`Total: ${totalRules.toLocaleString()} rules generated`);
  console.log('Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
