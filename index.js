const express = require('express');
const cors = require('cors');
const MFLClient = require('./mflClient');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));

const YEAR = '2026';
const DEFAULT_HOST = 'www03.myfantasyleague.com';

// ⭐ League-specific API key from MFL docs
const LEAGUE_API_KEY = 'ahVp3s+SvuWpx1emOVDGZDUeFKUtiQ==';

// ⭐ Store logged-in user's cookie (for future commissioner ops)
let userCookie = null;

// ⭐ Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const tempClient = new MFLClient({
      year: YEAR,
      host: DEFAULT_HOST
    });

    const cookie = await tempClient.login(username, password);
    console.log('MFL COOKIE RECEIVED:', cookie);

    userCookie = cookie;

    res.json({ success: true });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(401).json({ error: 'Login failed' });
  }
});

// ⭐ Require login before league-specific data (optional guard)
function requireLogin(req, res, next) {
  if (!userCookie) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// ⭐ League info (uses APIKEY)
app.get('/api/league/:leagueId', requireLogin, async (req, res) => {
  const { leagueId } = req.params;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    apiKey: LEAGUE_API_KEY
  });

  try {
    const league = await client.getLeague(leagueId);
    res.json(league);
  } catch (err) {
    console.error('LEAGUE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// ⭐ Standings (uses APIKEY)
app.get('/api/league/:leagueId/standings', requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const { week } = req.query;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    apiKey: LEAGUE_API_KEY
  });

  try {
    const standings = await client.getStandings(leagueId, week);
    res.json(standings);
  } catch (err) {
    console.error('STANDINGS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// ⭐ Rosters (uses APIKEY)
app.get('/api/league/:leagueId/rosters', requireLogin, async (req, res) => {
  const { leagueId } = req.params;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    apiKey: LEAGUE_API_KEY
  });

  try {
    const rosters = await client.getRosters(leagueId);
    res.json(rosters);
  } catch (err) {
    console.error('ROSTERS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch rosters' });
  }
});

// ⭐ DB test route (unchanged)
const db = require('./db');

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query('select now()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
