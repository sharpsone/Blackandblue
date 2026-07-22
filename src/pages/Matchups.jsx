import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchMatchups, fetchLeague } from "../utils/api";

export default function Matchups({ leagueId, myFranchiseId }) {
  const [matchups, setMatchups] = useState([]);
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const matchupJson = await fetchMatchups(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });

      setFranchiseNames(nameMap);

      const games = matchupJson.matchups.matchup || [];
      setMatchups(games);
    } catch (err) {
      console.error("MATCHUPS ERROR:", err);
      setError("Failed to load matchups");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Weekly Matchups
      </h1>

      {matchups.map((m, idx) => (
        <MatchupCard
          key={idx}
          matchup={m}
          franchiseNames={franchiseNames}
          myFranchiseId={myFranchiseId}
        />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function MatchupCard({ matchup, franchiseNames, myFranchiseId }) {
  const home = matchup.franchise[0];
  const away = matchup.franchise[1];

  const homeInfo = franchiseNames[home.id] || {};
  const awayInfo = franchiseNames[away.id] || {};

  const status = matchup.status || "UPCOMING";
  const statusObj =
    status === "In Progress"
      ? { text: "LIVE", color: "#00ff55" }
      : status === "Final"
      ? { text: "FINAL", color: "#ff0033" }
      : { text: "UPCOMING", color: "#aaa" };

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1rem",
        border: "1px solid #222",
        boxShadow:
          home.id === myFranchiseId || away.id === myFranchiseId
            ? "0 0 12px rgba(0,170,255,0.9)"
            : "0 0 6px rgba(0,0,0,0.4)"
      }}
    >
      {/* Status */}
      <div style={{ marginBottom: "0.5rem" }}>
        <Badge text={statusObj.text} color={statusObj.color} />
      </div>

      {/* Teams */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <TeamScoreCard
          team={home}
          info={homeInfo}
          isOwner={home.id === myFranchiseId}
        />

        <TeamScoreCard
          team={away}
          info={awayInfo}
          isOwner={away.id === myFranchiseId}
        />
      </div>

      {/* Projections */}
      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ color: "#00aaff", marginBottom: "0.5rem" }}>
          Projections
        </h3>

        <ProjectionRow label="Home" value={home.projected || 0} />
        <ProjectionRow label="Away" value={away.projected || 0} />
      </div>
    </div>
  );
}

function TeamScoreCard({ team, info, isOwner }) {
  const { id, score } = team;
  const { name, logo } = info;

  return (
    <div
      style={{
        flex: "1",
        minWidth: "140px",
        background: "#000814",
        padding: "0.75rem",
        borderRadius: "8px",
        border: isOwner ? "2px solid #00aaff" : "1px solid #333"
      }}
    >
      {/* Logo */}
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #00aaff",
            marginBottom: "0.5rem"
          }}
        />
      ) : (
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#00aaff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "16px",
            color: "black",
            marginBottom: "0.5rem"
          }}
        >
          {name?.[0] || "?"}
        </div>
      )}

      <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "0.25rem" }}>
        {name || id}
      </div>

      <div style={{ fontSize: "14px", color: "#00aaff" }}>{score}</div>
    </div>
  );
}

function ProjectionRow({ label, value }) {
  return (
    <div
      className="fade-in"
      style={{
        background: "#222",
        padding: "0.5rem",
        borderRadius: "6px",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between"
      }}
    >
      <span style={{ color: "#aaa" }}>{label}</span>
      <span style={{ fontWeight: "bold", color: "#00aaff" }}>{value}</span>
    </div>
  );
}
