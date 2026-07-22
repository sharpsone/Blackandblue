const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MFLClient = require("./mflClient");

const app = express();

// ⭐ FIXED CORS — allows cookies to pass through Render
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

const YEAR = "2026";
const DEFAULT_HOST = "api.myfantasyleague.com";
const LEAGUE_API_KEY = "ahVp3s+SvuWpx1emOVDGZDUeFKUtiQ==";

let userCookie = null;

// ⭐ LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const tempClient = new MFLClient({
      year: YEAR,
      host: DEFAULT_HOST
    });

    const cookie = await tempClient.login(username, password);
    console.log("MFL COOKIE RECEIVED:", cookie);

    userCookie = cookie;

    // ⭐ Send cookie to browser (Render requires secure + sameSite none)
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

// ⭐ Require login
function requireLogin(req, res, next) {
  if (!userCookie) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

// ⭐ League info
app.get("/api/league/:leagueId", requireLogin, async (req, res) => {
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
    console.error("LEAGUE ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch league" });
  }
});

// ⭐ Standings
app.get("/api/league/:leagueId/standings", requireLogin, async (req, res) => {
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
    console.error("STANDINGS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

// ⭐ Rosters
app.get("/api/league/:leagueId/rosters", requireLogin, async (req, res) => {
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
    console.error("ROSTERS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
});

// ⭐ My Leagues
app.get("/api/myleagues", requireLogin, async (req, res) => {
  const client = new MFLClient({
    year: YEAR,
    host: DEFAULT_HOST,
    cookie: userCookie
  });

  try {
    const leagues = await client.request("export", { TYPE: "myleagues" });
    res.json(leagues);
  } catch (err) {
    console.error("MYLEAGUES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch my leagues" });
  }
});
