import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [data, setData] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ LOGIN FUNCTION
  async function login() {
    setError(null);

    const res = await fetch("https://blackandblue.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const json = await res.json();
    console.log("LOGIN RESPONSE:", json);

    if (json.success) {
      setLoggedIn(true);
    } else {
      setError(json.error || "Login failed");
    }
  }

  // ⭐ LOAD STANDINGS (with franchise names)
  async function loadStandings() {
    setError(null);

    try {
      // 1. Get standings
      const standingsRes = await fetch(
        `https://blackandblue.onrender.com/api/league/${leagueId}/standings`
      );
      const standingsJson = await standingsRes.json();
      console.log("STANDINGS RESPONSE:", standingsJson);

      if (standingsJson.error) {
        setError(standingsJson.error);
        return;
      }

      // 2. Get league info (for franchise names)
      const leagueRes = await fetch(
        `https://blackandblue.onrender.com/api/league/${leagueId}`
      );
      const leagueJson = await leagueRes.json();
      console.log("LEAGUE INFO RESPONSE:", leagueJson);

      // 3. Build franchise ID → name map
      const nameMap = {};
      leagueJson.league.franchises.franchise.forEach(f => {
        nameMap[f.id] = f.name;
      });

      // 4. Merge names into standings
      const merged = standingsJson.leagueStandings.franchise.map(team => ({
        ...team,
        name: nameMap[team.id] || team.id
      }));

      setData(merged);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setError("Failed to load standings");
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", color: "white" }}>
      <h1>Black & Blue League Dashboard</h1>

      {!loggedIn && (
        <div>
          <h2>Login to MyFantasyLeague</h2>

          <input
            placeholder="MFL Username (email)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ display: "block", marginBottom: "1rem" }}
          />

          <input
            placeholder="MFL Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: "1rem" }}
          />

          <button onClick={login}>Login</button>

          {error && (
            <pre style={{ marginTop: "1rem", color: "red" }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      )}

      {loggedIn && (
        <div>
          <h2>Load Standings</h2>

          <input
            placeholder="League ID"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            style={{ display: "block", marginBottom: "1rem" }}
          />

          <button onClick={loadStandings}>Load Standings</button>

          {error && (
            <pre style={{ marginTop: "1rem", color: "red" }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          )}

          {/* ⭐ Modern NFL-style standings table */}
          {data && (
            <table
              style={{
                marginTop: "2rem",
                width: "100%",
                background: "#111",
                color: "white",
                borderCollapse: "collapse",
                fontFamily: "Arial, sans-serif",
                fontSize: "14px",
                borderRadius: "8px",
                overflow: "hidden"
              }}
            >
              <thead style={{ background: "#1e1e1e" }}>
                <tr>
                  <th style={{ padding: "12px", textAlign: "left" }}>Team</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>PF</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>PA</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>H2H</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>DIV</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>CONF</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>STRK</th>
                </tr>
              </thead>

              <tbody>
                {data.map(team => (
                  <tr
                    key={team.id}
                    style={{
                      borderBottom: "1px solid #333",
                      background: "#181818"
                    }}
                  >
                    <td style={{ padding: "12px" }}>{team.name}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.pf}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.pa}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.h2hwlt}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.divwlt}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.confwlt}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{team.strk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
