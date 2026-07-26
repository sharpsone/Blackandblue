import { useEffect, useState } from "react";
import { fetchRoster } from "../utils/api";
import "./roster.css";

function Roster({ leagueId, year, myFranchiseId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoster() {
      if (!myFranchiseId) return;

      const data = await fetchRoster(leagueId, myFranchiseId, year);
      const list = data?.roster?.players || [];

      setPlayers(list);
      setLoading(false);
    }

    loadRoster();
  }, [leagueId, year, myFranchiseId]);

  if (loading) return <div style={{ padding: "1rem" }}>Loading roster...</div>;

  if (!players.length)
    return <div style={{ padding: "1rem" }}>No roster data found.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>My Roster</h1>

      <div className="roster-grid">
        {players.map((p, idx) => (
          <div key={idx} className="player-card">
            <div className="player-name">{p.name}</div>
            <div className="player-meta">
              <span className="player-pos">{p.position}</span>
              <span className="player-team">{p.team}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Roster;
