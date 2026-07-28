import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import "../utils/animations.css";

export default function Roster({ leagueId, myFranchiseId, year }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoster();
  }, [myFranchiseId]);

  async function loadRoster() {
    if (!myFranchiseId) return;

    try {
      const rosterData = await getRoster(leagueId, myFranchiseId, year);
      const rosterPlayers = rosterData?.roster?.players || [];

      const playerData = await getPlayers(year);
      const allPlayers = playerData?.players || [];

      const merged = rosterPlayers.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id);
        return { ...rp, ...full };
      });

      setPlayers(merged);
    } catch (err) {
      console.error("ROSTER ERROR:", err);
    }

    setLoading(false);
  }

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

  function renderPlayer(p) {
    return (
      <div className="player-card">
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
    </div>
  );
}
