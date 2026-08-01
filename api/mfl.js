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
    // ACTION: freeAgents
    // -----------------------------
    if (action === "freeAgents") {
    const leagueId = req.query.leagueId || req.cookies.leagueId;
    const year = req.query.year || req.cookies.year;

    if (!leagueId || !year) {
        return res.status(400).json({ error: "Missing leagueId or year" });
    }

    // DETAILS=1 is REQUIRED for your league
    const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=${leagueId}&DETAILS=1&JSON=1`;

    const data = await callMFL(url);

    // MFL returns: freeAgents → leagueUnit → unit → player[]
    const rawPlayers =
        data?.freeAgents?.leagueUnit?.unit?.player || [];

    const players = rawPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        pos: p.position,
        team: p.team,
        status: p.status,
        rank: null,
        avg: null,
    }));

    return res.status(200).json({ players });
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

