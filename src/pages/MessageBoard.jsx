import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function MessageBoard({ leagueId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("MESSAGE BOARD ERROR:", err);
      }
      setLoading(false);
    }
    load();
  }, [leagueId, year]);

  if (loading) return <p style={{ padding: "1rem" }}>Loading message board...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Message Board</h1>
      <p>Message board endpoint not yet implemented — backend route needed.</p>
    </div>
  );
}

export default MessageBoard;
