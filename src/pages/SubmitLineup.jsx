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
      // 1. League rules (THIS IS THE FIX)
      const leagueData = await getLeague(leagueId, year);
      const positions = leagueData?.league?.starters?.position || [];

      // Convert grouped positions into arrays of eligible positions
      const starterList = positions.map(p => {
        const name = p.name;
        const limit = p.limit;

        // Split grouped positions: "DT+DE" → ["DT", "DE"]
        const eligible = name.includes("+")
          ? name.split("+")
          : [name];

        return {
          slotName: name,
          eligible,
          limit
        };
      });

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

      // 4. Weekly lineup
      const weeklyRaw = await fetch(
        `/api/weekly?leagueId=${leagueId}&franchise=${myFranchiseId}&year=${year}&week=1`
      ).then(r => r.text());

      let weekly = null;
      try {
        weekly = JSON.parse(weeklyRaw);
      } catch {
        console.error("Weekly returned non‑JSON:", weeklyRaw);
      }

      const weeklyPlayers = weekly?.weeklyResults?.matchup?.[0]?.franchise?.[0]?.player || [];

      const initialLineup = {};
      weeklyPlayers.forEach(lp => {
        initialLineup[lp.id] = lp.id; // store by player ID
      });

      setLineup(initialLineup);
    } catch (err) {
      console.error("LINEUP LOAD ERROR:", err);
    }

    setLoading(false);
  }

  function setStarter(slotName, playerId) {
    setLineup(prev => ({ ...prev, [slotName]: playerId }));
  }

  async function submitLineup() {
    const params = new URLSearchParams({
      TYPE: "submitLineup",
      L: leagueId,
      FRANCHISE: myFranchiseId,
      JSON: 1
    });

    Object.entries(lineup).forEach(([slotName, id]) => {
      params.append(slotName, id);
    });

    const res = await fetch(`/api/submitLineup?${params.toString()}`);
    const json = await res.json();

    alert("Lineup submitted!");
  }

  if (loading) return <p>Loading lineup...</p>;

  return (
    <div className="submit-container">
      <h1 className="submit-title">Submit Lineup</h1>

      {starterSlots.map(slot => (
        <div key={slot.slotName} className="submit-row">
          <div className="submit-pos">
            {slot.slotName} ({slot.limit})
          </div>

          <select
            className="submit-select"
            value={lineup[slot.slotName] || ""}
            onChange={(e) => setStarter(slot.slotName, e.target.value)}
          >
            <option value="">-- Select Starter --</option>

            {players
              .filter(p => slot.eligible.includes(p.position))
              .map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.position} - {p.team})
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
