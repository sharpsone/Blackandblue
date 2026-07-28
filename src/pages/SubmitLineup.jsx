import { useEffect, useState } from "react";
import { getRoster, getPlayers, getLeague } from "../utils/api";
import "../pages/submitlineup.css";

export default function SubmitLineup({ leagueId, myFranchiseId, year }) {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState({});
  const [starterSlots, setStarterSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [leagueId, myFranchiseId, year]);

  async function loadData() {
    if (!leagueId || !myFranchiseId) {
      console.warn("Missing leagueId or franchiseId");
      setLoading(false);
      return;
    }

    try {
      // 1. League rules via backend proxy (/api/league)
      const leagueData = await getLeague(leagueId, year);
      const starters = leagueData?.league?.starters?.starter || [];

      const starterList = starters.map(s => ({
        position: s.position,
        limit: parseInt(s.limit, 10)
      }));
      setStarterSlots(starterList);

      // 2. Roster
      const rosterData = await getRoster(leagueId, myFranchiseId, year);
      const rosterPlayers = rosterData?.roster?.players || [];

      // 3. Player database
      const playerData = await getPlayers(year);
      const allPlayers = playerData?.players || [];

      const merged = rosterPlayers.map(rp => {
        const full = allPlayers.find(p => p.id === rp.id);
        return { ...rp, ...full };
      });
      setPlayers(merged);

      // 4. Weekly lineup via backend proxy (/api/weekly)
      const weeklyRaw = await fetch(
        `/api/weekly?leagueId=${leagueId}&franchise=${myFranchiseId}&year=${year}&week=1`
      ).then(r => r.text());

      let weekly = null;
      try {
        weekly = JSON.parse(weeklyRaw);
      } catch {
        console.error("Weekly returned non‑JSON:", weeklyRaw);
      }

      const weeklyPlayers = weekly?.weeklyResults?.franchise?.player || [];
      const initialLineup = {};
      weeklyPlayers.forEach(lp => {
        initialLineup[lp.position] = lp.id;
      });

      setLineup(initialLineup);
    } catch (err) {
      console.error("LINEUP LOAD ERROR:", err);
    }

    setLoading(false);
  }

  function setStarter(position, playerId) {
    setLineup(prev => ({ ...prev, [position]: playerId }));
  }

  async function submitLineup() {
    if (!leagueId || !myFranchiseId) return;

    const params = new URLSearchParams({
      TYPE: "submitLineup",
      L: leagueId,
      FRANCHISE: myFranchiseId,
      JSON: 1
    });

    Object.entries(lineup).forEach(([pos, id]) => {
      if (id) params.append(pos, id);
    });

    try {
      const res = await fetch(`/api/submitLineup?${params.toString()}`);
      const json = await res.json();
      console.log("SUBMIT RESPONSE:", json);
      alert("Lineup submitted!");
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      alert("Failed to submit lineup.");
    }
  }

  if (loading) return <p>Loading lineup...</p>;

  return (
    <div className="submit-container">
      <h1 className="submit-title">Submit Lineup</h1>

      {starterSlots.map(slot => (
        <div key={slot.position} className="submit-row">
          <div className="submit-pos">
            {slot.position} ({slot.limit})
          </div>

          <select
            className="submit-select"
            value={lineup[slot.position] || ""}
            onChange={(e) => setStarter(slot.position, e.target.value)}
          >
            <option value="">-- Select Starter --</option>

            {players
              .filter(p => p.position === slot.position)
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
