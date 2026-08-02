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
    // FREE AGENTS (conference separated)
    // -----------------------------
    if (action === "freeAgents") {
      const apiKey = process.env.MFL_API_KEY;

      const playersUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
      const playersData = await callMFL(playersUrl);
      const allPlayers = playersData?.players?.player || [];

      const ranksUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerRanks&POS=&SOURCE=&JSON=1`;
      const ranksData = await callMFL(ranksUrl);
      const ranksList = ranksData?.player_ranks?.player || [];

      const projUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=projectedScores&L=${leagueId}&W=1&JSON=1`;
      const projData = await callMFL(projUrl);
      const projList = projData?.projectedScores?.playerScore || [];

      const faUrl = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=${leagueId}&APIKEY=${apiKey}&JSON=1`;
      const faData = await callMFL(faUrl);

      const units = faData?.freeAgents?.leagueUnit || [];
      const conferencePools = {};

      for (const unit of units) {
        const unitName = unit.unit || "UNKNOWN";
        const players = unit.player || [];

        conferencePools[unitName] = players.map(fa => {
          const p = allPlayers.find(x => x.id === fa.id);
          const r = ranksList.find(x => x.id === fa.id);
          const s = projList.find(x => x.id === fa.id);

          return {
            id: fa.id,
            name: p?.name || "Unknown",
            pos: p?.position || "UNK",
            team: p?.team || "",
            status: fa.status || "locked",
            rank: Number(r?.rank) || 9999,
            avg: Number(s?.score) || 0,
            news: fa.news || null
          };
        });
      }

      return res.status(200).json({ conferences: conferencePools });
    }

    // -----------------------------
    // PLAYER NEWS (MFL ONLY)
    // -----------------------------
    if (action === "playerNews") {
      const { playerId } = req.query;

      if (!playerId) {
        return res.status(400).json({ error: "Missing playerId" });
      }

      const url = `https://api.myfantasyleague.com/${year}/export?TYPE=playerNews&P=${playerId}&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ news: data?.news || [] });
    }

    // -----------------------------
    // ADD PLAYER
    // -----------------------------
    if (action === "addPlayer") {
      const { playerId, franchiseId } = req.query;
      if (!playerId || !franchiseId) {
        return res.status(400).json({ error: "Missing playerId or franchiseId" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=addPlayer&L=${leagueId}&FRANCHISE=${franchiseId}&PLAYER=${playerId}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ result: data });
    }

    // -----------------------------
    // WAIVER CLAIM
    // -----------------------------
    if (action === "waiverClaim") {
      const { playerId, franchiseId, bid } = req.query;
      if (!playerId || !franchiseId || !bid) {
        return res.status(400).json({ error: "Missing playerId, franchiseId, or bid" });
      }

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=waiverClaim&L=${leagueId}&FRANCHISE=${franchiseId}&PLAYER=${playerId}&BID=${bid}&JSON=1`;
      const data = await callMFL(url);

      return res.status(200).json({ result: data });
    }

    // -----------------------------
    // LEAGUE INFO
    // -----------------------------
    if (action === "league") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=league&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // -----------------------------
    // ROSTERS
    // -----------------------------
    if (action === "rosters") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=rosters&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // -----------------------------
    // WEEKLY RESULTS
    // -----------------------------
    if (action === "weekly") {
      const { week } = req.query;
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=weeklyResults&L=${leagueId}&W=${week || ""}&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // -----------------------------
    // PLAYERS (FULL LIST)
    // -----------------------------
    if (action === "players") {
      const url = `https://api.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // -----------------------------
    // SUBMIT LINEUP
    // -----------------------------
    if (action === "submitLineup") {
      const { franchiseId, week, lineup } = req.body || {};
      if (!franchiseId || !week || !lineup) {
        return res.status(400).json({ error: "Missing franchiseId, week, or lineup" });

