import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function FreeAgents({ leagueId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("FREE AGENTS ERROR:", err);
      }
      setLoading(false);
    }
    load();
  }, [leagueId, year]);

  if (loading) return <p style={{ padding: "1rem" }}>Loading free agents...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Free Agents</h1>
      <p>Free agents endpoint not yet implemented — backend route needed.</p>
    </div>
  );
}

export default FreeAgents;
