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

  // 1. Load players
  const playersUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=players&DETAILS=1&JSON=1`;
  const playersData = await callMFL(playersUrl);
  const allPlayers = playersData?.players?.player || [];

  // 2. Load ranks
  const ranksUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=playerRanks&POS=&SOURCE=&JSON=1`;
  const ranksData = await callMFL(ranksUrl);
  const ranksList = ranksData?.player_ranks?.player || [];

  // 3. Load projections
  const projUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=projectedScores&L=${leagueId}&W=1&JSON=1`;
  const projData = await callMFL(projUrl);
  const projList = projData?.projectedScores?.playerScore || [];

  // 4. Load free agents (two conferences)
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

    // -----------------------------
    // ACTION: playerNewsFeed (Sleeper + FantasyPros)
    // -----------------------------
    if (action === "playerNewsFeed") {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({ error: "Missing player name" });
      }

      const normalizedName = name.toLowerCase();
      const nowSec = Math.floor(Date.now() / 1000);
      const fourWeeksSec = 28 * 24 * 60 * 60;

      // -----------------------------
      // Sleeper News
      // -----------------------------
      let sleeperItem = null;
      try {
        const sleeperResp = await fetch("https://api.sleeper.app/v1/news/nfl");
        const sleeperJson = await sleeperResp.json();

        const recent = sleeperJson
          .filter(n => {
            if (!n.created) return false;
            const age = nowSec - n.created;
            if (age > fourWeeksSec) return false;

            const text = `${n.title || ""} ${n.body || ""}`.toLowerCase();
            return text.includes(normalizedName);
          })
          .sort((a, b) => b.created - a.created);

        if (recent.length > 0) {
          const n = recent[0];
          sleeperItem = {
            source: "Sleeper",
            headline: n.title || "",
            body: n.body || "",
            date: n.created
          };
        }
      } catch (err) {
        console.log("Sleeper news failed:", err.message);
      }

     // -----------------------------
      // FantasyPros News (multi-item support)
      // -----------------------------
      let fpItems = [];
      let externalNews = [];

      try {
        const [lastRaw, firstRaw] = name.split(",");
        const first = (firstRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const last = (lastRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const slug = `${first}-${last}`;

        const fpUrl = `https://www.fantasypros.com/nfl/news/${slug}.php`;
        const fpResp = await fetch(fpUrl);
        const fpHtml = await fpResp.text();

        // Match each news block
        const blocks = fpHtml.match(
          /<div class="subsection feature-stretch[\s\S]*?<div class="foot-row clearfix">[\s\S]*?<\/div>\s*<\/div>/gi
        );

        if (blocks) {
          for (const block of blocks) {

            const headlineMatch = block.match(/<a[^>]*><b>([^<]+)<\/b><\/a>/i);
            const bodyMatch = block.match(/<p>([^<]+)<\/p>/i);
            const impactMatch = block.match(/<p><b>Fantasy Impact<\/b><\/p>\s*<p>([^<]+)<\/p>/i);
            const timestampMatch = block.match(/<span[^>]*class="pull-right timestamp"[^>]*>([^<]+)<\/span>/i);

            fpItems.push({
              source: "FantasyPros",
              headline: headlineMatch ? headlineMatch[1].trim() : null,
              body: bodyMatch ? bodyMatch[1].trim() : null,
              fantasyImpact: impactMatch ? impactMatch[1].trim() : null,
              timestamp: timestampMatch ? timestampMatch[1].trim() : null,
            });
          }
        }

      } catch (err) {
        console.log("FantasyPros news failed:", err.message);
      }

      // IMPORTANT: return fpItems instead of fpItem
      externalNews = fpItems;


      // -----------------------------
      // Return merged news
      // -----------------------------
      const merged = [fpItem, sleeperItem].filter(Boolean);

      return res.status(200).json({
        player: name,
        news: merged
      });
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
