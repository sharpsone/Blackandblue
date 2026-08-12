import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../pages/team.css";

// ─── Shared column template ───────────────────────────────────────────────────
// Applied via inline style= on BOTH .team-header and every .team-row so they
// are guaranteed to always be in sync — one constant, zero drift.
const GRID_COLS = "56px 1fr 60px 68px";

export default function Team({ leagueInfo }) {
  const leagueId      = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year          = leagueInfo?.year || 2026;

  const [players,        setPlayers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  //useEffect(() => {
    //if (!myFranchiseId) return;
    //loadRoster();
  //}, [myFranchiseId, leagueId, year]);

  const [playerDataState, setPlayerDataState] = useState(null);

  // ─── Build { "KC": "vs LAR", "LAR": "@ KC", … } from MFL nflSchedule ──────
  function buildMatchupMap(schedData) {
    const map = {};
    const matchups = schedData?.nflSchedule?.matchup;
    if (!Array.isArray(matchups)) return map;
    matchups.forEach(game => {
      const home = game.homeTeam?.abbrev || game.home || "";
      const away = game.awayTeam?.abbrev || game.away || "";
      if (home && away) {
        map[home] = `vs ${away}`;
        map[away] = `@ ${home}`;
      }
    });
    return map;
  }

  // Build { playerId: projectedScore } from MFL projectedScores response
  function buildProjMap(projData) {
    const map = {};
    const scores = projData?.projectedScores?.playerScore;
    if (!Array.isArray(scores)) return map;
    scores.forEach(s => {
      if (s.id) map[String(s.id)] = parseFloat(s.score) || null;
    });
    return map;
  }

useEffect(() => {
  async function loadPlayers() {
    try {
      const data = await getPlayers(year);
      setPlayerDataState(data);
    } catch (err) {
      console.error("❌ getPlayers failed:", err);
      setPlayerDataState({ players: [] });
    }
  }

  loadPlayers();
}, [year]);

async function loadRoster() {
  try {
    //
    // STEP 1 — SAFE PARALLEL LOAD (NO THROWING)
    //
    const [
      rosterData,
      schedData,
      projData,
      injuriesData
    ] = await Promise.all([
      getRoster(leagueId, myFranchiseId, year).catch(err => {
        console.log("❌ getRoster failed:", err);
        return null;
      }),

      fetch(`/data/nflScheduleWeek1.json`)
        .then(r => r.json())
        .catch(err => {
          console.log("❌ schedule JSON failed:", err);
          return { nflSchedule: { matchup: [] } };
        }),

      fetch(`/api/mfl?action=projectedScores&leagueId=${leagueId}&year=${year}`)
        .then(r => r.text())
        .then(t => {
          try {
            return JSON.parse(t);
          } catch {
            console.log("❌ projectedScores JSON parse failed");
            return { projectedScores: { playerScore: [] } };
          }
        })
        .catch(err => {
          console.log("❌ projectedScores fetch failed:", err);
          return { projectedScores: { playerScore: [] } };
        }),

      fetch(`/api/mfl?action=injuries&year=${year}`)
        .then(r => r.json())
        .catch(err => {
          console.log("❌ injuries JSON failed:", err);
          return { injuries: { injury: [] } };
        })
    ]);

    //
    // STEP 2 — ROSTER MUST EXIST
    //
    if (!rosterData || !rosterData.roster) {
      console.log("❌ No roster data found");
      setRoster([]);
      return;
    }

    //
    // ⭐ USE playerDataState (guaranteed loaded)
    //
    const allPlayers = playerDataState?.players || [];

    //
    // STEP 3 — BUILD rosterPlayers WITH REAL NAMES
    //
    const rosterPlayers = rosterData.roster.players.map(rp => {
      const full = allPlayers.find(p => p.id === rp.id) || {};
      return {
        id: rp.id,
        name: full.name || rp.name || null,   // ⭐ NOW ALWAYS HAS NAME
        status: rp.status
      };
    });

    //
    // STEP 4 — FETCH NEWS USING REAL NAMES
    //
    const newsData = await fetch(
      `/api/mfl?action=fantasyProsNewsBulk&players=${encodeURIComponent(JSON.stringify(rosterPlayers))}`
    )
      .then(r => r.json())
      .catch(err => {
        console.log("❌ fantasyProsNewsBulk failed:", err);
        return { news: [] };
      });

    const newsList = newsData.news || [];

    //
    // STEP 5 — MERGE EVERYTHING (unchanged)
    //
    const injuriesList = injuriesData?.injuries?.injury || [];
    const matchupMap = buildMatchupMap(schedData);
    const projMap = buildProjMap(projData);

    function makeSlug(name) {
      if (!name || typeof name !== "string") return null;
      if (name.includes(",")) {
        const [lastRaw, firstRaw] = name.split(",");
        const first = firstRaw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const last  = lastRaw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `${first}-${last}`;
      }
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        const first = parts[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const last  = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return `${first}-${last}`;
      }
      return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    const merged = rosterPlayers.map(rp => {
      const full = allPlayers.find(p => p.id === rp.id) || {};
      const slug = makeSlug(rp.name);
      const news = newsList.filter(n => n.slug === slug);

      return {
        ...rp,
        ...full,
        name: rp.name,
        pos: full.position || rp.position || "",
        projected: projMap[String(rp.id)] ?? null,
        avg: full.avg ?? rp.avg ?? null,
        matchup: matchupMap[full.team] || null,
        posRank: full._posRank ?? null,
        headshot: `/api/headshot?id=${rp.id}`,
        slug,
        healthStatus: (injuriesList.find(x => x.id === rp.id)?.status) || null,
        externalNews: news
      };
    });

    setPlayers(merged);
  } catch (err) {
    console.error("TEAM LOAD ERROR:", err);
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  if (!myFranchiseId) return;
  if (!playerDataState) return;   // ⭐ WAIT FOR PLAYERS FIRST
  loadRoster();
}, [myFranchiseId, playerDataState]);


  // ─── Player modal ─────────────────────────────────────────────────────────
  const openPlayer = async (player) => {
    setSelectedPlayer({ loading: true });
    try {
      const [modalRes, statsRes, newsRes] = await Promise.all([
        fetch(`/api/mfl?action=playerModal&playerId=${player.id}&team=${player.team}&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`).then(r => r.json()),
        fetch(`/api/mfl?action=playerStats&playerId=${player.id}&leagueId=${leagueId}&year=${year}`).then(r => r.json()),
        fetch(`/api/mfl?action=playerNewsFeed&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`).then(r => r.json()),
      ]);

      setSelectedPlayer({
        ...player,
        ...statsRes,
        externalNews:     newsRes.news               || [],
        byeWeek:          modalRes.byeWeek            || null,
        matchup:          modalRes.matchup            || player.matchup || null,
        avg:              modalRes.scores?.avg        || player.avg     || 0,
        projected:        modalRes.projections?.current ?? player.projected ?? null,
        healthStatus:     modalRes.healthStatus,
        injuryDetail:     modalRes.injuryDetail,
        injuryNotes:      modalRes.injuryNotes,
        rosteredPercent:  modalRes.rosteredPercent,
        espnStats:        modalRes.espnStats,
        loading:          false,
      });
    } catch (err) {
      console.error("[Team openPlayer] Failed:", err);
      setSelectedPlayer({ ...player, stats: [], externalNews: [], loading: false });
    }
  };

  if (loading)         return <p>Loading team...</p>;
  if (!players.length) return <p>No roster data found.</p>;

  // ─── Slot definitions ─────────────────────────────────────────────────────
  const offenseSlots = ["QB", "RB", "RB", "WR", "WR", "TE", "W/R/T", "PK"];
  const defenseSlots = ["DT/DL", "DT/DL", "LB", "LB", "DB/S", "DB/S"];

  // ─── Consume-as-you-assign: fills slots left-to-right, no double-dipping ──
  function assignSlots(slots, candidates) {
    const used = new Set();
    return slots.map(slot => {
      const match = candidates.find(p => {
        if (used.has(p.id)) return false;
        if (slot === "DT/DL") return ["DT", "DL", "DE"].includes(p.pos);
        if (slot === "DB/S")  return ["CB", "DB", "S"].includes(p.pos);
        if (slot === "W/R/T") return ["WR", "RB", "TE"].includes(p.pos);
        return p.pos === slot;
      });
      if (match) { used.add(match.id); return { ...match, slot }; }
      return { empty: true, slot };
    });
  }

  const startersOffense = assignSlots(offenseSlots, players);
  const startersDefense = assignSlots(defenseSlots, players);
  const bench           = players.filter(p => ["R", "RES", "TAXI", "BENCH"].includes(p.status));
  const ir              = players.filter(p => p.status === "IR");

  // ─── Row renderer ─────────────────────────────────────────────────────────
  function renderPlayer(p, idx) {
    const isEmpty = p.empty;
    return (
      <div
        key={p.id || `empty-${p.slot}-${idx}`}
        className={`team-row${isEmpty ? " team-row--empty" : ""}`}
        style={{ gridTemplateColumns: GRID_COLS }}   // ← matches header exactly
        onClick={() => !isEmpty && openPlayer(p)}
      >
        {/* Column 1 — Slot */}
        <div className="team-slot">{p.slot}</div>

        {/* Column 2 — Player */}
        <div className="team-player">
          <img
            src={isEmpty ? "/silhouettes/player.png" : p.headshot}
            className="team-photo"
            alt={isEmpty ? "Empty slot" : p.name}
            onError={e => { e.target.src = "/silhouettes/player.png"; }}
          />
        <div className="team-info">
          <div className="team-name-row">
            <span className="team-name">{isEmpty ? "Empty" : p.name}</span>

            {!isEmpty && (
              <span className="team-badges">
                {/* HEALTH BADGE */}
                {p.healthStatus !== "Healthy" && (
                  <span className={`health-badge health-${p.healthStatus}`}>
                    {p.healthStatus === "Questionable" && "Q"}
                    {p.healthStatus === "Doubtful" && "D"}
                    {p.healthStatus === "Out" && "O"}
                  </span>
                )}

                {/* NEWS BADGE */}
                {p.externalNews && p.externalNews.length > 0 && (
                  (() => {
                    const newest = p.externalNews[0];
                    const ageSeconds = Date.now() / 1000 - newest.date;
                    const isRecent = ageSeconds < 7 * 24 * 3600;   // ⭐ 1 week

                    return (
                      <span className={`news-badge ${isRecent ? "news-recent" : "news-old"}`}>
                        📰
                      </span>
                    );
                  })()
                )}
              </span>
            )}
          </div>
        </div>

            {!isEmpty && (
            <div className="team-meta">
              <span className="meta-team">{p.team}</span>
              <span className="meta-pos">{p.pos}</span>

              {/* Opponent + kickoff */}
              {p.matchup && (
                <span className="meta-matchup">
                  {p.matchup.home ? "v" : "@"} {p.matchup.opponent} · {p.matchup.kickoff}
                </span>
              )}

              {/* Bye week */}
              {p.byeWeek && <span className="meta-bye">Bye {p.byeWeek}</span>}
            </div>
            )}
          </div>
        </div>

        {/* Column 3 — Rank */}
        <div className="team-rank">{isEmpty ? "" : `#${p.posRank}`}</div>

        {/* Column 4 — Projected points */}
        <div className="team-proj">
          {isEmpty ? "" : (p.projected ?? p.avg ?? "–")}
        </div>
      </div>
    );
  }

  return (
    <div className="team-container">
      <h1 className="team-title">My Team</h1>

      {/* Sticky header — same GRID_COLS as every team-row */}
      <div className="team-header" style={{ gridTemplateColumns: GRID_COLS }}>
        <div className="col-pos">POS</div>
        <div className="col-player">Player</div>
        <div className="col-rank">Rank</div>
        <div className="col-proj">Proj</div>
      </div>

      <div className="team-section">
        <div className="section-label offense-label">Offense</div>
        {startersOffense.map(renderPlayer)}
      </div>

      <div className="team-section">
        <div className="section-label defense-label">Defense</div>
        {startersDefense.map(renderPlayer)}
      </div>

      {bench.length > 0 && (
        <div className="team-section">
          <div className="section-label bench-label">Bench</div>
          {bench.map(renderPlayer)}
        </div>
      )}

      {ir.length > 0 && (
        <div className="team-section">
          <div className="section-label ir-label">Injured Reserve</div>
          {ir.map(renderPlayer)}
        </div>
      )}

      <PlayerModal
        player={selectedPlayer}
        fromRoster={true}
        onClose={() => setSelectedPlayer(null)}
        onAdd={() => {}}
        onWaiver={() => {}}
      />
    </div>
  );
}
