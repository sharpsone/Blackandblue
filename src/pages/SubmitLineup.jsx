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
      // 1. League rules
      const leagueData = await getLeague(leagueId, year);
      const positions = leagueData?.league?.starters?.position || [];

      const starterList = [];

      positions.forEach(p => {
        const name = p.name;
        const limit = p.limit;

        // Parse limits: "2-3" → min=2, max=3
        let min = 1;
        let max = 1;

        if (limit.includes("-")) {
          const [lo, hi] = limit.split("-");
          min = parseInt(lo, 10);
          max = parseInt(hi, 10);
        } else {
          min = max = parseInt(limit, 10);
        }

        // Split grouped positions: "DT+DE" → ["DT", "DE"]
        const eligible = name.includes("+")
          ? name.split("+")
          : [name];

        // Create max slots
        for (let i = 1; i <= max; i++) {
          starterList.push({
            slotName: `${name} Slot ${i}`,
            positionGroup: name,
            eligible,
            required: i <= min
          });
        }
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

      const weeklyPlayers =
        weekly?.weeklyResults?.matchup?.[0]?.franchise?.[0]?.player || [];

      // Build a map of positionGroup → slot names
      const slotsByGroup = starterSlots.reduce((acc, slot) => {
        if (!acc[slot.positionGroup]) acc[slot.positionGroup] = [];
        acc[slot.positionGroup].push(slot.slotName);
        return acc;
      }, {});

      const initialLineup = {};

      weeklyPlayers.forEach(lp => {
        const full = merged.find(p => p.id === lp.id);
        if (!full) return;

        const pos = full.position;

        // Find matching group (handles DT+DE, CB+S)
        const group = Object.keys(slotsByGroup).find(g =>
          g === pos || g.split("+").includes(pos)
        );

        if (!group) return;

        const availableSlots = slotsByGroup[group];

        // Assign to first empty slot
        const nextSlot = availableSlots.find(s => !initialLineup[s]);

        if (nextSlot) initialLineup[nextSlot] = lp.id;
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

  // ⭐ FIXED — async function restored
  async function submitLineup() {
    const params = new URLSearchParams({
      TYPE: "submitLineup",
      L: leagueId,
      JSON: 1
    });

    // Append lineup slots first
    Object.entries(lineup).forEach(([slotName, id]) => {
      if (id) params.append(slotName, id);
    });

    // Append franchise last (prevents accidental concatenation)
    params.append("FRANCHISE", myFranchiseId);

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
            {slot.slotName}
            {slot.required ? "" : " (optional)"}
          </div>

          <select
            className="submit-select"
            value={lineup[slot.slotName] || ""}
            onChange={(e) => setStarter(slot.slotName, e.target.value)}
          >
            <option value="">-- Select Player --</option>

            {(() => {
              const selected = players.find(p => p.id === lineup[slot.slotName]);
              return selected ? (
                <option value={selected.id}>
                  {selected.name} ({selected.position} - {selected.team})
                </option>
              ) : null;
            })()}

            {players
              .filter(p => slot.eligible.includes(p.position))
              .filter(p => p.id !== lineup[slot.slotName]) // don't duplicate selected
              .filter(p => !Object.values(lineup).includes(p.id)) // prevent duplicates
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
