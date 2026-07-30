import { useEffect, useState } from "react";
import { getRoster, getPlayers, getLeague } from "../utils/api";
import "../pages/submitlineup.css";

export default function SubmitLineup({ leagueInfo }) {
  // ⭐ Unpack leagueInfo passed from App.jsx
  const leagueId = leagueInfo?.leagueId;
  const myFranchiseId = leagueInfo?.franchiseId;
  const year = leagueInfo?.year || 2026;

  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState({});
  const [starterSlots, setStarterSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !myFranchiseId) return;
    loadData();
  }, [leagueId, myFranchiseId, year]);

  async function loadData() {
    try {
      // 1. League rules
      const leagueData = await getLeague(leagueId, year);
      const positions = leagueData?.league?.starters?.position || [];

      const starterList = [];

      positions.forEach(p => {
        const name = p.name;
        const limit = p.limit;

        let min = 1;
        let max = 1;

        if (limit.includes("-")) {
          const [lo, hi] = limit.split("-");
          min = parseInt(lo, 10);
          max = parseInt(hi, 10);
        } else {
          min = max = parseInt(limit, 10);
        }

        const eligible = name.includes("+")
          ? name.split("+")
          : [name];

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

      const slotsByGroup = starterList.reduce((acc, slot) => {
        if (!acc[slot.positionGroup]) acc[slot.positionGroup] = [];
        acc[slot.positionGroup].push(slot.slotName);
        return acc;
      }, {});

      const initialLineup = {};

      weeklyPlayers.forEach(lp => {
        const full = merged.find(p => p.id === lp.id);
        if (!full) return;

        const pos = full.position;

        const group = Object.keys(slotsByGroup).find(g =>
          g === pos || g.split("+").includes(pos)
        );

        if (!group) return;

        const availableSlots = slotsByGroup[group];
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

  async function submitLineup() {
    const starters = Object.values(lineup)
      .filter(id => id)
      .join(",");

    const params = new URLSearchParams({
      TYPE: "lineup",
      L: leagueId,
      W: 1,
      FRANCHISE_ID: myFranchiseId,
      STARTERS: starters
    });

    const res = await fetch(`/api/submitLineup?${params.toString()}`, {
      credentials: "include"
    });

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
              .filter(p => p.id !== lineup[slot.slotName])
              .filter(p => !Object.values(lineup).includes(p.id))
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
