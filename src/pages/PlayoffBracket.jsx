import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchPlayoffBracket, fetchLeague } from "../utils/api";

export default function PlayoffBracket({ leagueId, myFranchiseId }) {
  const [rounds, setRounds] = useState({});
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const bracketJson = await fetchPlayoffBracket(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });
      setFranchiseNames(nameMap);

      const games = bracketJson.playoffs?.matchup || [];
      const grouped = {};

      games.forEach(m => {
        const round = m.round || "1";
        if (!grouped[round]) grouped[round] = [];
        grouped[round].push(m);
      });

      setRounds(grouped);
    } catch (err) {
      console.error("PLAYOFF BRACKET ERROR:", err);
      setError("Failed to load playoff bracket");
    }
  }

  const roundKeys = Object.keys(rounds).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Playoff Bracket
      </h1>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-start"
        }}
      >
        {roundKeys.map(round => (
          <RoundColumn
            key={round}
            round={round}
            matchups={rounds[round]}
            franchiseNames={franchiseNames}
            myFranchiseId={myFranchiseId}
          />
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function RoundColumn({ round, matchups, franchiseNames, myFranchiseId }) {
  const roundLabel =
    round === "1"
      ? "Quarterfinals"
      : round === "2"
      ? "Semifinals"
      : round === "3"
      ? "Finals"
      : `Round ${round}`;

  return (
    <div
      style={{
        flex: 1,
        minWidth: "220px"
      }}
    >
      <h2
        className="slide-in"
        style={{
          background: "#003566",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          marginBottom: "1rem",
          color: "white",
          textAlign: "center"
        }}
      >
        {roundLabel}
      </h2>

      {matchups.map((m, idx) => (
        <BracketMatchup
          key={idx}
          matchup={m}
          franchiseNames={franchiseNames}
          myFranchiseId={myFranchiseId}
        />
      ))}
    </div>
  );
}

function BracketMatchup({ matchup, franchiseNames, myFranchiseId }) {
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
        padding: "0.75rem",
        marginBottom: "0.75rem",
        border: "1px solid #222",
        boxShadow:
          home.id === myFranchiseId || away.id === myFranchiseId
            ? "0 0 12px rgba(0,170,255,0.9)"
            : "0 0 6px rgba(0,0,0,0.4)"
      }}
    >
      <div style={{ marginBottom: "0.5rem", textAlign: "center" }}>
        <Badge text={statusObj.text} color={statusObj.color} />
      </div>

      <BracketTeamRow
        team={home}
        info={homeInfo}
        isOwner={home.id === myFranchiseId}
        top
      />
      <BracketTeamRow
        team={away}
        info={awayInfo}
        isOwner={away.id === myFranchiseId}
      />
    </div>
  );
}

function BracketTeamRow({ team, info, isOwner, top }) {
  const { id, score, seed } = team;
  const { name, logo } = info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.4rem 0",
        borderBottom: top ? "1px solid #222" : "none"
      }}
    >
      {/* Seed */}
      <div style={{ minWidth: "24px", textAlign: "center" }}>
        <span
          style={{
            fontSize: "11px",
            color: "#aaa"
          }}
        >
          {seed ? `#${seed}` : ""}
        </span>
      </div>

      {/* Logo + Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flex: 1
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #00aaff"
            }}
          />
        ) : (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#00aaff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "14px",
              color: "black"
            }}
          >
            {name?.[0] || "?"}
          </div>
        )}

        <span
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: isOwner ? "#00aaff" : "white"
          }}
        >
          {name || id}
        </span>
      </div>

      {/* Score */}
      <div style={{ minWidth: "50px", textAlign: "right" }}>
        <span
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: "#00aaff"
          }}
        >
          {score ?? "-"}
        </span>
      </div>
    </div>
  );
}
