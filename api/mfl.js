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
    // ACTION: freeAgents (with conference separation)
    // -----------------------------
    if (action === "freeAgents") {
      const apiKey = process.env.MFL_API_KEY;

      console.log("FREE AGENTS CALL:", { leagueId, year });

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
            position: p?.position || "UNK",
            pos: p?.position || "UNK",
            team: p?.team || "",
            status: fa.status || "locked",
            rank: Number(r?.rank) || 9999,
            avg: Number(s?.score) || 0,
          };
        });
      }

      return res.status(200).json({ conferences: conferencePools });
    }

    // -----------------------------
    // ACTION: playerNews (NEW)
    // -----------------------------
    if (action === "playerNews") {
      const { playerId } = req.query;

      if (!playerId) {
        return res.status(400).json({ error: "Missing playerId" });
      }

      const url = `https://api.myfantasyleague.com/${year}/export?TYPE=playerNews&P=${playerId}&L=${leagueId}&JSON=1`;
      const data = await callMFL(url);

      const news = data?.news || [];

      return res.status(200).json({ news });
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

    // -----------------------------
    // ACTION: playerStats (FULL STATS)
    // -----------------------------
    if (action === "playerStats") {
      const { playerId } = req.query;

      if (!playerId) {
        return res.status(400).json({ error: "Missing playerId" });
      }

      // --- Weekly stats (weeks 1–18) ---
      const weeklyStats = [];
      for (let w = 1; w <= 18; w++) {
        const weeklyUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerScores&W=${w}&L=${leagueId}&P=${playerId}&JSON=1`;
        const weeklyData = await callMFL(weeklyUrl);
        const score = weeklyData?.playerScores?.playerScore?.[0] || null;

        weeklyStats.push({
          week: w,
          score: score?.score || 0,
          stats: score || null,
        });
      }

      // --- Season-to-date stats ---
      const seasonUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerScores&L=${leagueId}&P=${playerId}&JSON=1`;
      const seasonData = await callMFL(seasonUrl);
      const seasonStats = seasonData?.playerScores?.playerScore?.[0] || null;

      // --- Projections ---
      const projUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=projectedScores&L=${leagueId}&P=${playerId}&JSON=1`;
      const projData = await callMFL(projUrl);
      const projections = projData?.projectedScores?.playerScore?.[0] || null;

      // --- Career profile ---
      const profileUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerProfile&P=${playerId}&JSON=1`;
      const profileData = await callMFL(profileUrl);
      const profile = profileData?.playerProfile || null;

      return res.status(200).json({
        playerId,
        weekly: weeklyStats,
        season: seasonStats,
        projections,
        profile,
      });
    }

// -----------------------------
// ACTION: playerExternalNews (Sleeper + FantasyPros)
// -----------------------------
if (action === "playerExternalNews") {
  const { name, team } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing player name" });
  }

  // --- Build FantasyPros slug from MFL name: "Last, First"
  let fantasyProsNews = null;
  try {
    const [lastRaw, firstRaw] = name.split(",");
    const first = (firstRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const last = (lastRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slug = `${first}-${last}`;
    const fpUrl = `https://www.fantasypros.com/nfl/news/${slug}.php`;

    const fpResp = await fetch(fpUrl);
    const fpHtml = await fpResp.text();

    // Very simple headline scrape: grab first <h2> or <h3> text
    const headlineMatch = fpHtml.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
    const bodyMatch = fpHtml.match(/<p[^>]*>([^<]+)<\/p>/i);

    if (headlineMatch) {
      fantasyProsNews = {
        source: "FantasyPros",
        headline: headlineMatch[1].trim(),
        body: bodyMatch ? bodyMatch[1].trim() : "",
      };
    }
  } catch (e) {
    console.log("FantasyPros scrape failed:", e.message);
  }

  // --- Sleeper news: filter last 4 weeks and match by name
  let sleeperNews = null;
  try {
    const sleeperUrl = "https://api.sleeper.app/v1/news/nfl";
    const sResp = await fetch(sleeperUrl);
    const sJson = await sResp.json();

    const nowSec = Math.floor(Date.now() / 1000);
    const fourWeeksSec = 28 * 24 * 60 * 60;

    const mflNameLower = name.toLowerCase();

    const recent = sJson
      .filter((item) => {
        // created is epoch seconds
        if (!item.created) return false;
        const age = nowSec - item.created;
        if (age > fourWeeksSec) return false;

        const text = `${item.title || ""} ${item.body || ""}`.toLowerCase();
        return text.includes(mflNameLower);
      })
      .sort((a, b) => b.created - a.created);

    if (recent.length > 0) {
      const n = recent[0];
      sleeperNews = {
        source: "Sleeper",
        headline: n.title || "",
        body: n.body || "",
        date: n.created,
      };
    }
  } catch (e) {
    console.log("Sleeper news fetch failed:", e.message);
  }

  return res.status(200).json({
    player: name,
    team: team || null,
    news: [fantasyProsNews, sleeperNews].filter(Boolean),
  });
}

    return res.status(400).json({ error: "Unknown action", action });

  } catch (err) {
    console.error("mfl.js error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
