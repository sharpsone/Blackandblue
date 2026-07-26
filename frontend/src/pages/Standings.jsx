import { useEffect, useState } from "react";
import { getStandings } from "../utils/api";

// ⭐ Add your CSS file here
import "./standings.css";

function Standings({ leagueId, myFranchiseId, year }) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const data = await getStandings(leagueId, year);
        setStandings(data);
      } catch (err) {
        console.error("STANDINGS ERROR:", err);
      }

      setLoading(false);
    }

    load();
  }, [leagueId, year]);

  if (loading) {
    return <p style={{ padding: "1rem" }}>Loading standings...</p>;
  }

  if (!standings) {
    return (
      <p style={{ padding: "1rem", color: "red" }}>
        Could not load standings.
      </p>
    );
  }

  const rows =
    standings?.standings?.franchise || standings?.franchise || [];

  return (
    <div className="standings-container">
      <h1>Standings</h1>

      <table className="standings-table">
        <thead>
          <tr>
            <th>Franchise</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points For</th>
            <th>Points Against</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((f) => (
            <tr
              key={f.id}
              className={
                f.id === String(myFranchiseId)
                  ? "standings-row highlight"
                  : "standings-row"
              }
            >
              <td>{f.name}</td>
              <td>{f.wins}</td>
              <td>{f.losses}</td>
              <td>{f.points_for}</td>
              <td>{f.points_against}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Standings;
