import { useState, useEffect } from "react";
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
  const [leagueId, setLeagueId] = useState("19757");
  const [error, setError] = useState(null);

  async function login() {
    setError(null);

    const res = await loginUser(username, password);
    if (!res.success) {
      setError("Login failed");
      return;
    }

    setLoggedIn(true);

    // Fetch franchise ID
    const leagues = await fetchMyLeagues();
    const myLeague = leagues.leagues.league;

    setMyFranchiseId(myLeague.franchise_id);

    // Stay on standings page
    setPage("standings");
  }

  return (
    <div style={{ background: "#000814", minHeight: "100vh", color: "white" }}>
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
          <NavBar page={page} setPage={setPage} />

          {page === "standings" && (
            <Standings leagueId={leagueId} myFranchiseId={myFranchiseId} />
          )}
          {page === "roster" && (
            <Roster leagueId={leagueId} myFranchiseId={myFranchiseId} />
          )}
          {page === "live" && (
            <LiveScoring leagueId={leagueId} myFranchiseId={myFranchiseId} />
          )}
          {page === "matchups" && <Matchups leagueId={leagueId} />}
          {page === "playerstats" && <PlayerStats leagueId={leagueId} />}
          {page === "transactions" && <Transactions leagueId={leagueId} />}
          {page === "draft" && <DraftResults leagueId={leagueId} />}
          {page === "messages" && <MessageBoard leagueId={leagueId} />}
          {page === "freeagents" && <FreeAgents leagueId={leagueId} />}
          {page === "schedule" && <Schedule leagueId={leagueId} />}
          {page === "playoffs" && <PlayoffBracket leagueId={leagueId} />}
        </>
      )}
    </div>
  );
}

export default App;
