import { useState } from "react";
import "./App.css";   // ⭐ REQUIRED — this was missing!

import NavBar from "./components/NavBar";
import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import LiveScoring from "./pages/LiveScoring";
import Matchups from "./pages/Matchups";
import PlayerStats from "./pages/PlayerStats";
import Transactions from "./pages/Transactions";
import DraftResults from "./pages/DraftResults";
import MessageBoard from "./pages/MessageBoard";
import FreeAgents from "./pages/FreeAgents";
import Schedule from "./pages/Schedule";
import PlayoffBracket from "./pages/PlayoffBracket";
import { fetchMyLeagues, loginUser } from "./utils/api";

function App() {
  const [page, setPage] = useState("standings");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [myFranchiseId, setMyFranchiseId] = useState(null);
  const [leagueId] = useState("19757");
  const [year] = useState("2025"); // ⭐ NEW - Change this to the current year of your league
  const [error, setError] = useState(null);

  async function login() {
    setError(null);

    const res = await loginUser(username, password);
    if (!res.success) {
      setError("Login failed");
      return;
    }

    setLoggedIn(true);

    try {
      const leagues = await fetchMyLeagues();
      const myLeague = leagues.leagues.league;
      setMyFranchiseId(myLeague.franchise_id);
    } catch (err) {
      console.error("MYLEAGUES ERROR:", err);
      setError("Could not load league data");
    }

    setPage("standings");
  }

  return (
    <div
      className="page-wrapper"
      style={{
        background: "#000814",
        minHeight: "100vh",
        color: "white"
      }}
    >
      {loggedIn && <NavBar page={page} setPage={setPage} />}

      {!loggedIn ? (
        <div style={{ padding: "2rem" }}>
          <h1>Black & Blue League Login</h1>

          <input
            placeholder="MFL Username"
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

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <>
        {page === "standings" && (
          <Standings leagueId={leagueId} year={year} myFranchiseId={myFranchiseId} />
        )}
        {page === "roster" && (
          <Roster leagueId={leagueId} year={year} myFranchiseId={myFranchiseId} />
        )}
        {page === "live" && (
          <LiveScoring leagueId={leagueId} year={year} myFranchiseId={myFranchiseId} />
        )}
        {page === "matchups" && <Matchups leagueId={leagueId} year={year} />}
        {page === "playerstats" && <PlayerStats leagueId={leagueId} year={year} />}
        {page === "transactions" && <Transactions leagueId={leagueId} year={year} />}
        {page === "draft" && <DraftResults leagueId={leagueId} year={year} />}
        {page === "messages" && <MessageBoard leagueId={leagueId} year={year} />}
        {page === "freeagents" && <FreeAgents leagueId={leagueId} year={year} />}
        {page === "schedule" && <Schedule leagueId={leagueId} year={year} />}
        {page === "playoffs" && <PlayoffBracket leagueId={leagueId} year={year} />}
        </>
      )}
    </div>
  );
}

export default App;
