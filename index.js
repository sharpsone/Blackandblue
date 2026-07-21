const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));

const MFLClient = require('./mflClient');

// Example league ID — replace with yours
const YEAR = '2026';
const DEFAULT_HOST = 'api.myfantasyleague.com';

// ⭐ Create ONE shared MFL client for the whole server
const client = new MFLClient({
  year: YEAR,
  host: DEFAULT_HOST
});

// ⭐ Login once at startup using Render environment variables
(async () => {
  try {
    await client.login(process.env.MFL_USERNAME, process.env.MFL_PASSWORD);
    console.log("MFL login successful");
  } catch (err) {
    console.error("MFL login failed:", err.message);
  }
})();

// ⭐ Manual login route (keep this)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const tempClient = new MFLClient({ year: YEAR, host: DEFAULT_HOST });
    const cookie = await tempClient.login(username, password);
    res.json({ cookie });
  } catch (err) {
    res.status(401).json({ error: 'Login failed' });
  }
});

// ⭐ League info (uses shared logged-in client)
app.get('/api/league/:leagueId', async (req, res) => {
  const { leagueId } = req.params;

  try {
    const league = await client.getLeague(leagueId);
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// ⭐ Standings (uses shared logged-in client)
app.get('/api/league/:leagueId/standings', async (req, res) => {
  const { leagueId } = req.params;
  const { week } = req.query;

  try {
    const standings = await client.getStandings(leagueId, week);
    res.json(standings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// ⭐ Rosters (uses shared logged-in client)
app.get('/api/league/:leagueId/rosters', async (req, res) => {
  const { leagueId } = req.params;

  try {
    const rosters = await client.getRosters(leagueId);
    res.json(rosters);
  } catch (err) {
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
