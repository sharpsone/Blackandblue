import { useEffect, useState } from "react";
import { getSchedule } from "../utils/api";

function Matchups({ leagueId, year }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getSchedule(leagueId, year);
        setSchedule(data);
      } catch (err) {
        console.error("MATCHUPS ERROR:", err);
      }
      setLoading(false);
    }
    load();
  }, [leagueId, year]);

  if (loading) return <p style={{ padding: "1rem" }}>Loading matchups...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Matchups</h1>
      <p>Matchups displayed using schedule endpoint.</p>

      <pre style={{ background: "#001f3f", padding: "1rem" }}>
        {JSON.stringify(schedule, null, 2)}
      </pre>
    </div>
  );
}

export default Matchups;
