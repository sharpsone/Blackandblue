import { useState } from "react";
import "./App.css";

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

import { loginUser } from "./utils/api";

function App() {
  const [page, setPage] = useState("standings");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [myFranchiseId, setMyFranchiseId] = useState(null);

  const [leagueId] = useState("19757");

  // ⭐ GLOBAL YEAR — change this once, entire site updates
  const [year, setYear] = useState("2025");

  const [error, setError] = useState(null);

  async function login() {
    setError(null);

    const res = await loginUser(username, password);
    if (!res.success) {
      setError("Login failed");
      return;
    }

    // ⭐ Login succeeded
    setLoggedIn(true);

    // ⭐ IMPORTANT: Remove myleagues call (MFL 404s for past seasons)
    // You already know leagueId and year, so nothing else is needed here.

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
      {/* ⭐ NavBar appears after login */}
      {loggedIn && (
        <NavBar
          page={page}
          setPage={setPage}
          year={year}
          setYear={setYear}
        />
      )}

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
            <Standings
              leagueId={leagueId}
              myFranchiseId={myFranchiseId}
              year={year}
            />
          )}

          {page === "roster" && (
            <Roster
              leagueId={leagueId}
              myFranchiseId={myFranchiseId}
              year={year}
            />
          )}

          {page === "live" && (
            <LiveScoring
              leagueId={leagueId}
              myFranchiseId={myFranchiseId}
              year={year}
            />
          )}

          {page === "matchups" && (
            <Matchups leagueId={leagueId} year={year} />
          )}

          {page === "playerstats" && (
            <PlayerStats leagueId={leagueId} year={year} />
          )}

          {page === "transactions" && (
            <Transactions leagueId={leagueId} year={year} />
          )}

          {page === "draft" && (
            <DraftResults leagueId={leagueId} year={year} />
          )}

          {page === "messages" && (
            <MessageBoard leagueId={leagueId} year={year} />
          )}

          {page === "freeagents" && (
            <FreeAgents leagueId={leagueId} year={year} />
          )}

          {page === "schedule" && (
            <Schedule leagueId={leagueId} year={year} />
          )}

          {page === "playoffs" && (
            <PlayoffBracket leagueId={leagueId} year={year} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
