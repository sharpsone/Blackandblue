import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../pages/team.css";

const GRID_COLS = "56px 1fr 60px 68px";

export default function Team({ leagueInfo }) {
  const leagueId      = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year          = leagueInfo?.year || 2026;

  const [players,        setPlayers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDataState, setPlayerDataState] = useState(null);

  // ───────────────────────────────────────────────────────────────
  // Load ALL PLAYERS (global MFL list)
  // ───────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────
  // Refresh roster when Team.jsx mounts OR leagueInfo changes
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myFranchiseId) return;
    if (!playerDataState) return;
    loadRoster();
  }, [myFranchiseId, playerDataState, leagueInfo]);

  // ───────────────────────────────────────────────────────────────
  // Load roster (RESTORED OLD MERGE LOGIC)
  // ───────────────────────────────────────────────────────────────
  async function loadRoster() {
    try {
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
            try { return JSON.parse(t); }
            catch { return { projectedScores: { playerScore: [] } }; }
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

      // Validate roster shape
      if (!rosterData || !rosterData.roster || !Array.isArray(rosterData.roster.players)) {
        console.log("❌ rosterData.roster.players missing:", rosterData);
        setPlayers([]);
        return;
      }

      const allPlayers = playerDataState?.players || [];

      // ───────────────────────────────────────────────────────────────
      // STEP 1 — Build rosterPlayers (old logic)
      // ───────────────────────────────────────────────────────────────
      const rosterPlayers = rosterData.roster.players.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id) || {};

        return {
          id: rp.id,
          status: rp.status,
          name: full.name || null,
          pos: full.position || null,
          team: full.team || null,
          avg: full.avg || null
        };
      });

      // ───────────────────────────────────────────────────────────────
      // STEP 2 — Build maps (old logic)
      // ───────────────────────────────────────────────────────────────
      const injuriesList = injuriesData?.injuries?.injury || [];
      const matchupMap = buildMatchupMap(schedData);
      const projMap = buildProjMap(projData);

      // Build news map (old logic)
      const newsMap = {};
      const newsList = await fetch(
        `/api/mfl?action=fantasyProsNewsBulk&players=${encodeURIComponent(JSON.stringify(rosterPlayers))}`
      )
        .then(r => r.json())
        .then(d => d.news || [])
        .catch(() => []);

      newsList.forEach(n => {
        if (!newsMap[n.id]) newsMap[n.id] = [];
        newsMap[n.id].push(n);
      });

      // ───────────────────────────────────────────────────────────────
      // STEP 3 — Merge everything (old logic)
      // ───────────────────────────────────────────────────────────────
      const merged = rosterPlayers.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id) || {};
        const slug = makeSlug(rp.name);

        return {
          ...rp,
          ...full,
          name: rp.name || full.name || null,
          pos: full.position || rp.pos || "",
          projected: projMap[String(rp.id)] ?? null,
          avg: full.avg ?? rp.avg ?? null,
          matchup: matchupMap[full.team] || null,
          posRank: full._posRank ?? null,
          headshot: `/api/headshot?id=${rp.id}`,
          slug,
          healthStatus: injuriesList.find(x => x.id === rp.id)?.status || null,
          externalNews: newsMap[rp.id] || []
        };
      });

      setPlayers(merged);
    } catch (err) {
      console.error("TEAM LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Helper functions ───────────────────────────────────────────
  function buildMatchupMap(schedData) { /* unchanged */ }
  function buildProjMap(projData) { /* unchanged */ }

  // ⭐ RESTORED OLD SLUG FUNCTION — REQUIRED BY MERGE LOGIC
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

  // ⭐ SECTION 2 — RENDER LOGIC (INSIDE COMPONENT)

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

  const offenseSlots = ["QB", "RB", "RB", "WR", "WR", "TE", "W/R/T", "PK"];
  const defenseSlots = ["DT/DL", "DT/DL", "LB", "LB", "DB/S", "DB/S"];

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

  function renderPlayer(p, idx) {
    const isEmpty = p.empty;
    return (
      <div
        key={p.id || `empty-${p.slot}-${idx}`}
        className={`team-row${isEmpty ? " team-row--empty" : ""}`}
        style={{ gridTemplateColumns: GRID_COLS }}
        onClick={() => !isEmpty && openPlayer(p)}
      >
        <div className="team-slot">{p.slot}</div>

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
                  {p.healthStatus !== "Healthy" && (
                    <span className={`health-badge health-${p.healthStatus}`}>
                      {p.healthStatus === "Questionable" && "Q"}
                      {p.healthStatus === "Doubtful" && "D"}
                      {p.healthStatus === "Out" && "O"}
                    </span>
                  )}

                  {p.externalNews && p.externalNews.length > 0 && (
                    <span
                      className={`news-badge ${
                        Date.now() / 1000 - p.externalNews[0].date < 7 * 24 * 3600
                          ? "news-recent"
                          : "news-old"
                      }`}
                    >
                      📰
                    </span>
                  )}
                </span>
              )}
            </div>

            {!isEmpty && (
              <div className="team-meta">
                <span className="meta-team">{p.team}</span>
                <span className="meta-pos">{p.pos}</span>

                {p.matchup && (
                  <span className="meta-matchup">
                    {p.matchup.home ? "v" : "@"} {p.matchup.opponent} · {p.matchup.kickoff}
                  </span>
                )}

                {p.byeWeek && <span className="meta-bye">Bye {p.byeWeek}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="team-rank">{isEmpty ? "" : `#${p.posRank}`}</div>

        <div className="team-proj">
          {isEmpty ? "" : (p.projected ?? p.avg ?? "–")}
        </div>
      </div>
    );
  }

  return (
    <div className="team-container">
      <h1 className="team-title">My Team</h1>

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
