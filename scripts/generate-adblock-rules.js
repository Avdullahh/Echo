/**
 * Build script to generate ad block rules from backend
 * Run this before building the extension: node scripts/generate-adblock-rules.js
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3000/api/adblock/rules';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'rules');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'adblock_rules.json');

console.log('🚫 Generating ad block rules...');
console.log(`📡 Fetching from: ${BACKEND_URL}`);

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  console.log(`📁 Creating directory: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fetch rules from backend
http.get(BACKEND_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const rulesData = JSON.parse(data);

      if (!rulesData.rules || !Array.isArray(rulesData.rules)) {
        throw new Error('Invalid rules format received');
      }

      console.log(`✅ Received ${rulesData.rules.length} ad block rules`);
      console.log(`📅 Generated at: ${rulesData.metadata.generatedAt}`);

      // Write to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rulesData.rules, null, 2));

      console.log(`💾 Saved to: ${OUTPUT_FILE}`);
      console.log('✅ Ad block rules generation complete!');

    } catch (error) {
      console.error('❌ Error processing rules:', error.message);
      process.exit(1);
    }
  });

}).on('error', (error) => {
  console.error('❌ Error fetching rules from backend:', error.message);
  console.error('💡 Make sure the backend is running: cd echo-backend && node server.js');
  process.exit(1);
});
