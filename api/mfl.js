// pages/api/mfl.js

export default async function handler(req, res) {
  const { action, playerId } = req.query;
  const cookies = req.headers.cookie || "";
  const year = new Date().getFullYear();
  const leagueId = "19757";
  const franchiseId = "0012"; // your franchise

  // Helper to call MFL with cookies forwarded
  async function callMFL(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BlackAndBlueApp",
        "Cookie": cookies,
        "Accept": "*/*",
      },
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return { error: "Non-JSON response", raw: text };
    }
  }

  // -----------------------------
  // ACTION: freeAgents
  // -----------------------------
  if (action === "freeAgents") {
    const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=${leagueId}&JSON=1`;
    const data = await callMFL(url);

    const players = (data.freeAgents || []).map((p) => ({
      id: p.id,
      name: p.name,
      pos: p.position,
      team: p.team,
      rank: null,
      avg: null,
    }));

    return res.status(200).json({ players });
  }

  // -----------------------------
  // ACTION: playerStats
  // -----------------------------
  if (action === "playerStats") {
    if (!playerId) return res.status(400).json({ error: "Missing playerId" });

    const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=playerScores&L=${leagueId}&JSON=1&PLAYERS=${playerId}`;
    const data = await callMFL(url);

    const scores = data.playerScores?.playerScore || [];
    const weekly = scores.map((w) => Number(w.score || 0));

    const avg =
      weekly.length > 0
        ? (weekly.reduce((a, b) => a + b, 0) / weekly.length).toFixed(1)
        : 0;

    const last3 = weekly.slice(-3).reduce((a, b) => a + b, 0).toFixed(1);

    return res.status(200).json({
      weekly,
      avg,
      last3,
      rank: scores[0]?.rank || null,
    });
  }

  // -----------------------------
  // ACTION: addPlayer
  // -----------------------------
  if (action === "addPlayer") {
    if (!playerId) return res.status(400).json({ error: "Missing playerId" });

    const params = new URLSearchParams({
      TYPE: "addDrop",
      L: leagueId,
      FRANCHISE_ID: franchiseId,
      ADD: playerId,
      JSON: 1,
    });

    const url = `https://www44.myfantasyleague.com/${year}/import?${params.toString()}`;
    const data = await callMFL(url);

    return res.status(200).json(data);
  }

  // -----------------------------
  // ACTION: waiverClaim
  // -----------------------------
  if (action === "waiverClaim") {
    if (!playerId) return res.status(400).json({ error: "Missing playerId" });

    const params = new URLSearchParams({
      TYPE: "waiver",
      L: leagueId,
      FRANCHISE_ID: franchiseId,
      ADD: playerId,
      JSON: 1,
    });

    const url = `https://www44.myfantasyleague.com/${year}/import?${params.toString()}`;
    const data = await callMFL(url);

    return res.status(200).json(data);
  }

  // -----------------------------
  // Unknown action
  // -----------------------------
  return res.status(400).json({ error: "Unknown action" });
}
