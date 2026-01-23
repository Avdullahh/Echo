const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const JSONStream = require('JSONStream');
require('dotenv').config(); // <--- LOADS THE HIDDEN .ENV FILE

const app = express();
const PORT = 3000;

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

// --- DATA MODEL ---
const TrackerSchema = new mongoose.Schema({
  id: Number,
  domain: String,
  owner: String,
  category: String,
  risk: String
});
const Tracker = mongoose.model('Tracker', TrackerSchema);

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

app.listen(PORT, () => {
  console.log(`🚀 Echo Backend running at http://localhost:${PORT}`);
});