const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to leaderboard storage
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Helper to read leaderboard
function getLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
  }
  return [
    { name: 'Kael_99', score: 48500, kills: 1420, timeSurvived: '15:00', character: 'Cyber Ninja', date: '2026-10-10' },
    { name: 'NovaViper', score: 39200, kills: 1150, timeSurvived: '13:42', character: 'Netrunner', date: '2026-10-11' },
    { name: 'TitanX', score: 32100, kills: 980, timeSurvived: '11:15', character: 'Heavy Mech', date: '2026-10-12' },
    { name: 'GhostZero', score: 25400, kills: 740, timeSurvived: '09:20', character: 'Cyber Ninja', date: '2026-10-13' },
    { name: 'GlitchQueen', score: 18900, kills: 560, timeSurvived: '07:45', character: 'Netrunner', date: '2026-10-13' }
  ];
}

// Helper to save leaderboard
function saveLeaderboard(data) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving leaderboard file:', err);
  }
}

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = getLeaderboard();
  res.json({ success: true, leaderboard: leaderboard.slice(0, 20) });
});

// POST /api/leaderboard
app.post('/api/leaderboard', (req, res) => {
  const { name, score, kills, timeSurvived, character } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const leaderboard = getLeaderboard();
  const entry = {
    name: String(name).slice(0, 15).replace(/[^\w\s-]/g, '') || 'Runner',
    score: Math.max(0, Math.floor(score)),
    kills: Math.max(0, Math.floor(kills || 0)),
    timeSurvived: timeSurvived || '00:00',
    character: character || 'Cyber Ninja',
    date: new Date().toISOString().split('T')[0]
  };

  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  const trimmed = leaderboard.slice(0, 50);
  saveLeaderboard(trimmed);

  res.json({ success: true, entry, rank: trimmed.findIndex(e => e === entry) + 1 });
});

// Health check / Flippa status API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    game: 'Cyber Survivors: Neon Protocol',
    version: '1.0.0',
    monetization: {
      adsenseEnabled: false,
      rewardedAdsActive: true,
      shopActive: true
    }
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`⚡ Cyber Survivors: Neon Protocol is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🕹️  Ready for browser play & Flippa presentation.`);
  console.log(`=================================================`);
});
