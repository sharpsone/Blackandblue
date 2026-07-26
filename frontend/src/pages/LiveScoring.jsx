import { useEffect, useState } from "react";
import { getLeagueInfo } from "../utils/api";

function LiveScoring({ leagueId, myFranchiseId, year }) {
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const data = await getLeagueInfo(leagueId, year);
        setLeague(data);
      } catch (err) {
        console.error("LIVE SCORING ERROR:", err);
      }

      setLoading(false);
    }

    load();
  }, [leagueId, year]);

  if (loading) {
    return <p style={{ padding: "1rem" }}>Loading live scoring...</p>;
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
      <h1>Live Scoring</h1>

      <p>
        <strong>League:</strong> {league?.league?.name || "Unknown"}
      </p>

      <p>
        <strong>Your Franchise ID:</strong>{" "}
        {myFranchiseId || "Not detected"}
      </p>

      <p style={{ marginTop: "2rem" }}>
        Live scoring endpoint not yet implemented — backend route needed.
      </p>
    </div>
  );
}

export default LiveScoring;
