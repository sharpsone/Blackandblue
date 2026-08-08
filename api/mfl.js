// /api/mfl.js
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { action } = req.query;
    
    const apiKey = process.env.MFL_API_KEY;   // ⭐ REQUIRED HERE

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
    // STATIC LOADERS
    // -----------------------------
    const loadByeWeeks = () => {
      const filePath = path.join(process.cwd(), "public/data/nflByeWeeks.json");
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    };

    const loadSchedule = (week = 1) => {
      const filePath = path.join(
        process.cwd(),
        `public/data/nflScheduleWeek${week}.json`
      );
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    };

    // -----------------------------
    // ACTION: freeAgents
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

          const getHealthColor = (status) => {
            if (!status) return "green";

            const s = status.toLowerCase();

            if (s.includes("out") || s.includes("doubt")) return "red";
            if (s.includes("question")) return "yellow";

            return "green"; // healthy or not listed
          };


          return {
            id: fa.id,
            name: p?.name || "Unknown",
            position: p?.position || "UNK",
            pos: p?.position || "UNK",
            team: p?.team || "",

            // ⭐ FREE AGENT LOCK STATUS
            faStatus: fa.status || "locked",

            // ⭐ REAL HEALTH STATUS FROM PLAYERS API
            healthStatus: p?.status || "Unknown",

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
    // ACTION: playerNewsFeed
    // -----------------------------
    if (action === "playerNewsFeed") {
      const { name } = req.query;

      if (!name) {
        return res.status(400).json({ error: "Missing player name" });
      }

      const normalizedName = name.toLowerCase();
      const nowSec = Math.floor(Date.now() / 1000);
      const fourWeeksSec = 28 * 24 * 60 * 60;

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

      let fpItems = [];

      try {
        const [lastRaw, firstRaw] = name.split(",");
        const first = (firstRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const last = (lastRaw || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const slug = `${first}-${last}`;

        const fpUrl = `https://www.fantasypros.com/nfl/news/${slug}.php`;
        const fpResp = await fetch(fpUrl);
        const fpHtml = await fpResp.text();

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

            fpItems = fpItems.filter(item => {
              if (!item.timestamp) return true;

              const match = item.timestamp.match(/(\d+)\s+weeks?/i);
              if (!match) return true;

              const weeks = parseInt(match[1], 10);
              return weeks <= 10;
            });
          }
        }

      } catch (err) {
        console.log("FantasyPros news failed:", err.message);
      }

      const merged = [...fpItems];
      if (sleeperItem) merged.push(sleeperItem);

      return res.status(200).json({
        player: name,
        news: merged
      });
    }

 // -----------------------------
// ⭐ CORRECTED ACTION: playerModal
// -----------------------------
if (action === "playerModal") {
  console.log("PLAYERMODAL HIT");

  const { playerId, team } = req.query;

  if (!playerId) {
    return res.status(400).json({ error: "Missing playerId" });
  }

  const playerTeam = team || "";

  // Load static data
  const byeWeeks = loadByeWeeks();
  const schedule = loadSchedule(1);

  const byeWeekEntry = byeWeeks.nflByeWeeks.team.find(t => t.id === playerTeam);
  const byeWeek = byeWeekEntry ? byeWeekEntry.bye_week : null;

  const weekMatchups = schedule.nflSchedule.matchup || [];

  let matchup = weekMatchups.find(
    m => m.team[0].id === playerTeam || m.team[1].id === playerTeam
  );

  // TopOwns
  const topOwns = await callMFL(
    `https://api.myfantasyleague.com/${year}/export?TYPE=topOwns&COUNT=1000&JSON=1`
  );

  const ownedEntry = topOwns?.topOwns?.player?.find(p => p.id === playerId);
  const rosteredPercent = ownedEntry?.percent ? Number(ownedEntry.percent) : null;

  // Kickoff time
  let kickoffPacific = null;
  if (matchup?.kickoff && !isNaN(matchup.kickoff)) {
    const unix = Number(matchup.kickoff);
    kickoffPacific = new Date(unix * 1000).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  // Injuries
  const injuriesData = await callMFL(
    `https://api.myfantasyleague.com/${year}/export?TYPE=injuries&W=&JSON=1`
  );

  const injuryEntry = injuriesData?.injuries?.injury?.find(
    inj => inj.id === playerId
  );

  const healthStatus = injuryEntry?.status || "Healthy";
  const injuryDetail = injuryEntry?.injury || null;
  const injuryNotes = injuryEntry?.details || null;

  const matchupData = matchup
    ? {
        opponent:
          matchup.team[0].id === playerTeam
            ? matchup.team[1].id
            : matchup.team[0].id,
        kickoff: kickoffPacific,
        home: matchup.team[0].id === playerTeam,
        spread: matchup.team[0].spread || matchup.team[1].spread || null,
        status: matchup.status || null
      }
    : null;

  // Player scores
  const playerScores = await callMFL(
    `https://www44.myfantasyleague.com/${year}/export?TYPE=playerScores&L=${leagueId}&PLAYERS=${playerId}&W=AVG&JSON=1`
  );

  // Projected scores
  const projectedScores = await callMFL(
    `https://www44.myfantasyleague.com/${year}/export?TYPE=projectedScores&L=${leagueId}&APIKEY=${apiKey}&PLAYERS=${playerId}&JSON=1`
  );

  const ps = projectedScores?.projectedScores?.playerScore;
  let projectedScore = null;

  if (ps && typeof ps === "object" && !Array.isArray(ps)) {
    projectedScore = ps.score || null;
  } else if (Array.isArray(ps)) {
    const entry = ps.find(p => p.id === playerId);
    projectedScore = entry?.score || null;
  }

    // -----------------------------
    // ⭐ BigBalls NFL Stats
    // -----------------------------
    console.log("BBS STATS FETCH START");

    const bbsUrl = `https://api.bigballsdata.com/v1/nfl/players/${playerId}/stats?season=${year}`;

    const bbsResp = await fetch(bbsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BBS_API_KEY}`
      }
    });

    const bbsJson = await bbsResp.json();

    console.log("BBS RAW RESPONSE:", bbsJson);

    let stats = null;

    if (bbsJson?.data) {
      const d = bbsJson.data;

      stats = {
        season: d.season,
        passing: d.passing || {},
        rushing: d.rushing || {},
        receiving: d.receiving || {}
      };

      console.log("BACKEND STATS OBJECT:", stats);
    } else {
      console.log("NO BBS STATS FOUND");
    }

  return res.status(200).json({
    id: playerId,
    team: playerTeam,
    byeWeek,
    matchup: matchupData,
    scores: {
      avg: playerScores?.playerScores?.playerScore?.score || null
    },
    projections: {
      current: projectedScore
    },
    healthStatus,
    injuryDetail,
    injuryNotes,
    rosteredPercent,
    stats
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
