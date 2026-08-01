// /api/mfl.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { action } = req.query;

    // --- shared league/year resolution ---
    const leagueId =
      req.query.leagueId ||
      req.cookies?.leagueId ||
      process.env.MFL_LEAGUE_ID;

    const year =
      req.query.year ||
      req.cookies?.year ||
      process.env.MFL_YEAR;

    if (!leagueId || !year) {
      return res
        .status(400)
        .json({ error: "Missing leagueId or year", leagueId, year });
    }

    // --- helper: call MFL ---
    async function callMFL(url) {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`MFL error: ${resp.status} ${resp.statusText}`);
      }
      const text = await resp.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("Failed to parse MFL JSON");
      }
    }

// -----------------------------
// ACTION: freeAgents (with logging)
// -----------------------------
if (action === "freeAgents") {
  const leagueId = req.query.leagueId || req.cookies.leagueId;
  const year = req.query.year || req.cookies.year;

  console.log("FREE AGENTS CALL:", { leagueId, year });

  // 1. Get free agent IDs + status
  const faUrl = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=${leagueId}&JSON=1`;
  console.log("FREE AGENTS URL:", faUrl);

  const faData = await callMFL(faUrl);
  console.log("RAW FREE AGENTS RESPONSE:", JSON.stringify(faData, null, 2));

  // Flatten leagueUnit blocks
  const faPlayers = [];
  const units = faData?.freeAgents?.leagueUnit || [];

  console.log("LEAGUE UNITS FOUND:", units.length);

  for (const unit of units) {
    if (unit.player && Array.isArray(unit.player)) {
      faPlayers.push(...unit.player);
    }
  }

  console.log("FLATTENED FREE AGENTS:", faPlayers.length, faPlayers.slice(0, 10));

  // 2. Lookup each player individually
  const results = [];

  for (const fa of faPlayers) {
    console.log("LOOKUP PLAYER:", fa.id);

    const pUrl = `https://www44.myfantasyleague.com/${year}/export?TYPE=player&L=${leagueId}&P=${fa.id}&JSON=1`;
    console.log("PLAYER LOOKUP URL:", pUrl);

    const pData = await callMFL(pUrl);
    console.log("PLAYER LOOKUP RESULT:", JSON.stringify(pData, null, 2));

    const p = pData?.player;
    if (!p) {
      console.log("NO PLAYER DATA FOR ID:", fa.id);
      continue;
    }

    results.push({
      id: p.id,
      name: p.name,
      pos: p.position,
      team: p.team,
      status: fa.status || "locked",
      rank: null,
      avg: null,
    });
  }

  console.log("MERGED FREE AGENTS:", results.length);

  return res.status(200).json({ players: results });
}

    // --- ACTION: addPlayer ---
    if (action === "addPlayer") {
      const { playerId, franchiseId } = req.query;
      if (!playerId || !franchiseId) {
        return res
          .status(400)
          .json({ error: "Missing playerId or franchiseId" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=addPlayer&L=${leagueId}&FRANCHISE=${franchiseId}&PLAYER=${playerId}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ result: data });
    }

    // --- ACTION: waiverClaim ---
    if (action === "waiverClaim") {
      const { playerId, franchiseId, bid } = req.query;
      if (!playerId || !franchiseId || !bid) {
        return res
          .status(400)
          .json({ error: "Missing playerId, franchiseId, or bid" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=waiverClaim&L=${leagueId}&FRANCHISE=${franchiseId}&PLAYER=${playerId}&BID=${bid}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ result: data });
    }

    // --- ACTION: league ---
    if (action === "league") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=league&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // --- ACTION: rosters ---
    if (action === "rosters") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=rosters&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // --- ACTION: weekly ---
    if (action === "weekly") {
      const { week } = req.query;
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=weeklyResults&L=${leagueId}&W=${week || ""}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // --- ACTION: players ---
    if (action === "players") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=players&L=${leagueId}&DETAILS=1&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // --- ACTION: submitLineup ---
    if (action === "submitLineup") {
      const { franchiseId, week, lineup } = req.body || {};
      if (!franchiseId || !week || !lineup) {
        return res
          .status(400)
          .json({ error: "Missing franchiseId, week, or lineup" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=submitLineup&L=${leagueId}&FRANCHISE=${franchiseId}&W=${week}&JSON=1`;
      const params = new URLSearchParams();
      params.append("LINEUP", lineup);

      const resp = await fetch(url, {
        method: "POST",
        body: params,
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      return res.status(200).json(data);
    }

    // --- unknown action ---
    return res.status(400).json({ error: "Unknown action", action });
  } catch (err) {
    console.error("mfl.js error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}

