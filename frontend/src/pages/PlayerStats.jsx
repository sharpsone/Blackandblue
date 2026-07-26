import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function PlayerStats({ leagueId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state for future real stats
  const [week, setWeek] = useState(1);
  const [position, setPosition] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("PLAYER STATS ERROR:", err);
      }

      setLoading(false);
    }

    load();
  }, [leagueId, year]);

  if (loading) {
    return <p style={{ padding: "1rem" }}>Loading player stats...</p>;
  }

  if (!league) {
    return (
      <p style={{ padding: "1rem", color: "red" }}>
        Could not load league info.
      </p>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Player Stats</h1>

      {/* Filters */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "1rem" }}>
          Week:
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            style={{ marginLeft: "0.5rem" }}
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginRight: "1rem" }}>
          Position:
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            <option value="ALL">All</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
            <option value="DEF">DEF</option>
          </select>
        </label>

        <input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.3rem",
            borderRadius: "4px",
            border: "1px solid #333",
            background: "#111",
            color: "white"
          }}
        />
      </div>

      {/* Placeholder table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem"
        }}
      >
        <thead>
          <tr style={{ background: "#001f3f" }}>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Player
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Team
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Position
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Week {week} Points
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              colSpan="4"
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "#aaa"
              }}
            >
              Player stats endpoint not yet implemented — backend route needed.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PlayerStats;
