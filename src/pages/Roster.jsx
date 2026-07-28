import { useEffect, useState } from "react";
import { getRoster, getPlayers } from "../utils/api";
import "./roster.css";

function Roster({ leagueId, year, myFranchiseId }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // NFL team logos
  const teamLogos = {
    BUF: "/logos/BUF.png",
    KC: "/logos/KC.png",
    MIN: "/logos/MIN.png",
    DAL: "/logos/DAL.png",
    // Add remaining teams...
  };

  // Position color map
  const posColor = {
    QB: "#ffb703",
    RB: "#219ebc",
    WR: "#8ecae6",
    TE: "#fb8500",
    PK: "#e63946",
    DEF: "#6a4c93",
    LB: "#6a4c93",
    CB: "#6a4c93",
    DT: "#6a4c93",
    DE: "#6a4c93",
    S: "#6a4c93"
  };

  useEffect(() => {
async function loadRoster() {
  if (!myFranchiseId) return;

  try {
    // 1. Get roster (who is on your team)
    const rosterData = await getRoster(leagueId, myFranchiseId, year);
    const rosterPlayers = rosterData?.roster?.players || [];

    // 2. Get full player database
    const playerData = await getPlayers(year);
    const allPlayers = playerData?.players || [];

    // 3. Get weekly lineup (starter / bench / IR)
    const lineupData = await getWeeklyLineup(leagueId, myFranchiseId, year, 1);
    const lineupPlayers = lineupData?.weeklyResults?.franchise?.player || [];

    // 4. Merge everything
    const merged = rosterPlayers.map(rp => {
      const full = allPlayers.find(p => p.id === rp.id);
      const lineup = lineupPlayers.find(lp => lp.id === rp.id);

      return {
        ...rp,
        ...full,
        lineupStatus: lineup?.status || "bench" // default bench if not found
      };
    });

    // Debug: see actual lineup statuses
    console.log(
      "Lineup Statuses:",
      merged.map(p => ({
        id: p.id,
        name: p.name,
        pos: p.position,
        lineupStatus: p.lineupStatus
      }))
    );

    setPlayers(merged);
  } catch (err) {
    console.error("ROSTER ERROR:", err);
  }

  setLoading(false);
}

    loadRoster();
  }, [leagueId, year, myFranchiseId]);

  if (loading) return <div className="loading">Loading roster...</div>;

  if (!players.length)
    return <div className="loading">No roster data found.</div>;

  // Group offense / defense
  const offense = players.filter(p =>
    ["QB", "RB", "WR", "TE", "PK"].includes(p.position)
  );
  const defense = players.filter(p =>
    ["LB", "CB", "DT", "DE", "S", "DB", "DL"].includes(p.position)
  );

  // Starter / Bench / IR grouping
const starters = players.filter(p => p.lineupStatus === "starter");
const bench = players.filter(p => p.lineupStatus === "bench");
const ir = players.filter(p => p.lineupStatus === "ir");

// ⭐ ORDER STARTERS
function orderStarters(starters) {
  const groups = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    PK: [],
    LB: [],
    DL: [],
    CB: []
  };

  // Group players by position
  starters.forEach(p => {
    if (groups[p.position]) {
      groups[p.position].push(p);
    }
  });

  // Build ordered list
  return [
    ...groups.QB.slice(0, 1),
    ...groups.RB.slice(0, 3),   // up to 3 RB
    ...groups.WR.slice(0, 3),   // up to 3 WR
    ...groups.TE.slice(0, 1),
    ...groups.PK.slice(0, 1),
    ...groups.LB.slice(0, 2),
    ...groups.DL.slice(0, 2),
    ...groups.CB.slice(0, 2)
  ].filter(Boolean); // remove undefined
}

  // ⭐ PROXY-BASED HEADSHOT LOADER
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

return (
  <div className="roster-container">
    <h1 className="roster-title">My Roster</h1>

    <div className="section-title">Starters</div>
    <div className="player-section">
      {orderStarters(starters).map(renderPlayer)}
    </div>

    <div className="section-title">Bench</div>
    <div className="player-section">
      {bench.map(renderPlayer)}
    </div>

    <div className="section-title">Injured Reserve</div>
    <div className="player-section">
      {ir.map(renderPlayer)}
    </div>
  </div>
);
}

export default Roster;
