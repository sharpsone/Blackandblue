import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const DEFAULT_YEAR = "2026";

/* ============================================================
   ⭐ Helper: Determine Year
   ============================================================ */
function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

/* ============================================================
   ⭐ Helper: Require Login Middleware
   ============================================================ */
function requireLogin(req, res, next) {
  if (!req.cookies.userCookie) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/* ============================================================
   ⭐ Helper: Detect Correct MFL Host for the League
   ============================================================ */
async function detectMFLHost(year, leagueId) {
  const url = `https://api.myfantasyleague.com/${year}/export?TYPE=assets&L=${leagueId}&XML=1`;

  try {
    const res = await fetch(url);
    const xml = await res.text();

    const match = xml.match(/host="([^"]+)"/);
    const detectedHost = match ? match[1] : "www.myfantasyleague.com";

    console.log(`Detected MFL host for ${year}: ${detectedHost}`);
    return detectedHost;
  } catch (err) {
    console.error("HOST DETECTION ERROR:", err);
    return "www.myfantasyleague.com";
  }
}

/* ============================================================
   ⭐ LOGIN ROUTE — FIXED FOR node-fetch v3 + ESM
   ============================================================ */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, year } = req.body;

    const url = `https://api.myfantasyleague.com/${year}/export?TYPE=login&USERNAME=${username}&PASSWORD=${password}&JSON=1`;

    console.log("LOGIN URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log("LOGIN RESPONSE:", data);

    if (!data?.login || data.login.status !== "success") {
      console.log("❌ MFL Login Failed");
      return res.json({ success: false });
    }

    const userCookie = data.login.userCookie;

    res.cookie("userCookie", userCookie, {
      httpOnly: true,
      sameSite: "none",
      secure: true
    });

    console.log("✔ MFL COOKIE RECEIVED:", userCookie);

    return res.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.json({ success: false });
  }
});

/* ============================================================
   ⭐ LEAGUE INFO ROUTE
   ============================================================ */
app.get("/api/league/:leagueId", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=league&L=${leagueId}&JSON=1`;

    const response = await fetch(url);
    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("LEAGUE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch league" });
  }
});

/* ============================================================
   ⭐ ROSTER ROUTE — 2026 JSON API
   ============================================================ */
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
      console.error("❌ MFL returned HTML instead of JSON:", text.slice(0, 200));
      return res.status(500).json({ error: "MFL returned HTML instead of JSON" });
    }

    const data = JSON.parse(text);

    const players = data?.rosters?.franchise?.players?.player || [];

    return res.json({
      rosters: {
        franchise: {
          players: { player: players }
        }
      }
    });

  } catch (error) {
    console.error("ROSTER BACKEND ERROR:", error);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
});

/* ============================================================
   ⭐ STANDINGS ROUTE
   ============================================================ */
app.get("/api/league/:leagueId/standings", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=standings&L=${leagueId}&JSON=1`;

    const response = await fetch(url);
    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("STANDINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

/* ============================================================
   ⭐ START SERVER
   ============================================================ */
app.listen(3000, () => {
  console.log("Your service is live");
});
