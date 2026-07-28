import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import "../pages/submitlineup.css"; // ESPN-style CSS

export default function SubmitLineup({ leagueId, myFranchiseId, year }) {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [myFranchiseId]);

  async function loadData() {
    if (!myFranchiseId) return;

    try {
      // Load roster
      const rosterData = await getRoster(leagueId, myFranchiseId, year);
      const rosterPlayers = rosterData?.roster?.players || [];

      // Load player database
      const playerData = await getPlayers(year);
      const allPlayers = playerData?.players || [];

      const merged = rosterPlayers.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id);
        return { ...rp, ...full };
      });

      // Load weekly lineup (starter/bench/IR)
      const weekly = await fetch(
        `/api/weekly?leagueId=${leagueId}&franchise=${myFranchiseId}&year=${year}&week=1`
      ).then(r => r.json());

      const weeklyPlayers = weekly?.weeklyResults?.franchise?.player || [];

      const initialLineup = {};
      weeklyPlayers.forEach(lp => {
        initialLineup[lp.position] = lp.id;
      });

      setLineup(initialLineup);
      setPlayers(merged);
    } catch (err) {
      console.error("LINEUP LOAD ERROR:", err);
    }

    setLoading(false);
  }

  function setStarter(position, playerId) {
    setLineup(prev => ({ ...prev, [position]: playerId }));
  }

  async function submitLineup() {
    const params = new URLSearchParams({
      TYPE: "submitLineup",
      L: leagueId,
      FRANCHISE: myFranchiseId,
      JSON: 1
    });

    Object.entries(lineup).forEach(([pos, id]) => {
      params.append(pos, id);
    });

    const res = await fetch(`/api/submitLineup?${params.toString()}`);
    const json = await res.json();

    alert("Lineup submitted!");
  }

  if (loading) return <p>Loading lineup...</p>;

  const positions = ["QB", "RB", "WR", "TE", "PK", "LB", "DL", "CB"];

  return (
    <div className="submit-container">
      <h1 className="submit-title">Submit Lineup</h1>

      {positions.map(pos => (
        <div key={pos} className="submit-row">
          <div className="submit-pos">{pos}</div>

          <select
            className="submit-select"
            value={lineup[pos] || ""}
            onChange={(e) => setStarter(pos, e.target.value)}
          >
            <option value="">-- Select Starter --</option>

            {players
              .filter(p => p.position === pos)
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.team})
                </option>
              ))}
          </select>
        </div>
      ))}

      <button className="submit-button" onClick={submitLineup}>
        Submit Lineup
      </button>
    </div>
  );
}
