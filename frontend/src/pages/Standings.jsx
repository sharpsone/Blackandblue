import { useEffect, useState } from "react";
import { getStandings } from "../utils/api";

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
    <div style={{ padding: "1rem" }}>
      <h1>Standings</h1>

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
              Franchise
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Wins
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Losses
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Points For
            </th>
            <th style={{ padding: "0.5rem", border: "1px solid #333" }}>
              Points Against
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((f) => (
            <tr
              key={f.id}
              style={{
                background:
                  f.id === String(myFranchiseId) ? "#003366" : "#000"
              }}
            >
              <td style={{ padding: "0.5rem", border: "1px solid #333" }}>
                {f.name}
              </td>
              <td style={{ padding: "0.5rem", border: "1px solid #333" }}>
                {f.wins}
              </td>
              <td style={{ padding: "0.5rem", border: "1px solid #333" }}>
                {f.losses}
              </td>
              <td style={{ padding: "0.5rem", border: "1px solid #333" }}>
                {f.points_for}
              </td>
              <td style={{ padding: "0.5rem", border: "1px solid #333" }}>
                {f.points_against}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Standings;
