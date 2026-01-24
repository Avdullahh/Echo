const axios = require('axios');

const EASYLIST_URL = 'https://easylist.to/easylist/easylist.txt';
const MAX_RULES = 25000; // Stay well under Chrome's static rule limit

/**
 * Fetches and parses EasyList, converting to declarativeNetRequest rules
 * @returns {Promise<Array>} Array of declarativeNetRequest rule objects
 */
async function fetchAndParseEasyList() {
  console.log('📋 Fetching EasyList from:', EASYLIST_URL);

  try {
    const response = await axios.get(EASYLIST_URL, {
      responseType: 'text',
      timeout: 30000
    });

    const lines = response.data.split('\n');
    console.log(`📄 Received ${lines.length} lines from EasyList`);

    const rules = [];
    let ruleId = 1; // Start from 1 for ad rules

    for (const line of lines) {
      if (rules.length >= MAX_RULES) {
        console.log(`✋ Reached max rule limit (${MAX_RULES})`);
        break;
      }

      const rule = parseLineToRule(line.trim(), ruleId);
      if (rule) {
        rules.push(rule);
        ruleId++;
      }
    }

    console.log(`✅ Parsed ${rules.length} valid ad blocking rules`);
    return rules;

  } catch (error) {
    console.error('❌ EasyList fetch/parse failed:', error.message);
    throw error;
  }
}

/**
 * Parses a single EasyList line into a declarativeNetRequest rule
 * @param {string} line - Single line from EasyList
 * @param {number} id - Rule ID
 * @returns {object|null} declarativeNetRequest rule or null if not applicable
 */
function parseLineToRule(line, id) {
  // Skip comments, empty lines, and cosmetic filters
  if (!line ||
      line.startsWith('!') ||
      line.startsWith('[') ||
      line.includes('##') ||
      line.includes('#@#') ||
      line.includes('#?#')) {
    return null;
  }

  // Parse network filters only
  // Common patterns: ||domain.com^, ||domain.com/path^, |https://domain.com

  let urlFilter = null;
  let resourceTypes = [
    'script',
    'image',
    'stylesheet',
    'xmlhttprequest',
    'sub_frame',
    'media',
    'font',
    'ping',
    'other'
  ];
  let domainType = null;
  let excludedDomains = [];
  let initiatorDomains = [];

  // Extract options if present (everything after $)
  let filterPart = line;
  let optionsPart = '';

  if (line.includes('$')) {
    const parts = line.split('$');
    filterPart = parts[0];
    optionsPart = parts[1] || '';
  }

  // Parse options
  if (optionsPart) {
    const options = optionsPart.split(',').map(opt => opt.trim());

    for (const option of options) {
      // Resource type filters
      if (option === 'script') resourceTypes = ['script'];
      else if (option === 'image') resourceTypes = ['image'];
      else if (option === 'stylesheet') resourceTypes = ['stylesheet'];
      else if (option === 'xmlhttprequest') resourceTypes = ['xmlhttprequest'];
      else if (option === 'subdocument') resourceTypes = ['sub_frame'];
      else if (option === 'media') resourceTypes = ['media'];
      else if (option === 'font') resourceTypes = ['font'];
      else if (option === 'ping') resourceTypes = ['ping'];

      // Domain type
      else if (option === 'third-party') domainType = ['thirdParty'];
      else if (option === '~third-party') domainType = ['firstParty'];

      // Domain restrictions
      else if (option.startsWith('domain=')) {
        const domains = option.substring(7).split('|');
        for (const domain of domains) {
          if (domain.startsWith('~')) {
            excludedDomains.push(domain.substring(1));
          } else {
            initiatorDomains.push(domain);
          }
        }
      }
    }
  }

  // Convert filter pattern to urlFilter
  if (filterPart.startsWith('||')) {
    // ||example.com^ → *://example.com/*
    let domain = filterPart.substring(2);

    // Remove trailing ^
    if (domain.endsWith('^')) {
      domain = domain.slice(0, -1);
    }

    // Handle wildcards
    domain = domain.replace(/\*/g, '*');

    // Simple domain filter
    if (!domain.includes('/') && !domain.includes('*')) {
      urlFilter = `*://*.${domain}/*`;
    } else {
      urlFilter = `*://${domain}*`;
    }

  } else if (filterPart.startsWith('|')) {
    // |https://example.com → https://example.com*
    urlFilter = filterPart.substring(1);
    if (!urlFilter.endsWith('*')) urlFilter += '*';

  } else if (filterPart.includes('://')) {
    // Full URL pattern
    urlFilter = filterPart;
    if (!urlFilter.endsWith('*')) urlFilter += '*';

  } else if (filterPart.startsWith('/') && filterPart.endsWith('/')) {
    // Regex pattern - skip for now (not well supported in declarativeNetRequest)
    return null;

  } else {
    // Simple substring match
    urlFilter = `*${filterPart}*`;
  }

  // Build the rule
  const rule = {
    id,
    priority: 1,
    action: {
      type: 'block'
    },
    condition: {
      urlFilter,
      resourceTypes
    }
  };

  // Add domain restrictions if present
  if (domainType) {
    rule.condition.domainType = domainType;
  }

  if (excludedDomains.length > 0) {
    rule.condition.excludedInitiatorDomains = excludedDomains;
  }

  if (initiatorDomains.length > 0) {
    rule.condition.initiatorDomains = initiatorDomains;
  }

  return rule;
}

/**
 * Validates a declarativeNetRequest rule
 * @param {object} rule - Rule to validate
 * @returns {boolean} True if valid
 */
function validateRule(rule) {
  try {
    // Basic validation
    if (!rule.id || !rule.action || !rule.condition) return false;
    if (!rule.condition.urlFilter && !rule.condition.regexFilter) return false;
    if (!rule.condition.resourceTypes || rule.condition.resourceTypes.length === 0) return false;

    // URL filter length check (Chrome has limits)
    if (rule.condition.urlFilter && rule.condition.urlFilter.length > 2048) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Generates the final rules JSON file for the extension
 * @returns {Promise<object>} Rules object with metadata
 */
async function generateAdBlockRules() {
  const rules = await fetchAndParseEasyList();

  // Filter out invalid rules
  const validRules = rules.filter(validateRule);

  console.log(`📊 Valid rules: ${validRules.length} / ${rules.length}`);

  return {
    rules: validRules,
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'EasyList',
      sourceUrl: EASYLIST_URL,
      ruleCount: validRules.length
    }
  };
}

module.exports = {
  fetchAndParseEasyList,
  generateAdBlockRules,
  parseLineToRule
};
