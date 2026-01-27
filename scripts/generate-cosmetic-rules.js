/**
 * Cosmetic Rules Generator
 * Parses ## element hiding rules from EasyList filter lists
 * Generates CSS file for generic rules and JSON for domain-specific rules
 * Run: node scripts/generate-cosmetic-rules.js [--force]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Filter lists with cosmetic rules
const FILTER_LISTS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/fanboy-annoyance.txt'
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'rules');
const CACHE_FILE = path.join(OUTPUT_DIR, '.cosmetic-cache.json');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Fetch content from URL via HTTPS
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`  Fetching: ${url}`);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
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
 * Escape CSS selector special characters
 */
function escapeSelector(selector) {
  // Already a valid CSS selector in most cases
  // Just ensure no injection issues
  return selector
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Validate CSS selector syntax
 */
function isValidSelector(selector) {
  // Skip empty or obviously invalid selectors
  if (!selector || selector.length < 2) return false;
  if (selector.length > 500) return false; // Too long

  // Skip procedural cosmetic filters (ABP extended syntax)
  if (selector.includes(':has(')) return false;
  if (selector.includes(':has-text(')) return false;
  if (selector.includes(':xpath(')) return false;
  if (selector.includes(':style(')) return false;
  if (selector.includes(':remove(')) return false;
  if (selector.includes(':matches-css(')) return false;
  if (selector.includes(':min-text-length(')) return false;
  if (selector.includes(':nth-ancestor(')) return false;
  if (selector.includes(':upward(')) return false;
  if (selector.includes(':watch-attr(')) return false;
  if (selector.includes(':-abp-')) return false;

  // Skip if contains JS-like code
  if (selector.includes('javascript:')) return false;
  if (selector.includes('data:')) return false;

  return true;
}

/**
 * Parse a single cosmetic filter line
 * Returns { type: 'generic'|'domain', selector, domains? }
 */
function parseCosmeticLine(line) {
  line = line.trim();

  // Skip non-cosmetic lines
  if (!line ||
      line.startsWith('!') ||
      line.startsWith('[') ||
      !line.includes('##')) {
    return null;
  }

  // Skip exception rules (#@#) for now
  if (line.includes('#@#')) {
    return null;
  }

  // Skip script injection rules (#$#)
  if (line.includes('#$#')) {
    return null;
  }

  // Skip extended CSS rules (#?#)
  if (line.includes('#?#')) {
    return null;
  }

  // Parse the rule
  const hashIndex = line.indexOf('##');
  if (hashIndex === -1) return null;

  const domainPart = line.substring(0, hashIndex);
  const selector = line.substring(hashIndex + 2);

  if (!isValidSelector(selector)) return null;

  // Generic rule (no domain specified)
  if (!domainPart) {
    return { type: 'generic', selector };
  }

  // Domain-specific rule
  // Domains can be comma-separated, with ~ for exclusions
  const domains = domainPart.split(',')
    .map(d => d.trim().toLowerCase())
    .filter(d => d && !d.startsWith('~')); // Skip exclusions for simplicity

  if (domains.length === 0) return null;

  return { type: 'domain', selector, domains };
}

/**
 * Process all filter lists and extract cosmetic rules
 */
async function processFilterLists() {
  const genericSelectors = new Set();
  const domainRules = {}; // domain -> Set of selectors

  let totalLines = 0;
  let parsedGeneric = 0;
  let parsedDomain = 0;

  for (const url of FILTER_LISTS) {
    try {
      const content = await fetchUrl(url);
      const lines = content.split('\n');
      totalLines += lines.length;

      console.log(`  Processing ${lines.length} lines...`);

      for (const line of lines) {
        const result = parseCosmeticLine(line);
        if (!result) continue;

        if (result.type === 'generic') {
          genericSelectors.add(result.selector);
          parsedGeneric++;
        } else if (result.type === 'domain') {
          for (const domain of result.domains) {
            if (!domainRules[domain]) {
              domainRules[domain] = new Set();
            }
            domainRules[domain].add(result.selector);
          }
          parsedDomain++;
        }
      }
    } catch (error) {
      console.error(`  Error processing ${url}: ${error.message}`);
    }
  }

  console.log(`\n  Total lines: ${totalLines.toLocaleString()}`);
  console.log(`  Generic selectors: ${genericSelectors.size.toLocaleString()}`);
  console.log(`  Domain-specific rules: ${parsedDomain.toLocaleString()}`);
  console.log(`  Unique domains: ${Object.keys(domainRules).length.toLocaleString()}`);

  return { genericSelectors, domainRules };
}

/**
 * Generate CSS file from generic selectors
 */
function generateCSS(selectors) {
  // Group selectors to reduce file size (max 100 per rule for browser compatibility)
  const selectorArray = Array.from(selectors);
  const chunks = [];

  for (let i = 0; i < selectorArray.length; i += 100) {
    chunks.push(selectorArray.slice(i, i + 100));
  }

  let css = '/* Echo Privacy - Generated Cosmetic Rules */\n';
  css += '/* Auto-generated from EasyList - do not edit manually */\n\n';

  for (const chunk of chunks) {
    const escapedSelectors = chunk
      .map(s => escapeSelector(s))
      .join(',\n');
    css += `${escapedSelectors} {\n  display: none !important;\n}\n\n`;
  }

  return css;
}

/**
 * Generate JSON map from domain rules
 */
function generateDomainJSON(domainRules) {
  const result = {};

  for (const [domain, selectors] of Object.entries(domainRules)) {
    result[domain] = Array.from(selectors);
  }

  return result;
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

  console.log('Cosmetic Rules Generator');
  console.log('========================\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating directory: ${OUTPUT_DIR}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check cache
  if (!forceRefresh && isCacheValid()) {
    console.log('Using cached cosmetic rules (less than 7 days old)');
    console.log('Use --force to regenerate');
    return;
  }

  console.log('Processing filter lists...\n');

  const { genericSelectors, domainRules } = await processFilterLists();

  // Generate and write CSS file
  console.log('\nGenerating cosmetic-generic.css...');
  const css = generateCSS(genericSelectors);
  const cssPath = path.join(OUTPUT_DIR, 'cosmetic-generic.css');
  fs.writeFileSync(cssPath, css);
  console.log(`  Written: ${cssPath} (${(css.length / 1024).toFixed(1)} KB)`);

  // Generate and write domain JSON
  console.log('\nGenerating cosmetic-domains.json...');
  const domainJSON = generateDomainJSON(domainRules);
  const jsonPath = path.join(OUTPUT_DIR, 'cosmetic-domains.json');
  const jsonContent = JSON.stringify(domainJSON);
  fs.writeFileSync(jsonPath, jsonContent);
  console.log(`  Written: ${jsonPath} (${(jsonContent.length / 1024).toFixed(1)} KB)`);

  // Update cache timestamp
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    timestamp: Date.now(),
    generatedAt: new Date().toISOString(),
    genericCount: genericSelectors.size,
    domainCount: Object.keys(domainRules).length
  }));

  console.log('\n========================');
  console.log('Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
