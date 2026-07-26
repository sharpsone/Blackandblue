import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function PlayoffBracket({ leagueId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("PLAYOFF BRACKET ERROR:", err);
      }
      setLoading(false);
    }
    load();
  }, [leagueId, year]);

  if (loading) return <p style={{ padding: "1rem" }}>Loading playoff bracket...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Playoff Bracket</h1>
      <p>Playoff bracket endpoint not yet implemented — backend route needed.</p>
    </div>
  );
}

export default PlayoffBracket;
