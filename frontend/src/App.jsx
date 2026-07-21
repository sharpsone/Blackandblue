import { useState } from "react";
import { getStandings } from "./api";

function App() {
  const [leagueId, setLeagueId] = useState("");
  const [data, setData] = useState(null);

  async function loadStandings() {
    const result = await getStandings(leagueId);
    setData(result);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Black & Blue League Dashboard</h1>

      <input
        placeholder="Enter League ID"
        value={leagueId}
        onChange={(e) => setLeagueId(e.target.value)}
      />

      <button onClick={loadStandings}>Load Standings</button>

      {data && (
        <pre style={{ marginTop: "2rem", background: "#222", color: "#0f0", padding: "1rem" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
