import { useEffect, useState } from "react";
import { getRoster } from "../utils/api";
import "./roster.css";

function Roster({ leagueId, year, myFranchiseId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoster() {
      if (!myFranchiseId) {
        console.log("Roster: myFranchiseId is missing");
        return;
      }

      console.log("Roster: loading for franchise", myFranchiseId);

      try {
        // ⭐ FIX: use getRoster (not fetchRoster)
        const data = await getRoster(leagueId, myFranchiseId, year);

        // MFL returns roster like:
        // { roster: { players: { player: [...] } } }
        const list =
          data?.roster?.players?.player ||
          data?.roster?.players ||
          [];

        console.log("Roster loaded:", list);

        setPlayers(Array.isArray(list) ? list : [list]);
      } catch (err) {
        console.error("ROSTER ERROR:", err);
      }

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
            <div className="player-name">{p.name || "Unknown Player"}</div>

            <div className="player-meta">
              <span className="player-pos">{p.position || "?"}</span>
              <span className="player-team">{p.team || "FA"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Roster;