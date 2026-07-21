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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const client = new MFLClient({ year: YEAR, host: DEFAULT_HOST });
    const cookie = await client.login(username, password);
    res.json({ cookie });
  } catch (err) {
    res.status(401).json({ error: 'Login failed' });
  }
});

app.get('/api/league/:leagueId', async (req, res) => {
  const { leagueId } = req.params;
  const client = new MFLClient({ year: YEAR, host: DEFAULT_HOST });

  try {
    const league = await client.getLeague(leagueId);
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

app.get('/api/league/:leagueId/standings', async (req, res) => {
  const { leagueId } = req.params;
  const { week } = req.query;

  const client = new MFLClient({ year: YEAR, host: DEFAULT_HOST });

  try {
    const standings = await client.getStandings(leagueId, week);
    res.json(standings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

app.get('/api/league/:leagueId/rosters', async (req, res) => {
  const { leagueId } = req.params;
  const client = new MFLClient({ year: YEAR, host: DEFAULT_HOST });

  try {
    const rosters = await client.getRosters(leagueId);
    res.json(rosters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rosters' });
  }
});
