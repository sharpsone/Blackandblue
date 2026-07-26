import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import xml2js from "xml2js";

const app = express();

/* ============================================================
   CORS — REQUIRED FOR LOGIN COOKIE TO WORK
   ============================================================ */
app.use(
  cors({
    origin: "https://blackandblue.vercel.app",
    credentials: true
  })
);

// Allow preflight requests
app.options("*", cors());

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
   LOGIN ROUTE — FIXED COOKIE EXTRACTION
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

    const statusAttrs = parsed.status?.$;
    if (!statusAttrs) {
      console.log("❌ No status attributes found");
      return res.json({ success: false });
    }

    // ⭐ FIX: Prefer MFL_GLOBAL → fallback to MFL_USER → fallback to first attribute
    let cookieName = null;
    let cookieValue = null;

    if (statusAttrs.MFL_GLOBAL) {
      cookieName = "MFL_GLOBAL";
      cookieValue = statusAttrs.MFL_GLOBAL;
    } else if (statusAttrs.MFL_USER) {
      cookieName = "MFL_USER";
      cookieValue = statusAttrs.MFL_USER;
    } else {
      cookieName = Object.keys(statusAttrs)[0];
      cookieValue = statusAttrs[cookieName];
    }

    if (!cookieName || !cookieValue) {
      console.log("❌ Could not extract cookie name/value");
      return res.json({ success: false });
    }

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
   Helper: Build headers with cookie
   ============================================================ */
function buildAuthHeaders(req) {
  const cookieName = Object.keys(req.cookies)[0];
  const cookieValue = req.cookies[cookieName];

  return {
    Cookie: `${cookieName}=${cookieValue}`
  };
}

/* ============================================================
   LEAGUE INFO ROUTE
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

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("LEAGUE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch league" });
  }
});

/* ============================================================
   STANDINGS ROUTE
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

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("STANDINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
});

/* ============================================================
   SCHEDULE ROUTE — normalized
   ============================================================ */
app.get("/api/league/:leagueId/schedule", requireLogin, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=schedule&L=${leagueId}&JSON=1${
      MFL_APIKEY ? `&APIKEY=${encodeURIComponent(MFL_APIKEY)}` : ""
    }`;

    console.log("SCHEDULE URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    const weeklySchedule =
      raw?.schedule?.weeklySchedule ||
      raw?.weeklySchedule ||
      [];

    return res.json({
      schedule: {
        weeklySchedule
      }
    });

  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

/* ============================================================
   MYLEAGUES ROUTE — franchise detection
   ============================================================ */
app.get("/api/myleagues", requireLogin, async (req, res) => {
  try {
    const year = getYear(req);

    const url = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&JSON=1`;

    console.log("MYLEAGUES URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const data = await response.json();

    return res.json(data);

  } catch (err) {
    console.error("MYLEAGUES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch my leagues" });
  }
});

/* ============================================================
   ROSTER ROUTE — franchise-aware
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

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    const franchiseObj =
      raw?.rosters?.franchise ||
      raw?.franchise ||
      null;

    const players =
      franchiseObj?.players?.player ||
      [];

    return res.json({
      roster: {
        franchiseId,
        players
      }
    });

  } catch (error) {
    console.error("ROSTER BACKEND ERROR:", error);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
});

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(3000, () => {
  console.log("Your service is live");
});
