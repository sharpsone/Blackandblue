import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../pages/team.css";

export default function Team({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year = leagueInfo?.year || 2026;

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (!myFranchiseId) return;
    loadRoster();
  }, [myFranchiseId]);

  async function loadRoster() {
    try {
      const rosterData = await getRoster(leagueId, myFranchiseId, year);
      const rosterPlayers = rosterData?.roster?.players || [];

      const playerData = await getPlayers(year);
      const allPlayers = playerData?.players || [];

      const merged = rosterPlayers.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id);

        return {
          ...rp,
          ...full,
          pos: full?.position || rp?.position,
          headshot: `/api/headshot?id=${rp.id}`,
        };
      });

      // Compute position rank
      const grouped = {};
      merged.forEach(p => {
        if (!grouped[p.pos]) grouped[p.pos] = [];
        grouped[p.pos].push(p);
      });

      Object.values(grouped).forEach(group => {
        group.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
        group.forEach((p, i) => {
          p.posRank = i + 1;
        });
      });

      setPlayers(merged);
    } catch (err) {
      console.error("TEAM LOAD ERROR:", err);
    }

    setLoading(false);
  }

  const openPlayer = async (player) => {
    setSelectedPlayer({ loading: true });

    try {
      const modalRes = await fetch(
        `/api/mfl?action=playerModal&playerId=${player.id}&team=${player.team}&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`
      );
      const modalData = await modalRes.json();

      const statsRes = await fetch(
        `/api/mfl?action=playerStats&playerId=${player.id}&leagueId=${leagueId}&year=${year}`
      );
      const stats = await statsRes.json();

      const newsRes = await fetch(
        `/api/mfl?action=playerNewsFeed&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`
      );
      const newsData = await newsRes.json();

      const merged = {
        ...player,
        ...stats,
        externalNews: newsData.news || [],
        byeWeek: modalData.byeWeek || null,
        matchup: modalData.matchup || null,
        avg: modalData.scores?.avg || player.avg || 0,
        projected: modalData.projections?.current || null,
        healthStatus: modalData.healthStatus,
        injuryDetail: modalData.injuryDetail,
        injuryNotes: modalData.injuryNotes,
        rosteredPercent: modalData.rosteredPercent,
        espnStats: modalData.espnStats,
        loading: false,
      };

      setSelectedPlayer(merged);

    } catch (err) {
      console.error("[Team openPlayer] Failed:", err);

      setSelectedPlayer({
        ...player,
        stats: [],
        externalNews: [],
        loading: false,
      });
    }
  };

  if (loading) return <p>Loading team...</p>;
  if (!players.length) return <p>No roster data found.</p>;

  // --- SLOT DEFINITIONS (Yahoo style + your league rules) ---
  const offenseSlots = ["QB", "RB", "RB", "WR", "WR", "TE", "W/R/T", "PK"];
  const defenseSlots = ["DT/DL", "DT/DL", "LB", "LB", "DB/S", "DB/S"];

  // --- CONSUME-AS-YOU-ASSIGN LOGIC ---
  function assignSlots(slots, candidates) {
    const used = new Set();
    return slots.map(slot => {
      const match = candidates.find(p => {
        if (used.has(p.id)) return false;

        if (slot === "DT/DL") return ["DT", "DL", "DE"].includes(p.pos);
        if (slot === "DB/S") return ["CB", "DB", "S"].includes(p.pos);
        if (slot === "W/R/T") return ["WR", "RB", "TE"].includes(p.pos);

        return p.pos === slot;
      });

      if (match) {
        used.add(match.id);
        return { ...match, slot };
      }

      return { empty: true, slot };
    });
  }

  const startersOffense = assignSlots(offenseSlots, players);
  const startersDefense = assignSlots(defenseSlots, players);

  const bench = players.filter(p =>
    ["R", "RES", "TAXI", "BENCH"].includes(p.status)
  );

  const ir = players.filter(p => p.status === "IR");

  function renderPlayer(p) {
    const isEmpty = p.empty;

    return (
      <div className="team-row" onClick={() => !isEmpty && openPlayer(p)}>
        
        {/* Column 1 — POS */}
        <div className="team-slot">{p.slot}</div>

        {/* Column 2 — Player */}
        <div className="team-player">
          <img
            src={isEmpty ? "/silhouettes/player.png" : p.headshot}
            className="team-photo"
            alt={p.name}
            onError={(e) => (e.target.src = "/silhouettes/player.png")}
          />

          <div className="team-info">
            <div className="team-name">{isEmpty ? "Empty" : p.name}</div>

            {!isEmpty && (
              <div className="team-meta">
                <span className="meta-team">{p.team}</span>
                <span className="meta-pos">{p.pos}</span>
                {p.byeWeek && <span className="meta-bye">Bye {p.byeWeek}</span>}
                {p.healthStatus && (
                  <span className={`meta-status status-${p.healthStatus}`}>
                    {p.healthStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 3 — Rank */}
        <div className="team-rank">{isEmpty ? "" : `#${p.posRank}`}</div>

        {/* Column 4 — Projected Points */}
        <div className="team-proj">
          {isEmpty ? "" : (p.projected ?? p.avg ?? "--")}
        </div>

      </div>
    );
  }

  return (
    <div className="team-container">
      <h1 className="team-title">My Team</h1>
      <div className="team-header">
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

      <div className="team-section">
        <div className="section-label bench-label">Bench</div>
        {bench.map(renderPlayer)}
      </div>

      <div className="team-section">
        <div className="section-label ir-label">Injured Reserve</div>
        {ir.map(renderPlayer)}
      </div>

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
