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
        const rosterData = await getRoster(leagueId, myFranchiseId, year);
        const rosterPlayers = rosterData?.roster?.players || [];

        const playerData = await getPlayers(year);
        const allPlayers = playerData?.players || [];

        const merged = rosterPlayers.map(rp => {
          const full = allPlayers.find(p => p.id === rp.id);
          return {
            ...rp,
            ...full
          };
        });

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
  const starters = players.filter(p => p.status === "ROSTER");
  const bench = players.filter(p => p.status === "BENCH");
  const ir = players.filter(p => p.status === "IR");

function renderPlayer(p) {
  const headshot = `https://www.myfantasyleague.com/player_photos/${p.id}.jpg`;

  return (
    <div className="player-card">

      {/* HEADSHOT */}
      <div className="headshot-container">
        <img
          src={headshot}
          onError={(e) => (e.target.src = "/headshots/placeholder.png")}
          className="player-headshot"
        />
      </div>

      {/* NAME + TAGS */}
      <div className="player-info">
        <div className="player-name">{p.name}</div>

        <div className="player-tags">
          {p.injury && <span className="injury-tag">{p.injury}</span>}
          {p.bye && <span className="bye-tag">BYE {p.bye}</span>}
        </div>
      </div>

      {/* POS + TEAM */}
      <div className="player-meta">
        <span className="pos-tag">{p.position}</span>
        <span className="team-tag">{p.team}</span>
      </div>

    </div>
  );
}


  return (
    <div className="roster-container">
      <h1 className="roster-title">My Roster</h1>

      <div className="section-title">Starters</div>
      {starters.map(renderPlayer)}

      <div className="section-title">Bench</div>
      {bench.map(renderPlayer)}

      <div className="section-title">Injured Reserve</div>
      {ir.map(renderPlayer)}

      <div className="divider">Offense</div>
      {offense.map(renderPlayer)}

      <div className="divider">Defense</div>
      {defense.map(renderPlayer)}
    </div>
  );
}

export default Roster;
