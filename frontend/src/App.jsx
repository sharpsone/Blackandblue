import { useState, useEffect } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [leagueId, setLeagueId] = useState("19757"); // ⭐ Auto-load your league
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

      // ⭐ Auto-load standings after login
      setTimeout(() => loadStandings(), 500);
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

      if (standingsJson.error) {
        setError(standingsJson.error);
        return;
      }

      // 2. League info (names, divisions, conferences)
      const leagueRes = await fetch(
        `https://blackandblue.onrender.com/api/league/${leagueId}`
      );
      const leagueJson = await leagueRes.json();

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const divisionList = leagueJson.league.divisions?.division || [];
      const conferenceList = leagueJson.league.conferences?.conference || [];

      const nameMap = {};
      const divisionIdMap = {};
      const conferenceIdMap = {};

      franchiseList.forEach(f => {
        nameMap[f.id] = f.name;
        divisionIdMap[f.id] = f.division;
        conferenceIdMap[f.id] = f.conference;
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

        // Win % from h2hpct
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

  // ⭐ STREAK COLOR (Black & Blue branding)
  function streakColor(strk) {
    if (!strk || strk === "-") return "#888";
    if (strk.startsWith("W")) return "#00aaff"; // Blue win
    if (strk.startsWith("L")) return "#ff0033"; // Red loss
    return "#f1c40f"; // Yellow for other
  }

  const sortedTeams = getSortedTeams();

  // ⭐ Group teams by conference + division
  function groupTeams() {
    if (!sortedTeams) return {};

    const groups = {};

    sortedTeams.forEach(team => {
      const conf = team.conferenceName;
      const div = team.divisionName;

      if (!groups[conf]) groups[conf] = {};
      if (!groups[conf][div]) groups[conf][div] = [];

      groups[conf][div].push(team);
    });

    return groups;
  }

  const grouped = groupTeams();

  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "sans-serif",
        color: "white",
        background: "#000814",
        minHeight: "100vh"
      }}
    >
      <h1 style={{ marginBottom: "0.5rem", color: "#00aaff" }}>
        Black & Blue League Dashboard
      </h1>
      <p style={{ marginBottom: "1.5rem", color: "#aaa" }}>
        Modern NFL-style standings for your league.
      </p>

      {!loggedIn && (
        <LoginCard
          username={username}
          password={password}
          setUsername={setUsername}
          setPassword={setPassword}
          login={login}
          error={error}
        />
      )}

      {loggedIn && (
        <div>
          {/* ⭐ Sorting controls */}
          <SortControls sortBy={sortBy} sortDir={sortDir} toggleSort={toggleSort} />

          {/* ⭐ Conference + Division sections */}
          {Object.keys(grouped).map(conf => (
            <div key={conf} style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  color: conf === "Black" ? "#000" : "#00aaff",
                  background: conf === "Black" ? "#111" : "#001f3f",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  marginBottom: "1rem"
                }}
              >
                {conf} Conference
              </h2>

              {Object.keys(grouped[conf]).map(div => (
                <div key={div} style={{ marginBottom: "1.5rem" }}>
                  <h3
                    style={{
                      color: "#fff",
                      background: "#003566",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "4px",
                      marginBottom: "0.75rem"
                    }}
                  >
                    {div}
                  </h3>

                  {grouped[conf][div].map(team => (
                    <TeamCard key={team.id} team={team} streakColor={streakColor} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ⭐ COMPONENTS */

function LoginCard({ username, password, setUsername, setPassword, login, error }) {
  return (
    <div
      style={{
        maxWidth: "400px",
        padding: "1.5rem",
        background: "#001f3f",
        borderRadius: "8px",
        boxShadow: "0 0 12px rgba(0,0,0,0.6)",
        marginBottom: "2rem"
      }}
    >
      <h2 style={{ marginBottom: "1rem", color: "#00aaff" }}>Login</h2>

      <input
        placeholder="MFL Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="MFL Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button onClick={login} style={buttonStyleBlue}>
        Login
      </button>

      {error && (
        <pre style={{ marginTop: "1rem", color: "red" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
    </div>
  );
}

function SortControls({ sortBy, sortDir, toggleSort }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap"
      }}
    >
      <span style={{ color: "#aaa" }}>Sort by:</span>

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
            border: sortBy === opt.key ? "1px solid #00aaff" : "1px solid #333",
            background: sortBy === opt.key ? "#001f3f" : "#111",
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
  );
}

function TeamCard({ team, streakColor }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem",
        background: "#111",
        borderRadius: "8px",
        boxShadow: "0 0 8px rgba(0,0,0,0.5)",
        marginBottom: "0.5rem",
        flexWrap: "wrap"
      }}
    >
      {/* Logo + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#00aaff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {team.initials}
        </div>

        <div>
          <span style={{ fontWeight: "bold", fontSize: "15px" }}>
            {team.name}
          </span>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
            <Badge text={team.conferenceName} color="#00aaff" />
            <Badge text={team.divisionName} color="#003566" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center"
        }}
      >
        <Stat label="PF" value={team.pf} />
        <Stat label="PA" value={team.pa} />
        <Stat label="H2H" value={team.h2hwlt} />
        <Stat label="DIV" value={team.divwlt} />
        <Stat label="CONF" value={team.confwlt} />
        <Stat label="Win %" value={team.winPct.toFixed(3)} />
      </div>

      {/* Streak */}
      <div style={{ minWidth: "80px", textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: "#aaa" }}>Streak</span>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: streakColor(team.strk)
          }}
        >
          {team.strk}
        </div>
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "2px 6px",
        borderRadius: "999px",
        background: color,
        color: "white"
      }}
    >
      {text}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: "60px" }}>
      <div style={{ fontSize: "11px", color: "#aaa" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

/* Styles */
const inputStyle = {
  display: "block",
  marginBottom: "0.75rem",
  width: "100%",
  padding: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #333",
  background: "#001f3f",
  color: "white"
};

const buttonStyleBlue = {
  padding: "0.5rem 1rem",
  borderRadius: "4px",
  border: "none",
  background: "#00aaff",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold"
};

export default App;
