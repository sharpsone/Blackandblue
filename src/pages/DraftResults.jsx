import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function DraftResults({ leagueId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("DRAFT RESULTS ERROR:", err);
      }
      setLoading(false);
    }
    load();
  }, [leagueId, year]);

  if (loading) return <p style={{ padding: "1rem" }}>Loading draft results...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Draft Results</h1>
      <p>Draft results endpoint not yet implemented — backend route needed.</p>
    </div>
  );
}

export default DraftResults;

