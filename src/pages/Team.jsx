import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import PlayerModal from "../components/PlayerModal";
import "../utils/animations.css";
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
          logo: `/assets/logos/${full?.team}.png`,
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

  // --- Yahoo-style positional slots ---
  const starterSlotsOffense = ["QB", "RB", "RB", "WR", "WR", "TE", "W/R/T", "PK"];
  const starterSlotsDefense = ["DL", "LB", "DB", "DEF"];

  const startersOffense = starterSlotsOffense.map(slot =>
    players.find(p => p.pos === slot) || { empty: true, pos: slot }
  );

  const startersDefense = starterSlotsDefense.map(slot =>
    players.find(p => p.pos === slot) || { empty: true, pos: slot }
  );

  const bench = players.filter(p =>
    ["R", "RES", "TAXI", "BENCH"].includes(p.status)
  );

  const ir = players.filter(p => p.status === "IR");

  function renderPlayer(p) {
    const isEmpty = p.empty;

    return (
      <div className="team-player-row" onClick={() => !isEmpty && openPlayer(p)}>
        <img
          src={isEmpty ? "/silhouettes/player.png" : p.headshot}
          className="team-player-photo"
          alt={p.name}
          onError={(e) => (e.target.src = "/silhouettes/player.png")}
        />

        <div className="team-player-info">
          <div className="team-player-name">{isEmpty ? "Empty" : p.name}</div>

          <div className="team-player-meta">
            <span className="meta-pos">{p.pos}</span>
            {!isEmpty && (
              <>
                <span className="meta-team">{p.team}</span>
                {p.posRank && <span className="meta-rank">#{p.posRank}</span>}
                {p.byeWeek && <span className="meta-bye">Bye {p.byeWeek}</span>}
                {p.healthStatus && (
                  <span className={`meta-status status-${p.healthStatus}`}>
                    {p.healthStatus}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <img
          src={isEmpty ? "/assets/logos/empty.png" : p.logo}
          className="team-logo"
          alt=""
        />
      </div>
    );
  }

  return (
    <div className="team-container">
      <h1 className="team-title">My Team</h1>

      <div className="team-section">
        <h2>Starters — Offense</h2>
        {startersOffense.map(renderPlayer)}
      </div>

      <div className="team-section">
        <h2>Starters — Defense</h2>
        {startersDefense.map(renderPlayer)}
      </div>

      <div className="team-section">
        <h2>Bench</h2>
        {bench.map(renderPlayer)}
      </div>

      <div className="team-section">
        <h2>Injured Reserve</h2>
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
