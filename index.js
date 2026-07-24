const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MFLClient = require("./mflClient");

// ⭐ REQUIRED for Node 18+ in CommonJS
const fetch = global.fetch;

const app = express();

// ⭐ CORS for Vercel frontend
app.use(
  cors({
    origin: "https://blackandblue.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));

// ⭐ Default year (fallback)
const DEFAULT_YEAR = "2026";
const DEFAULT_API_HOST = "api.myfantasyleague.com";
const LEAGUE_API_KEY = "ahVp3s+SvuWqx1qmOVDGZDUeFKUtiQ==";

let userCookie = null;
let mflUsername = null;
let mflPassword = null;

// ⭐ Cache detected hosts per year
const hostCache = {};

// ⭐ HARD-CODED HOST FOR 2025
async function detectMFLHost(year, leagueId) {
  if (year === "2025") {
    const fixedHost = "www44.myfantasyleague.com";
    console.log(`Detected MFL host for 2025: ${fixedHost}`);
    return fixedHost;
  }

  if (hostCache[year]) return hostCache[year];

  const url = `https://${DEFAULT_API_HOST}/${year}/export?TYPE=assets&L=${leagueId}&XML=1`;

  try {
    const res = await fetch(url);
    const xml = await res.text();

    const match = xml.match(/host="([^"]+)"/);
    const detectedHost = match ? match[1] : "www.myfantasyleague.com";

    hostCache[year] = detectedHost;

    console.log(`Detected MFL host for ${year}: ${detectedHost}`);

    return detectedHost;
  } catch (err) {
    console.error("HOST DETECTION ERROR:", err);
    return "www.myfantasyleague.com";
  }
}

// ⭐ Helper: get year from query or fallback
function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

// ⭐ LOGIN (always uses API host)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const year = getYear(req);

  try {
    mflUsername = username;
    mflPassword = password;

    const tempClient = new MFLClient({
      year,
      host: DEFAULT_API_HOST
    });

    const cookie = await tempClient.login(username, password);
    console.log("MFL COOKIE RECEIVED:", cookie);

    userCookie = cookie;

    res.cookie("mfl_session", cookie, {
      httpOnly: false,
      secure: true,
      sameSite: "none"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(401).json({ error: "Login failed" });
  }
});

// ⭐ Require login middleware
function requireLogin(req, res, next) {
  if (!userCookie || !mflUsername || !mflPassword) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

// ⭐ My Leagues — FINAL FIX (ONLY THIS VERSION)
app.get("/api/myleagues", requireLogin, async (req, res) => {
  const year = getYear(req);

  const client = new MFLClient({
    year,
    host: "api.myfantasyleague.com",   // ⭐ ALWAYS API HOST
    cookie: userCookie,
    username: mflUsername,
    password: mflPassword
  });

  try {
    const leagues = await client.getMyLeagues();
    res.json(leagues);
  } catch (err) {
    console.error("MYLEAGUES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch my leagues" });
  }
});

// ⭐ League Info
app.get("/api/league/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    cookie: userCookie,
    username: mflUsername,
    password: mflPassword
  });

  try {
    const league = await client.getLeague(leagueId);
    res.json(league);
  } catch (err) {
    console.error("LEAGUE ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch league" });
  }
});

// ⭐ Standings
app.get("/api/standings/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const standings = await client.getStandings(leagueId);
    res.json(standings);
  } catch (err) {
    console.error("STANDINGS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

// ⭐ Rosters
app.get("/api/league/:leagueId/rosters", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const rosters = await client.getRosters(leagueId);
    res.json(rosters);
  } catch (err) {
    console.error("ROSTERS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
});

// ⭐ Live Scoring
app.get("/api/live/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const live = await client.request("liveScoring", { L: leagueId });
    res.json(live);
  } catch (err) {
    console.error("LIVE ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch live scoring" });
  }
});

// ⭐ Matchups
app.get("/api/matchups/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const matchups = await client.request("schedule", { L: leagueId });
    res.json(matchups);
  } catch (err) {
    console.error("MATCHUPS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch matchups" });
  }
});

// ⭐ Free Agents
app.get("/api/freeagents/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const freeAgents = await client.request("freeAgents", { L: leagueId });
    res.json(freeAgents);
  } catch (err) {
    console.error("FREE AGENTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch free agents" });
  }
});

// ⭐ Message Board
app.get("/api/messages/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const messages = await client.request("messageBoard", { L: leagueId });
    res.json(messages);
  } catch (err) {
    console.error("MESSAGES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch message board" });
  }
});

// ⭐ Schedule
app.get("/api/schedule/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const schedule = await client.getSchedule(leagueId);
    res.json(schedule);
  } catch (err) {
    console.error("SCHEDULE ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// ⭐ Transactions
app.get("/api/transactions/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const transactions = await client.request("transactions", { L: leagueId });
    res.json(transactions);
  } catch (err) {
    console.error("TRANSACTIONS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ⭐ Player Stats
app.get("/api/playerstats/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const stats = await client.request("playerStats", { L: leagueId });
    res.json(stats);
  } catch (err) {
    console.error("PLAYER STATS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch player stats" });
  }
});

// ⭐ Draft Results
app.get("/api/draftresults/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const draft = await client.request("draftResults", { L: leagueId });
    res.json(draft);
  } catch (err) {
    console.error("DRAFT RESULTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch draft results" });
  }
});

// ⭐ Playoff Bracket
app.get("/api/playoffs/:leagueId", requireLogin, async (req, res) => {
  const { leagueId } = req.params;
  const year = getYear(req);

  const host = await detectMFLHost(year, leagueId);

  const client = new MFLClient({
    year,
    host,
    apiKey: LEAGUE_API_KEY,
    cookie: userCookie
  });

  try {
    const playoffs = await client.request("playoffBracket", { L: leagueId });
    res.json(playoffs);
  } catch (err) {
    console.error("PLAYOFFS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch playoff bracket" });
  }
});
