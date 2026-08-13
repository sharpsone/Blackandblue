import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../pages/team.css";

const GRID_COLS = "56px 1fr 60px 68px";

// ⭐ ONLY valid MFL POS groups
const POSITIONS = [
  "QB", "RB", "WR", "TE", "PK",
  "DL", "LB", "DB",
  "DT", "DE", "CB", "S"
];

export default function Team({ leagueInfo }) {
  const leagueId      = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year          = leagueInfo?.year || 2026;

  const [players,        setPlayers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDataState, setPlayerDataState] = useState(null);

  // ⭐ rank map from MFL playerRanks
  const [rankMap, setRankMap] = useState({});

  function formatNewsTime(unix) {
    if (!unix) return null;
    const d = new Date(unix * 1000);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  // Load ALL PLAYERS
  useEffect(() => {
    async function loadPlayers() {
      try {
        const data = await getPlayers(year);
        console.log("📌 PLAYERS LOADED:", data?.players?.length);
        setPlayerDataState(data);
      } catch (err) {
        console.error("❌ getPlayers failed:", err);
        setPlayerDataState({ players: [] });
      }
    }
    loadPlayers();
  }, [year]);

  // ⭐ Load MFL playerRanks for ALL POS groups (Promise.all + ID normalization + LOGGING)
  useEffect(() => {
    async function loadRanks() {
      try {
        console.log("📌 LOADING RANKS for POSITIONS:", POSITIONS);

        const results = await Promise.all(
          POSITIONS.map(pos =>
            fetch(`/api/mfl?action=playerRanks&POS=${pos}&leagueId=${leagueId}&year=${year}`)
              .then(r => r.json())
          )
        );

        const map = {};

        results.forEach((data, i) => {
          const pos = POSITIONS[i];
          const list = data?.player_ranks?.player || [];

          console.log(`📌 POS ${pos} → ${list.length} players`);

          list.forEach(r => {
            console.log("📌 RANK ENTRY:", {
              pos,
              id: r.id,
              rank: r.rank
            });

            map[String(r.id)] = {
              rank: Number(r.rank) || null,
              pos,
              posRank: null
            };
          });
        });

        console.log("📌 FINAL rankMap keys:", Object.keys(map).slice(0, 50));
        console.log("📌 FINAL rankMap sample:", map[Object.keys(map)[0]]);

        setRankMap(map);
      } catch (err) {
        console.error("❌ playerRanks failed:", err);
        setRankMap({});
      }
    }

    if (leagueId && year) loadRanks();
  }, [leagueId, year]);

  // Load roster AFTER players + ranks are loaded
  useEffect(() => {
    if (!myFranchiseId) return;
    if (!playerDataState) return;
    if (!rankMap) return;

    console.log("📌 TRIGGER loadRoster()");
    loadRoster();
  }, [myFranchiseId, playerDataState, rankMap]);

  // Load roster + merge everything (LOGGING ADDED)
  async function loadRoster() {
    try {
      console.log("📌 LOADING ROSTER…");

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
          .catch(() => ({ nflSchedule: { matchup: [] } })),

        fetch(`/api/mfl?action=projectedScores&leagueId=${leagueId}&year=${year}`)
          .then(r => r.text())
          .then(t => {
            try { return JSON.parse(t); }
            catch { return { projectedScores: { playerScore: [] } }; }
          })
          .catch(() => ({ projectedScores: { playerScore: [] } })),

        fetch(`/api/mfl?action=injuries&year=${year}`)
          .then(r => r.json())
          .catch(() => ({ injuries: { injury: [] } }))
      ]);

      if (!rosterData || !rosterData.roster) {
        console.log("❌ No roster data found");
        setPlayers([]);
        return;
      }

      console.log("📌 ROSTER COUNT:", rosterData.roster.players.length);

      // ⭐ FIX — load allPlayers FIRST
      const allPlayers = playerDataState?.players || [];

      // 1. Build rosterPlayers with real names
      const rosterPlayers = rosterData.roster.players.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id) || {};

        return {
          id: rp.id,
          name: full.name || rp.name || null,   // KEEP FantasyPros format "Last, First"
          status: rp.status
        };
      });


      // 2. Bulk payload (must include id, name, status)
      const playersPayload = rosterPlayers.map(rp => ({
        id: rp.id,
        name: rp.name,   // now "Last, First"
        status: rp.status
      }));


      // 3. ONE bulk request — NOT inside a loop
      const newsData = await fetch(
        `/api/mfl?action=fantasyProsNewsBulk&players=${encodeURIComponent(JSON.stringify(playersPayload))}`
      )
        .then(r => r.json())
        .catch(() => ({ news: [] }));

      const newsList = newsData.news || [];

      const injuriesList = injuriesData?.injuries?.injury || [];
      const matchupMap = buildMatchupMap(schedData);
      const projMap = buildProjMap(projData);

        function makeSlug(name) {
          if (!name) return null;

          // FantasyPros format: "Last, First"
          if (name.includes(",")) {
            const [lastRaw, firstRaw] = name.split(",");
            const first = firstRaw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const last  = lastRaw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `${first}-${last}`;
          }

          // Fallback
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
        const name = full.name; // ALWAYS FantasyPros format
        const slug = makeSlug(name);

        const news = newsList
          .filter(n => n.slug === slug)
          .map(n => ({
            ...n,
            formattedTime: formatNewsTime(n.timestamp)
          }));

        return {
          ...rp,
          ...full,
          name,
          slug,
          pos: full.position || rp.position || "",
          projected: projMap[String(rp.id)] ?? null,
          avg: full.avg ?? rp.avg ?? null,
          rank: rankMap[String(rp.id)]?.rank ?? null,
          posRank: rankMap[String(rp.id)]?.posRank ?? null,
          matchup: matchupMap[full.team] || null,
          headshot: `/api/headshot?id=${rp.id}`,
          healthStatus: injuriesList.find(x => x.id === rp.id)?.status || null,
          externalNews: news
        };
      });
      console.log("📌 MERGED PLAYER SAMPLE:", merged[0]);

      setPlayers(merged);
    } catch (err) {
      console.error("TEAM LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

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

  function buildProjMap(projData) {
    const map = {};
    const scores = projData?.projectedScores?.playerScore;
    if (!Array.isArray(scores)) return map;
    scores.forEach(s => {
      if (s.id) map[String(s.id)] = parseFloat(s.score) || null;
    });
    return map;
  }

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
        externalNews: player.externalNews.length > 0
          ? player.externalNews
          : (newsRes.news || []),
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

    // ─── Position groups ────────────────────────────────────────────────
    const offensePositions = ["QB", "RB", "WR", "TE", "PK"];
    const defensePositions = ["DL", "LB", "DB", "DT", "DE", "CB", "S"];

    // ─── Group players by position only ─────────────────────────────────
    const offense = players.filter(p => offensePositions.includes(p.pos));
    const defense = players.filter(p => defensePositions.includes(p.pos));

    // ─── IR stays separate ──────────────────────────────────────────────
    const ir = players.filter(p => p.status === "IR");

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

                  {/* INJURY PILL */}
                  {p.healthStatus && p.healthStatus !== "Healthy" && (
                    <span className="badge injury-badge">
                      <span className={`injury-pill ${
                        p.healthStatus === "Out" ? "O" :
                        p.healthStatus === "Doubtful" ? "D" :
                        p.healthStatus === "Questionable" ? "Q" : ""
                      }`}>
                        {p.healthStatus === "Out" && "O"}
                        {p.healthStatus === "Doubtful" && "D"}
                        {p.healthStatus === "Questionable" && "Q"}
                      </span>
                    </span>
                  )}

                  {/* NEWS BADGE */}
                  {p.externalNews && p.externalNews.length > 0 && (
                    <span className="badge news-badge-wrapper">
                      <span
                        className={`news-badge ${
                          Date.now() / 1000 - p.externalNews[0].timestamp < 10 * 7 * 24 * 3600
                            ? "news-recent"
                            : "news-old"
                        }`}
                      >
                        📰
                      </span>
                    </span>
                  )}

                </span>
              )}
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
        <div className="team-rank">
          {isEmpty ? "" : (p.rank ? `#${p.rank}` : "NR")}
        </div>

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
        {offense.map(renderPlayer)}
      </div>

      <div className="team-section">
        <div className="section-label defense-label">Defense</div>
        {defense.map(renderPlayer)}
      </div>

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
