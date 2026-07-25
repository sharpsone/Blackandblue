const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MFLClient = require("./mflClient");

const fetch = global.fetch;

const app = express();

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

const DEFAULT_YEAR = "2026";
const DEFAULT_API_HOST = "api.myfantasyleague.com";
const LEAGUE_API_KEY = "ahVp3s+SvuWqx1qmOVDGZDUeFKUtiQ==";

let userCookie = null;
let mflUsername = null;
let mflPassword = null;

const hostCache = {};

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

function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

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

function requireLogin(req, res, next) {
  if (!userCookie || !mflUsername || !mflPassword) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/* ⭐ ROSTERS */
app.get("/api/league/:leagueId/rosters", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { franchiseId } = req.query;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=rosters&L=${leagueId}&FRANCHISE=${franchiseId}&JSON=1`;

    console.log("ROSTER URL:", url);

    const response = await fetch(url);
    const text = await response.text();

    if (text.startsWith("<")) {
      console.error("MFL returned HTML instead of JSON:", text.slice(0, 200));
      return res
        .status(500)
        .json({ error: "MFL returned HTML instead of JSON" });
    }

    const data = JSON.parse(text);

    return res.json({
      rosters: {
        franchise: {
          players: {
            player: data?.rosters?.franchise?.players?.player || []
          }
        }
      }
    });
  } catch (error) {
    console.error("ROSTER BACKEND ERROR:", error);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
});

/* ⭐ LEAGUE INFO */
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

/* ⭐ MY LEAGUES (still available, but no longer critical) */
app.get("/api/myleagues", requireLogin, async (req, res) => {
  const year = getYear(req);

  const client = new MFLClient({
    year,
    host: DEFAULT_API_HOST,
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

/* ⭐ STANDINGS */
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

/* ⭐ LIVE SCORING */
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

/* ⭐ MATCHUPS */
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

/* ⭐ FREE AGENTS */
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

/* ⭐ MESSAGE BOARD */
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

/* ⭐ SCHEDULE */
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

/* ⭐ TRANSACTIONS */
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

/* ⭐ PLAYER STATS */
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

/* ⭐ DRAFT RESULTS */
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

/* ⭐ PLAYOFF BRACKET */
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
