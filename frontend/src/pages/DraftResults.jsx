import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchDraftResults, fetchLeague } from "../utils/api";

export default function DraftResults({ leagueId }) {
  const [rounds, setRounds] = useState({});
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const draftJson = await fetchDraftResults(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });

      setFranchiseNames(nameMap);

      const picks = draftJson.draftResults?.draftResult || [];

      const grouped = {};
      picks.forEach(p => {
        const round = p.round || "1";
        if (!grouped[round]) grouped[round] = [];
        grouped[round].push(p);
      });

      setRounds(grouped);
    } catch (err) {
      console.error("DRAFT RESULTS ERROR:", err);
      setError("Failed to load draft results");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Draft Results
      </h1>

      {Object.keys(rounds).map(round => (
        <RoundSection
          key={round}
          round={round}
          picks={rounds[round]}
          franchiseNames={franchiseNames}
        />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function RoundSection({ round, picks, franchiseNames }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2
        className="slide-in"
        style={{
          background: "#003566",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          marginBottom: "1rem",
          color: "white"
        }}
      >
        Round {round}
      </h2>

      {picks.map(p => (
        <DraftPickCard
          key={`${p.round}-${p.pick}`}
          pick={p}
          franchiseNames={franchiseNames}
        />
      ))}
    </div>
  );
}

function DraftPickCard({ pick, franchiseNames }) {
  const {
    round,
    pick: pickNum,
    franchise,
    player,
    timestamp
  } = pick;

  const franchiseInfo = franchiseNames[franchise] || {};
  const { name, logo } = franchiseInfo;

  const time = timestamp
    ? new Date(parseInt(timestamp) * 1000).toLocaleString()
    : "Unknown";

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "0.75rem",
        marginBottom: "0.75rem",
        border: "1px solid #222",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap"
      }}
    >
      {/* Pick Number */}
      <div style={{ minWidth: "60px" }}>
        <div style={{ fontSize: "12px", color: "#aaa" }}>Pick</div>
        <div style={{ fontWeight: "bold", color: "#00aaff" }}>
          {round}.{pickNum}
        </div>
      </div>

      {/* Franchise */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          minWidth: "160px"
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #00aaff"
            }}
          />
        ) : (
          <div
            style={{
              width: "40px",
              height: "40px",
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

        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          {name || franchise}
        </span>
      </div>

      {/* Player */}
      <div style={{ flex: "1", minWidth: "160px" }}>
        <div style={{ fontWeight: "bold" }}>{player.name}</div>

        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
          <Badge text={player.position} color="#00aaff" />
          <Badge text={player.team || "FA"} color="#003566" />
        </div>
      </div>

      {/* Timestamp */}
      <div style={{ minWidth: "120px", textAlign: "right" }}>
        <div style={{ fontSize: "12px", color: "#aaa" }}>Time</div>
        <div style={{ fontWeight: "bold", color: "white" }}>{time}</div>
      </div>
    </div>
  );
}
