import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import xml2js from "xml2js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const DEFAULT_YEAR = "2026";
const MFL_APIKEY = process.env.MFL_APIKEY;

/* ============================================================
   Helper: Determine Year
   ============================================================ */
function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

/* ============================================================
   Helper: Require Login Middleware
   ============================================================ */
function requireLogin(req, res, next) {
  const hasCookie = Object.keys(req.cookies || {}).length > 0;

  if (!hasCookie) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/* ============================================================
   Helper: Detect Correct MFL Host for the League
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
   LOGIN ROUTE — Correct XML login + cookie extraction
   ============================================================ */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, year } = req.body;
    const season = year || DEFAULT_YEAR;

    const url = `https://api.myfantasyleague.com/${season}/login?USERNAME=${encodeURIComponent(
      username
    )}&PASSWORD=${encodeURIComponent(password)}&XML=1`;

    console.log("LOGIN URL:", url);

    const response = await fetch(url);
    const xml = await response.text();

    console.log("LOGIN XML RESPONSE:", xml);

    const parsed = await xml2js.parseStringPromise(xml);

    if (parsed.error) {
      console.log("❌ MFL Login Error:", parsed.error);
      return res.json({ success: false });
    }

    const status = parsed.status?.$;
    if (!status || !status.cookie_name || !status.cookie_value) {
      console.log("❌ Missing cookie info in login response");
      return res.json({ success: false });
    }

    const cookieName = status.cookie_name;
    const cookieValue = status.cookie_value;

    res.cookie(cookieName, cookieValue, {
      httpOnly: true,
      sameSite: "none",
      secure: true
    });

    console.log("✔ MFL COOKIE SET:", cookieName, cookieValue);

    return res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.json({ success: false });
  }
});

/* ============================================================
   LEAGUE INFO ROUTE — APIKEY hybrid auth
   ============================================================ */
app.get("/api/league/:leagueId", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=league&L=${leagueId}&JSON=1${
      MFL_APIKEY ? `&APIKEY=${encodeURIComponent(MFL_APIKEY)}` : ""
    }`;

    console.log("LEAGUE URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("LEAGUE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch league" });
  }
});

/* ============================================================
   ROSTER ROUTE — APIKEY hybrid auth
   ============================================================ */
app.get("/api/league/:leagueId/rosters", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { franchiseId } = req.query;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=rosters&L=${leagueId}&FRANCHISE=${franchiseId}&JSON=1${
      MFL_APIKEY ? `&APIKEY=${encodeURIComponent(MFL_APIKEY)}` : ""
    }`;

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
   STANDINGS ROUTE — APIKEY hybrid auth
   ============================================================ */
app.get("/api/league/:leagueId/standings", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=standings&L=${leagueId}&JSON=1${
      MFL_APIKEY ? `&APIKEY=${encodeURIComponent(MFL_APIKEY)}` : ""
    }`;

    console.log("STANDINGS URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("STANDINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(3000, () => {
  console.log("Your service is live");
});
