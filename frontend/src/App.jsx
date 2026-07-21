import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [data, setData] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  async function login() {
    setError(null);

    const res = await fetch("https://blackandblue.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const json = await res.json();

    if (json.success) {
      setLoggedIn(true);
    } else {
      setError("Login failed");
    }
  }

  async function loadStandings() {
    setError(null);

    const res = await fetch(
      `https://blackandblue.onrender.com/api/league/${leagueId}/standings`
    );

    const json = await res.json();

    if (json.error) {
      setError(json.error);
    } else {
      setData(json);
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Black & Blue League Dashboard</h1>

      {!loggedIn && (
        <div>
          <h2>Login to MyFantasyLeague</h2>

          <input
            placeholder="MFL Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="MFL Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={login}>Login</button>

          {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
        </div>
      )}

      {loggedIn && (
        <div>
          <h2>Load Standings</h2>

          <input
            placeholder="League ID"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
          />

          <button onClick={loadStandings}>Load Standings</button>

          {error && <pre>{JSON.stringify(error, null, 2)}</pre>}

          {data && (
            <pre style={{ marginTop: "2rem", background: "#222", color: "#0f0", padding: "1rem" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
