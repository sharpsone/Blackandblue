import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchLiveScoring, fetchLeague } from "../utils/api";

export default function LiveScoring({ leagueId, myFranchiseId }) {
  const [matchups, setMatchups] = useState([]);
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 60000); // auto-refresh every 60 seconds

    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const scoringJson = await fetchLiveScoring(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });

      setFranchiseNames(nameMap);

      const games = scoringJson.liveScoring.matchup || [];
      setMatchups(games);

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("LIVE SCORING ERROR:", err);
      setError("Failed to load live scoring");
    }
  }

  function gameStatus(game) {
    if (game.status === "In Progress") return { text: "LIVE", color: "#00ff55" };
    if (game.status === "Final") return { text: "FINAL", color: "#ff0033" };
    return { text: "UPCOMING", color: "#aaa" };
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Live Scoring
      </h1>

      <button
        onClick={loadData}
        className="hover-grow"
        style={{
          background: "#00aaff",
          color: "black",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          fontWeight: "bold",
          marginBottom: "1rem",
          cursor: "pointer"
        }}
      >
        Refresh Now
      </button>

      {lastUpdated && (
        <p style={{ color: "#aaa", marginBottom: "1rem" }}>
          Last updated: {lastUpdated}
        </p>
      )}

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

      {/* Player scoring */}
      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ color: "#00aaff", marginBottom: "0.5rem" }}>
          Player Scoring
        </h3>

        {(matchup.players?.player || []).map(p => (
          <PlayerScoreCard key={p.id} player={p} />
        ))}
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

function PlayerScoreCard({ player }) {
  const {
    name,
    position,
    team,
    points,
    gameSecondsRemaining,
    status
  } = player;

  const isPlaying = status === "In Progress";

  return (
    <div
      className="fade-in"
      style={{
        background: "#222",
        padding: "0.5rem",
        borderRadius: "6px",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap"
      }}
    >
      <div>
        <div style={{ fontWeight: "bold" }}>{name}</div>
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
          <Badge text={position} color="#00aaff" />
          <Badge text={team || "FA"} color="#003566" />
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "12px", color: "#aaa" }}>Points</div>
        <div style={{ fontWeight: "bold", color: "#00aaff" }}>
          {points || 0}
        </div>

        {isPlaying && (
          <div style={{ fontSize: "12px", color: "#00ff55", marginTop: "0.25rem" }}>
            {gameSecondsRemaining > 0
              ? `${Math.floor(gameSecondsRemaining / 60)}m left`
              : "Final"}
          </div>
        )}
      </div>
    </div>
  );
}
