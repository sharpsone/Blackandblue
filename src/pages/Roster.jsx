import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import "./roster.css";

function Roster({ leagueId, year, myFranchiseId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoster() {
      if (!myFranchiseId) return;

      console.log("Roster: loading for franchise", myFranchiseId);

      try {
        // Step 1 — get roster (IDs only)
        const rosterData = await getRoster(leagueId, myFranchiseId, year);
        const rosterPlayers = rosterData?.roster?.players || [];

        // Step 2 — get full player database
        const playerData = await getPlayers(year);
        const allPlayers = playerData?.players || [];

        // Step 3 — merge by ID
        const merged = rosterPlayers.map(rp => {
          const full = allPlayers.find(p => p.id === rp.id);
          return {
            ...rp,
            ...full
          };
        });

        console.log("Merged roster:", merged);

        setPlayers(merged);
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
