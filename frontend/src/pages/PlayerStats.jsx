import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchPlayerStats } from "../utils/api";

export default function PlayerStats({ leagueId }) {
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("points");
  const [sortDir, setSortDir] = useState("desc");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [players, positionFilter, sortBy, sortDir]);

  async function loadStats() {
    try {
      const statsJson = await fetchPlayerStats(leagueId);
      const list = statsJson.playerStats.player || [];

      setPlayers(list);
    } catch (err) {
      console.error("PLAYER STATS ERROR:", err);
      setError("Failed to load player stats");
    }
  }

  function applyFilters() {
    let list = [...players];

    if (positionFilter !== "ALL") {
      list = list.filter(p => p.position === positionFilter);
    }

    list.sort((a, b) => {
      let av, bv;

      switch (sortBy) {
        case "points":
          av = parseFloat(a.fantasy_points || "0");
          bv = parseFloat(b.fantasy_points || "0");
          break;
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "team":
          av = (a.team || "").toLowerCase();
          bv = (b.team || "").toLowerCase();
          break;
        case "position":
          av = a.position || "";
          bv = b.position || "";
          break;
        default:
          av = 0;
          bv = 0;
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    setFiltered(list);
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  const positions = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Player Stats
      </h1>

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

      {/* Sorting Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap"
        }}
      >
        <span style={{ color: "#aaa" }}>Sort by:</span>

        {[
          { key: "points", label: "Points" },
          { key: "name", label: "Name" },
          { key: "team", label: "Team" },
          { key: "position", label: "Position" }
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => toggleSort(opt.key)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: sortBy === opt.key ? "1px solid #00aaff" : "1px solid #333",
              background: sortBy === opt.key ? "#001f3f" : "#111",
              color: "white",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {opt.label}
            {sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      {/* Player List */}
      {filtered.map(p => (
        <PlayerCard key={p.id} player={p} />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function PlayerCard({ player }) {
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
    </div>
  );
}
