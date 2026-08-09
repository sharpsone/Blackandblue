import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../utils/animations.css";
import "../pages/roster.css";

export default function Roster({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year = leagueInfo?.year || 2026;

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ NEW — modal state
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
          pos: full?.position || rp?.position,   // ⭐ normalize position
        };
      });

      // ⭐ NEW — compute position rank (same logic as FreeAgents)
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
      console.error("ROSTER ERROR:", err);
    }

    setLoading(false);
  }

  // ⭐ NEW — identical modal loader from FreeAgents.jsx
  const openPlayer = async (player) => {
    console.log("[Roster openPlayer] clicked player:", player);

    setSelectedPlayer({ loading: true });

    try {
      // 1. Unified modal data
      const modalRes = await fetch(
        `/api/mfl?action=playerModal&playerId=${player.id}&team=${player.team}&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`
      );
      const modalData = await modalRes.json();

      // 2. ESPN stats
      const statsRes = await fetch(
        `/api/mfl?action=playerStats&playerId=${player.id}&leagueId=${leagueId}&year=${year}`
      );
      const stats = await statsRes.json();

      // 3. External news
      const newsRes = await fetch(
        `/api/mfl?action=playerNewsFeed&name=${encodeURIComponent(player.name)}&leagueId=${leagueId}&year=${year}`
      );
      const newsData = await newsRes.json();

      // 4. Merge everything
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
      console.error("[Roster openPlayer] Failed:", err);

      setSelectedPlayer({
        ...player,
        stats: [],
        externalNews: [],
        loading: false,
      });
    }
  };

  // ⭐ NEW — click handler added
  function renderPlayer(p) {
    return (
      <div className="player-card" onClick={() => openPlayer(p)}>
        <img
          src={`/api/headshot?id=${p.id}`}
          className="player-photo"
          alt={p.name}
          onError={(e) => (e.target.src = "/silhouettes/player.png")}
        />

        <div className="player-info">
          <div className="player-name">{p.name}</div>
          <div className="player-meta">
            <span className="player-pos">{p.position}</span>
            <span className="player-team">{p.team}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading roster...</p>;
  if (!players.length) return <p>No roster data found.</p>;

  // Grouping
  const offense = players.filter(p =>
    ["QB", "RB", "WR", "TE", "PK"].includes(p.position)
  );

  const defense = players.filter(p =>
    ["DL", "DE", "DT", "LB", "CB", "S", "DB"].includes(p.position)
  );

  const bench = players.filter(p =>
    ["R", "RES", "TAXI", "BENCH"].includes(p.status)
  );

  const ir = players.filter(p => p.status === "IR");

  return (
    <div className="roster-container">
      <h1 className="roster-title">My Roster</h1>

      <div className="section-title">Offense</div>
      <div className="player-section">{offense.map(renderPlayer)}</div>

      <div className="section-title">Defense</div>
      <div className="player-section">{defense.map(renderPlayer)}</div>

      <div className="section-title">Bench</div>
      <div className="player-section">{bench.map(renderPlayer)}</div>

      <div className="section-title">Injured Reserve</div>
      <div className="player-section">{ir.map(renderPlayer)}</div>

      {/* ⭐ NEW — modal */}
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
