// /api/mfl.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { action } = req.query;

    const leagueId =
      req.query.leagueId ||
      req.cookies?.leagueId ||
      process.env.MFL_LEAGUE_ID;

    const year =
      req.query.year ||
      req.cookies?.year ||
      process.env.MFL_YEAR;

    if (!leagueId || !year) {
      return res.status(400).json({ error: "Missing leagueId or year" });
    }

    async function callMFL(url) {
      console.log("CALLING MFL:", url);
      const resp = await fetch(url);
      const text = await resp.text();

      try {
        const json = JSON.parse(text);
        console.log("MFL RESPONSE:", JSON.stringify(json).slice(0, 500));
        return json;
      } catch {
        console.log("RAW MFL TEXT:", text.slice(0, 500));
        throw new Error("Failed to parse MFL JSON");
      }
    }

 // -----------------------------
// ACTION: freeAgents (final version)
// -----------------------------
if (action === "freeAgents") {
  const apiKey = process.env.MFL_API_KEY;

  console.log("FREE AGENTS CALL:", { leagueId, year });
  console.log("APIKEY FROM ENV:", apiKey);

  if (!apiKey) {
    return res.status(400).json({ error: "Missing APIKEY" });
  }

  // ---------------------------------------------------------
  // 1. Get ALL players (metadata)
  // ---------------------------------------------------------
  const playersUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
  const playersData = await callMFL(playersUrl);
  const allPlayers = playersData?.players?.player || [];
  console.log("TOTAL PLAYERS:", allPlayers.length);

  // ---------------------------------------------------------
  // 2. Get ALL ranks (no POS → returns all players)
  // ---------------------------------------------------------
  const ranksUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerRanks&POS=&SOURCE=8&JSON=1`;
  const ranksData = await callMFL(ranksUrl);
  const ranksList = ranksData?.player_ranks?.player || [];
  console.log("TOTAL RANKS:", ranksList.length);

  // ---------------------------------------------------------
  // 3. Get ALL projected scores (avg)
  // ---------------------------------------------------------
  const projUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=projectedScores&W=1&JSON=1`;
  const projData = await callMFL(projUrl);
  const projList = projData?.projectedScores?.playerScore || [];
  console.log("TOTAL PROJECTIONS:", projList.length);

  // ---------------------------------------------------------
  // 4. Get free agent IDs
  // ---------------------------------------------------------
  const faUrl = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=${leagueId}&APIKEY=${apiKey}&JSON=1`;
  const faData = await callMFL(faUrl);

  const units = faData?.freeAgents?.leagueUnit || [];
  const faPlayers = [];

  for (const unit of units) {
    if (unit.player && Array.isArray(unit.player)) {
      faPlayers.push(...unit.player);
    }
  }

  console.log("TOTAL FREE AGENTS:", faPlayers.length);

  // ---------------------------------------------------------
  // 5. Merge everything
  // ---------------------------------------------------------
  const results = faPlayers.map(fa => {
    const p = allPlayers.find(x => x.id === fa.id);
    const r = ranksList.find(x => x.id === fa.id);
    const s = projList.find(x => x.id === fa.id);

    return {
      id: fa.id,
      name: p?.name || "Unknown",

      // FIX: return BOTH fields
      position: p?.position || "UNK",
      pos: p?.position || "UNK",

      team: p?.team || "",
      status: fa.status || "locked",

      // FIX: numeric rank + avg
      rank: Number(r?.rank) || 9999,
      avg: Number(s?.score) || 0,
    };
  });

  console.log("MERGED FREE AGENTS:", results.length);

  return res.status(200).json({ players: results });
}

    // --- ACTION: addPlayer ---
    if (action === "addPlayer") {
      const { playerId, franchiseId } = req.query;
      if (!playerId || !franchiseId) {
        return res.status(400).json({ error: "Missing playerId or franchiseId" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=addPlayer&L=${leagueId}&FRANCHISE=${franchiseId}&PLAYER=${playerId}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ result: data });
    }

    // --- ACTION: waiverClaim ---
    if (action === "waiverClaim") {
      const { playerId, franchiseId, bid } = req.query;
      if (!playerId || !franchiseId || !bid) {
        return res.status(400).json({ error: "Missing playerId, franchiseId, or bid" });
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
      const url = `https://api.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // --- ACTION: submitLineup ---
    if (action === "submitLineup") {
      const { franchiseId, week, lineup } = req.body || {};
      if (!franchiseId || !week || !lineup) {
        return res.status(400).json({ error: "Missing franchiseId, week, or lineup" });
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

    return res.status(400).json({ error: "Unknown action", action });

  } catch (err) {
    console.error("mfl.js error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
