// /api/mfl.js
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// ⭐ ADD THIS
function detectMflHost(year) {
  return `www44.myfantasyleague.com`;
}

export default async function handler(req, res) {
  try {
    const { action } = req.query;

    const apiKey = process.env.MFL_API_KEY;
    const leagueId =
      req.query.leagueId ||
      req.cookies?.leagueId ||
      process.env.MFL_LEAGUE_ID;

    const year =
      req.query.year ||
      req.cookies?.year ||
      process.env.MFL_YEAR;

// -----------------------------
// ACTIONS THAT DO NOT REQUIRE leagueId
// -----------------------------

if (action === "injuries") {
  const url = `https://api.myfantasyleague.com/${year}/export?TYPE=injuries&W=&JSON=1`;
  const data = await callMFL(url);
  return res.status(200).json(data);
}

if (action === "playerNewsFeedBulk") {
  const nowSec = Math.floor(Date.now() / 1000);
  const fourWeeksSec = 28 * 24 * 60 * 60;

  let sleeperNews = [];
  try {
    const sleeperResp = await fetch("https://api.sleeper.app/v1/news/nfl");
    const sleeperJson = await sleeperResp.json();

    sleeperNews = sleeperJson
      .filter(n => n.created && (nowSec - n.created) <= fourWeeksSec)
      .map(n => ({
        id: n.player_id || null,
        source: "Sleeper",
        headline: n.title || "",
        body: n.body || "",
        date: n.created
      }));
  } catch (err) {
    console.log("Sleeper bulk news failed:", err.message);
  }

  return res.status(200).json({ news: sleeperNews });
}

// -----------------------------
// ACTIONS fantasy pros news (bulk or single) - do not require leagueId
// -----------------------------
if (action === "fantasyProsNewsBulk") {
  console.log("🔥 fantasyProsNewsBulk HIT");

  try {
    const { players } = req.query;

    if (!players) {
      return res.status(200).json({ news: [] });
    }

    const list = JSON.parse(players); // array of { id, name }

    const items = [];

    for (const p of list) {
      const slug = makeSlug(p.name);
       if (!slug) continue;


      const fpUrl = `https://www.fantasypros.com/nfl/news/${slug}.php`;
      const fpResp = await fetch(fpUrl);
      const fpHtml = await fpResp.text();

      const blocks = fpHtml.match(
        /<div class="subsection feature-stretch[\s\S]*?<div class="foot-row clearfix">[\s\S]*?<\/div>\s*<\/div>/gi
      );

      if (!blocks) continue;

      for (const block of blocks) {
        const headlineMatch = block.match(/<a[^>]*><b>([^<]+)<\/b><\/a>/i);
        const bodyMatch = block.match(/<p>([^<]+)<\/p>/i);

        items.push({
          slug,
          source: "FantasyPros",
          headline: headlineMatch ? headlineMatch[1].trim() : null,
          body: bodyMatch ? bodyMatch[1].trim() : null,
        });
      }
    }

    console.log("✅ FINAL BULK NEWS COUNT:", items.length);
    return res.status(200).json({ news: items });
  } catch (err) {
    console.log("❌ fantasyProsNewsBulk ERROR:", err.message);
    return res.status(200).json({ news: [] });
  }
}


    // -----------------------------
    // NOW VALIDATE leagueId/year
    // -----------------------------
    if (!leagueId || !year) {
      return res.status(400).json({ error: "Missing leagueId or year" });
    }

    // -----------------------------
    // ACTIONS THAT REQUIRE leagueId
    // -----------------------------
    // (league, rosters, projectedScores, freeAgents, etc.)

    async function callMFL(url) {
      console.log("CALLING MFL:", url);
      console.log("🔎 Fetching MFL URL...");

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
    // ⭐ MFL → ESPN ID MAP (Correct Host)
    // -----------------------------
    async function buildMflToEspnMap(year, leagueId, apiKey) {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=players&L=${leagueId}&APIKEY=${apiKey}&DETAILS=1&JSON=1`;

      const resp = await fetch(url);
      const json = await resp.json();

      const players = json?.players?.player || [];
      const map = {};

      for (const p of players) {
        if (p.id && p.espn_id) {
          map[p.id] = p.espn_id;
        }
      }

      return map;
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

    // --- ACTION: schedule ---
    if (action === "schedule") {
      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=schedule&L=${leagueId}&APIKEY=${apiKey}&JSON=1`;

      console.log("📅 SCHEDULE ACTION HIT");
      console.log("📅 URL:", url);

      try {
        const data = await callMFL(url);

        console.log("📅 RAW SCHEDULE RESPONSE:", JSON.stringify(data).slice(0, 500));

        if (!data?.schedule?.weeklySchedule) {
          console.log("❌ weeklySchedule missing in response");
        } else {
          console.log("✅ weeklySchedule found:", data.schedule.weeklySchedule.length, "weeks");
        }

        return res.status(200).json(data);
      } catch (err) {
        console.log("❌ SCHEDULE ERROR:", err.message);
        return res.status(500).json({ error: "Schedule failed", detail: err.message });
      }
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

    // --- ACTION: projectedScores ---
    if (action === "projectedScores") {
      const apiKey = process.env.MFL_API_KEY;

      const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=projectedScores&L=${leagueId}&APIKEY=${apiKey}&W=1&JSON=1`;

      const data = await callMFL(url);
      return res.status(200).json(data);
    }

    // -----------------------------
    // ACTION: transactions
    // -----------------------------
    if (action === "transactions") {
      try {
        const apiKey = process.env.MFL_API_KEY || "";
        const keyParam = apiKey ? `&APIKEY=${apiKey}` : "";

        // ⭐ Use your existing host detection function
        const host = detectMflHost(year);

        const url = `https://${host}/${year}/export?TYPE=transactions&L=${leagueId}${keyParam}&JSON=1`;

        console.log("🔵 Fetching MFL transactions:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("🟢 MFL transactions response:", data);

        return res.status(200).json(data);
      } catch (err) {
        console.error("🔴 TRANSACTIONS ERROR:", err);
        return res.status(500).json({ error: "Failed to load transactions" });
      }
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
  // ⭐ ESPN Stats Fetcher
  // -----------------------------
  async function getEspnStats(espnId) {
    const url = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${espnId}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      console.log("ESPN ERROR:", response.status);
      return null;
    }

    const data = await response.json();
    const summary = data?.athlete?.statsSummary;

    if (!summary) return null;

    const displayName = summary.displayName || "";
    const yearMatch = displayName.match(/\d{4}/);
    const seasonYear = yearMatch ? Number(yearMatch[0]) : null;

    const seasonType = displayName.includes("preseason")
      ? "preseason"
      : displayName.includes("regular")
      ? "regular"
      : displayName.includes("postseason")
      ? "postseason"
      : "unknown";

    const stats = (summary.statistics || []).map(s => ({
      name: s.name,
      label: s.displayName,
      value: s.value,
      displayValue: s.displayValue,
      rank: s.rank,
      rankDisplay: s.rankDisplayValue
    }));

    return { seasonYear, seasonType, stats };
  }


    // -----------------------------
    // ⭐ CLEAN PLAYERMODAL (ESPN + MFL ONLY)
    // -----------------------------
  if (action === "playerModal") {
    console.log("PLAYERMODAL HIT");

    const { playerId, team, name } = req.query;

    if (!playerId || !name) {
      return res.status(400).json({ error: "Missing playerId or name" });
    }

    const playerTeam = team || "";
    const mflName = name;

    console.log("🔍 MFL NAME RECEIVED:", mflName);

    // Normalize name for comparisons
    const normalizedMfl = mflName.toLowerCase().replace(/[^a-z0-9]/g, "");
    console.log("🔍 NORMALIZED MFL NAME:", normalizedMfl);

    // -----------------------------
    // ⭐ Load static schedule + bye week
    // -----------------------------
    const byeWeeks = loadByeWeeks();
    const schedule = loadSchedule(1);

    const byeWeekEntry = byeWeeks.nflByeWeeks.team.find(t => t.id === playerTeam);
    const byeWeek = byeWeekEntry ? byeWeekEntry.bye_week : null;

    const weekMatchups = schedule.nflSchedule.matchup || [];

    let matchup = weekMatchups.find(
      m => m.team[0].id === playerTeam || m.team[1].id === playerTeam
    );

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

    // -----------------------------
    // ⭐ MFL Injuries
    // -----------------------------
    const injuriesData = await callMFL(
      `https://api.myfantasyleague.com/${year}/export?TYPE=injuries&W=&JSON=1`
    );

    const injuryEntry = injuriesData?.injuries?.injury?.find(
      inj => inj.id === playerId
    );

    const healthStatus = injuryEntry?.status || "Healthy";
    const injuryDetail = injuryEntry?.injury || null;
    const injuryNotes = injuryEntry?.details || null;

    // -----------------------------
    // ⭐ MFL Ownership %
    // -----------------------------
    const topOwns = await callMFL(
      `https://api.myfantasyleague.com/${year}/export?TYPE=topOwns&COUNT=1000&JSON=1`
    );

    const ownedEntry = topOwns?.topOwns?.player?.find(p => p.id === playerId);
    const rosteredPercent = ownedEntry?.percent ? Number(ownedEntry.percent) : null;

    // -----------------------------
    // ⭐ MFL Projected Score
    // -----------------------------
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
    // ⭐ ESPN ID Mapping (MFL → ESPN)
    // -----------------------------
    const mflToEspn = await buildMflToEspnMap(year, leagueId, apiKey);
    const espnId = mflToEspn[playerId] || null;

    console.log("🔍 ESPN ID:", espnId);

    // -----------------------------
    // ⭐ ESPN Stats Fetch
    // -----------------------------
    let espnStats = null;

    if (espnId) {
      espnStats = await getEspnStats(espnId);
      console.log("🔍 ESPN STATS:", espnStats);
    } else {
      console.log("⚠️ No ESPN ID found for this player.");
    }

    // -----------------------------
    // ⭐ Return unified modal object
    // -----------------------------
    return res.status(200).json({
      id: playerId,
      team: playerTeam,
      byeWeek,
      matchup: matchupData,
      projections: {
        current: projectedScore
      },
      healthStatus,
      injuryDetail,
      injuryNotes,
      rosteredPercent,
      espnStats
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
