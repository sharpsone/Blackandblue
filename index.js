import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const DEFAULT_YEAR = "2026";

// ⚠️ Set this in your environment on Render, not hard-coded.
// e.g. MFL_APIKEY=ahVp3s+SvuWpx1emOVDGZDUeFKUtiQ==
const MFL_APIKEY = process.env.MFL_APIKEY;

/* ============================================================
   Helper: Determine Year
   ============================================================ */
function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

/* ============================================================
   Helper: Require Login Middleware
   - Checks for the MFL user cookie
   ============================================================ */
function requireLogin(req, res, next) {
  // MFL docs: cookie name is typically MFL_USER_ID
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
   LOGIN ROUTE — Correct /login command + cookie
   ============================================================ */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, year } = req.body;
    const season = year || DEFAULT_YEAR;

    // Correct login endpoint per MFL docs:
    // https://api.myfantasyleague.com/2026/login?USERNAME=...&PASSWORD=...&XML=1
    const url = `https://api.myfantasyleague.com/${season}/login?USERNAME=${encodeURIComponent(
      username
    )}&PASSWORD=${encodeURIComponent(password)}&JSON=1`;

    console.log("LOGIN URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log("LOGIN RESPONSE:", data);

    // MFL docs: valid login returns <status cookie_name="..." cookie_value="...">
    if (data.error) {
      console.log("❌ MFL Login Error:", data.error);
      return res.json({ success: false });
    }

    const status = data.status;
    if (!status || !status.cookie_name || !status.cookie_value) {
      console.log("❌ MFL Login Missing Cookie Info");
      return res.json({ success: false });
    }

    const cookieName = status.cookie_name;   // e.g. "MFL_USER_ID"
    const cookieValue = status.cookie_value; // base64 value

    // Set the MFL user cookie for subsequent requests
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
   LEAGUE INFO ROUTE — uses APIKEY for auth
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
   ROSTER ROUTE — 2026 JSON API + APIKEY
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
   STANDINGS ROUTE — 2026 JSON API + APIKEY
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
