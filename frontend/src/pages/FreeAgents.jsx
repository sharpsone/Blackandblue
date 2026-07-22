import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchFreeAgents } from "../utils/api";

export default function FreeAgents({ leagueId }) {
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFreeAgents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [players, search, positionFilter]);

  async function loadFreeAgents() {
    try {
      const faJson = await fetchFreeAgents(leagueId);
      const list = faJson.freeAgents?.player || [];

      setPlayers(list);
    } catch (err) {
      console.error("FREE AGENTS ERROR:", err);
      setError("Failed to load free agents");
    }
  }

  function applyFilters() {
    let list = [...players];

    // Search filter
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(s) ||
          (p.team || "").toLowerCase().includes(s)
      );
    }

    // Position filter
    if (positionFilter !== "ALL") {
      list = list.filter(p => p.position === positionFilter);
    }

    setFiltered(list);
  }

  const positions = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Free Agents
      </h1>

      {/* Search Bar */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search players..."
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "1rem",
          background: "#000814",
          color: "white",
          border: "1px solid #333",
          borderRadius: "6px"
        }}
      />

      {/* Position Filter */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap"
        }}
      >
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border:
                positionFilter === pos
                  ? "1px solid #00aaff"
                  : "1px solid #333",
              background: positionFilter === pos ? "#001f3f" : "#111",
              color: "white",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Player List */}
      {filtered.map(p => (
        <FreeAgentCard key={p.id} player={p} />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function FreeAgentCard({ player }) {
  const {
    name,
    position,
    team,
    fantasy_points,
    bye,
    id
  } = player;

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "0.75rem",
        marginBottom: "0.75rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        border: "1px solid #222"
      }}
    >
      {/* Player Name + Badges */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>{name}</span>

        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
          <Badge text={position} color="#00aaff" />
          <Badge text={team || "FA"} color="#003566" />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          textAlign: "right",
          minWidth: "100px"
        }}
      >
        <div style={{ fontSize: "12px", color: "#aaa" }}>Points</div>
        <div style={{ fontWeight: "bold", color: "#00aaff" }}>
          {fantasy_points || 0}
        </div>

        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "0.5rem" }}>
          Bye Week
        </div>
        <div style={{ fontWeight: "bold", color: "white" }}>
          {bye || "-"}
        </div>
      </div>

      {/* Add Button (Read-only) */}
      <button
        className="hover-grow"
        style={{
          marginTop: "0.5rem",
          background: "#00aaff",
          color: "black",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
        onClick={() => alert("Add/Drop API not enabled yet")}
      >
        Add
      </button>
    </div>
  );
}
