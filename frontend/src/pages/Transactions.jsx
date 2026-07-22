import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchTransactions, fetchLeague } from "../utils/api";

export default function Transactions({ leagueId }) {
  const [transactions, setTransactions] = useState([]);
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const transJson = await fetchTransactions(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });

      setFranchiseNames(nameMap);

      const list = transJson.transactions.transaction || [];
      setTransactions(list.reverse()); // newest first
    } catch (err) {
      console.error("TRANSACTIONS ERROR:", err);
      setError("Failed to load transactions");
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Transactions
      </h1>

      {transactions.map((t, idx) => (
        <TransactionCard
          key={idx}
          t={t}
          franchiseNames={franchiseNames}
        />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function TransactionCard({ t, franchiseNames }) {
  const type = t.type || "Unknown";
  const time = new Date(parseInt(t.timestamp) * 1000).toLocaleString();

  const franchise = franchiseNames[t.franchise] || {};
  const { name, logo } = franchise;

  const players = t.player || [];

  const color =
    type === "Add"
      ? "#00ff55"
      : type === "Drop"
      ? "#ff0033"
      : type === "Trade"
      ? "#f1c40f"
      : "#aaa";

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1rem",
        border: "1px solid #222"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: "0.75rem"
        }}
      >
        <Badge text={type.toUpperCase()} color={color} />

        <span style={{ color: "#aaa", fontSize: "12px" }}>{time}</span>
      </div>

      {/* Franchise */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem"
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
          {name || t.franchise}
        </span>
      </div>

      {/* Players */}
      {players.map(p => (
        <PlayerTransaction key={p.id} player={p} type={type} />
      ))}
    </div>
  );
}

function PlayerTransaction({ player, type }) {
  const { name, position, team } = player;

  return (
    <div
      className="fade-in"
      style={{
        background: "#222",
        padding: "0.75rem",
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
        <span
          style={{
            fontWeight: "bold",
            color:
              type === "Add"
                ? "#00ff55"
                : type === "Drop"
                ? "#ff0033"
                : type === "Trade"
                ? "#f1c40f"
                : "white"
          }}
        >
          {type}
        </span>
      </div>
    </div>
  );
}
