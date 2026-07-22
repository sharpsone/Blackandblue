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

const YEAR = '2026';
const DEFAULT_HOST = 'www03.myfantasyleague.com';


// ⭐ Store the logged-in user's cookie (simple version)
let userCookie = null;

// ⭐ User login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const tempClient = new MFLClient({ year: YEAR, host: DEFAULT_HOST });
    const cookie = await tempClient.login(username, password);

    console.log("MFL COOKIE RECEIVED:", cookie);   // ⭐ ADD THIS

    // Save cookie for future API calls
    userCookie = cookie;

    res.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);   // ⭐ ADD THIS
    res.status(401).json({ error: 'Login failed' });
  }
});

// ⭐ Require login before accessing league data
function requireLogin(req, res, next) {
  if (!userCookie) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

// ⭐ League info
app.get('/api/league/:leagueId', requireLogin, async (req, res) => {
  const { leagueId } = req.params;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    cookie: userCookie
  });

  try {
    const league = await client.getLeague(leagueId);
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// ⭐ Standings
app.get('/api/league/:leagueId/standings', requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const { week } = req.query;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    cookie: userCookie
  });

  try {
    const standings = await client.getStandings(leagueId, week);
    res.json(standings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// ⭐ Rosters
app.get('/api/league/:leagueId/rosters', requireLogin, async (req, res) => {
  const { leagueId } = req.params;

  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    cookie: userCookie
  });

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
