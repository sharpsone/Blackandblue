import { useState, useEffect } from "react";
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

import {
  loginUser,
  fetchLeague
} from "./utils/api";

function App() {
  const [page, setPage] = useState("standings");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [myFranchiseId, setMyFranchiseId] = useState(null);

  const [leagueId] = useState("19757");
  const [year, setYear] = useState("2025");

  const [error, setError] = useState(null);

  // ⭐ FIX: Always start logged out on refresh
  useEffect(() => {
    setLoggedIn(false);
    setMyFranchiseId(null);
    localStorage.removeItem("myFranchiseId");
  }, []);

  async function login() {
    setError(null);

    const res = await loginUser(username, password, year);
    if (!res.success) {
      setError("Login failed");
      return;
    }

    setLoggedIn(true);

    try {
      const leagueInfo = await fetchLeague(leagueId, year);

      const franchises =
        leagueInfo?.league?.franchises?.franchise || [];

      const myFranchise = franchises.find(
        (f) =>
          f.username?.toLowerCase() === username.toLowerCase() ||
          f.email?.toLowerCase() === username.toLowerCase()
      );

      if (!myFranchise) {
        console.error("❌ Could not match username/email to any franchise");
        setError("Could not determine franchise ID");
        return;
      }

      const franchise = myFranchise.id;

      console.log("✔ DETECTED FRANCHISE ID:", franchise);

      setMyFranchiseId(franchise);
      localStorage.setItem("myFranchiseId", franchise);
    } catch (err) {
      console.error("FRANCHISE DETECTION ERROR:", err);
      setError("Failed to load league info");
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
            placeholder="MFL Username or Email"
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
