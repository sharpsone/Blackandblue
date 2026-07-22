import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [teams, setTeams] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

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

  // ⭐ LOAD STANDINGS WITH LEAGUE INFO
  async function loadStandings() {
    setError(null);

    try {
      // 1. Standings
      const standingsRes = await fetch(
        `https://blackandblue.onrender.com/api/league/${leagueId}/standings`
      );
      const standingsJson = await standingsRes.json();
      console.log("STANDINGS RESPONSE:", standingsJson);

      if (standingsJson.error) {
        setError(standingsJson.error);
        return;
      }

      // 2. League info (names, divisions, conferences)
      const leagueRes = await fetch(
        `https://blackandblue.onrender.com/api/league/${leagueId}`
      );
      const leagueJson = await leagueRes.json();
      console.log("LEAGUE INFO RESPONSE:", leagueJson);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const divisionList = leagueJson.league.divisions
        ? leagueJson.league.divisions.division || []
        : [];
      const conferenceList = leagueJson.league.conferences
        ? leagueJson.league.conferences.conference || []
        : [];

      const nameMap = {};
      const divisionIdMap = {};
      const conferenceIdMap = {};

      franchiseList.forEach(f => {
        nameMap[f.id] = f.name;
        if (f.division) divisionIdMap[f.id] = f.division;
        if (f.conference) conferenceIdMap[f.id] = f.conference;
      });

      const divisionNameMap = {};
      divisionList.forEach(d => {
        divisionNameMap[d.id] = d.name;
      });

      const conferenceNameMap = {};
      conferenceList.forEach(c => {
        conferenceNameMap[c.id] = c.name;
      });

      // 3. Merge everything into team objects
      const merged = standingsJson.leagueStandings.franchise.map(team => {
        const id = team.id;
        const name = nameMap[id] || id;
        const divisionId = divisionIdMap[id];
        const conferenceId = conferenceIdMap[id];

        const divisionName = divisionId ? divisionNameMap[divisionId] : "Division";
        const conferenceName = conferenceId
          ? conferenceNameMap[conferenceId]
          : "Conference";

        // Simple logo: initials from team name
        const initials = name
          .split(" ")
          .map(w => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3);

        // Win % from h2hpct (".000" → 0, ".750" → 0.75)
        const winPct = team.h2hpct ? parseFloat(team.h2hpct) : 0;

        return {
          ...team,
          name,
          divisionName,
          conferenceName,
          initials,
          winPct
        };
      });

      setTeams(merged);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setError("Failed to load standings");
    }
  }

  // ⭐ SORTED TEAMS
  function getSortedTeams() {
    if (!teams) return [];

    const sorted = [...teams];

    sorted.sort((a, b) => {
      let av, bv;

      switch (sortBy) {
        case "pf":
          av = parseFloat(a.pf || "0");
          bv = parseFloat(b.pf || "0");
          break;
        case "pa":
          av = parseFloat(a.pa || "0");
          bv = parseFloat(b.pa || "0");
          break;
        case "winPct":
          av = a.winPct || 0;
          bv = b.winPct || 0;
          break;
        case "name":
        default:
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  // ⭐ STREAK COLOR
  function streakColor(strk) {
    if (!strk || strk === "-") return "#ccc";
    if (strk.startsWith("W")) return "#2ecc71"; // green
    if (strk.startsWith("L")) return "#e74c3c"; // red
    return "#f1c40f"; // yellow for other
  }

  const sortedTeams = getSortedTeams();

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif", color: "white", background: "#050608", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Black & Blue League Dashboard</h1>
      <p style={{ marginBottom: "1.5rem", color: "#aaa" }}>
        Modern NFL-style standings for your MyFantasyLeague league.
      </p>

      {!loggedIn && (
        <div
          style={{
            maxWidth: "400px",
            padding: "1.5rem",
            background: "#111",
            borderRadius: "8px",
            boxShadow: "0 0 12px rgba(0,0,0,0.6)",
            marginBottom: "2rem"
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>Login to MyFantasyLeague</h2>

          <input
            placeholder="MFL Username (email)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              display: "block",
              marginBottom: "0.75rem",
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white"
            }}
          />

          <input
            placeholder="MFL Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              marginBottom: "0.75rem",
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white"
            }}
          />

          <button
            onClick={login}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "none",
              background: "#0074D9",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Login
          </button>

          {error && (
            <pre style={{ marginTop: "1rem", color: "red", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      )}

      {loggedIn && (
        <div>
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "#111",
              borderRadius: "8px",
              maxWidth: "500px",
              boxShadow: "0 0 12px rgba(0,0,0,0.6)"
            }}
          >
            <h2 style={{ marginBottom: "0.75rem" }}>Load Standings</h2>

            <input
              placeholder="League ID"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              style={{
                display: "block",
                marginBottom: "0.75rem",
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #333",
                background: "#1a1a1a",
                color: "white"
              }}
            />

            <button
              onClick={loadStandings}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "none",
                background: "#2ecc71",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Load Standings
            </button>

            {error && (
              <pre style={{ marginTop: "1rem", color: "red", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(error, null, 2)}
              </pre>
            )}
          </div>

          {/* ⭐ ESPN/Sleeper-style responsive standings */}
          {sortedTeams && sortedTeams.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              {/* Sort controls */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.5rem"
                }}
              >
                <span style={{ color: "#aaa", marginRight: "0.5rem" }}>Sort by:</span>
                {[
                  { key: "name", label: "Team" },
                  { key: "pf", label: "PF" },
                  { key: "pa", label: "PA" },
                  { key: "winPct", label: "Win %" }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => toggleSort(opt.key)}
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      border: sortBy === opt.key ? "1px solid #2ecc71" : "1px solid #333",
                      background: sortBy === opt.key ? "#1a3b2a" : "#111",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    {opt.label}
                    {sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                ))}
              </div>

              {/* Conference/Division badges + row cards */}
              {sortedTeams.map(team => (
                <div
                  key={team.id}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 0.75rem",
                    background: "#111",
                    borderRadius: "8px",
                    boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                    gap: "0.75rem",
                    flexWrap: "wrap"
                  }}
                >
                  {/* Left: logo + team name + badges */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "180px" }}>
                    {/* Logo (initials) */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#0074D9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      {team.initials}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                        {team.name}
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "999px",
                            background: "#222",
                            color: "#9b59b6"
                          }}
                        >
                          {team.conferenceName}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "999px",
                            background: "#222",
                            color: "#e67e22"
                          }}
                        >
                          {team.divisionName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: core stats */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      justifyContent: "center"
                    }}
                  >
                    <StatBlock label="PF" value={team.pf} />
                    <StatBlock label="PA" value={team.pa} />
                    <StatBlock label="H2H" value={team.h2hwlt} />
                    <StatBlock label="DIV" value={team.divwlt} />
                    <StatBlock label="CONF" value={team.confwlt} />
                    <StatBlock
                      label="Win %"
                      value={team.winPct.toFixed(3)}
                    />
                  </div>

                  {/* Right: streak */}
                  <div style={{ minWidth: "80px", textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#aaa",
                        display: "block",
                        marginBottom: "2px"
                      }}
                    >
                      Streak
                    </span>
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: streakColor(team.strk)
                      }}
                    >
                      {team.strk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Small helper component for stat blocks
function StatBlock({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: "60px" }}>
      <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

export default App;

