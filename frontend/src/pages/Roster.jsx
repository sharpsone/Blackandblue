import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchRoster } from "../utils/api";

export default function Roster({ leagueId, myFranchiseId }) {
  const [players, setPlayers] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoster();
  }, [myFranchiseId]);

  async function loadRoster() {
    try {
      const rosterJson = await fetchRoster(leagueId, myFranchiseId);

      const list = rosterJson.rosters.franchise.players.player || [];

      const groupedPlayers = {
        starters: [],
        bench: [],
        ir: [],
        taxi: []
      };

      list.forEach(p => {
        const slot = p.status?.toLowerCase() || "bench";

        if (slot.includes("starter")) groupedPlayers.starters.push(p);
        else if (slot.includes("ir")) groupedPlayers.ir.push(p);
        else if (slot.includes("taxi")) groupedPlayers.taxi.push(p);
        else groupedPlayers.bench.push(p);
      });

      setPlayers(list);
      setGrouped(groupedPlayers);
    } catch (err) {
      console.error("ROSTER ERROR:", err);
      setError("Failed to load roster");
    }
  }

  function renderGroup(title, list, color) {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <h2
          className="slide-in"
          style={{
            background: color,
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            marginBottom: "1rem",
            color: "white"
          }}
        >
          {title}
        </h2>

        {list.length === 0 && (
          <p style={{ color: "#aaa" }}>No players in this group</p>
        )}

        {list.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        My Roster
      </h1>

      {renderGroup("Starters", grouped.starters, "#003566")}
      {renderGroup("Bench", grouped.bench, "#001f3f")}
      {renderGroup("Injured Reserve", grouped.ir, "#660000")}
      {renderGroup("Taxi Squad", grouped.taxi, "#444")}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function PlayerCard({ player }) {
  const {
    id,
    name,
    position,
    team,
    bye,
    fantasy_points,
    status
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
        <div style={{ fontSize: "12px", color: "#aaa" }}>Bye Week</div>
        <div style={{ fontWeight: "bold", color: "white" }}>{bye || "-"}</div>

        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "0.5rem" }}>
          Fantasy Pts
        </div>
        <div style={{ fontWeight: "bold", color: "#00aaff" }}>
          {fantasy_points || 0}
        </div>
      </div>
    </div>
  );
}
