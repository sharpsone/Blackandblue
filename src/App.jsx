import "./App.css";
import { useEffect, useState } from "react";

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
  login as loginUser,
  getLeagueInfo
} from "./utils/api";

function App() {
  const [page, setPage] = useState("standings");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [myFranchiseId, setMyFranchiseId] = useState(null);

  const [leagueId] = useState(19757);
  const [year, setYear] = useState("2026");

  const [error, setError] = useState(null);

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
      const leagueInfo = await getLeagueInfo(leagueId, year);
      const franchises = leagueInfo?.league?.franchises?.franchise;

      if (!franchises) {
        console.error("❌ Could not load franchises");
        setError("Could not load franchise list");
        return;
      }

      // ⭐ FIX: match by username OR email OR owner_name
      const loginLower = username.toLowerCase();

      const myFranchise = franchises.find((f) => {
        return (
          f.username?.toLowerCase() === loginLower ||
          f.email?.toLowerCase() === loginLower ||
          f.owner_name?.toLowerCase() === loginLower
        );
      });

      if (!myFranchise) {
        console.error("❌ Could not match login to franchise");
        setError("Could not determine franchise ID");
        return;
      }

      const franchiseId = myFranchise.id; // "0012"

      console.log("✔ REAL FRANCHISE ID:", franchiseId);

      setMyFranchiseId(franchiseId);
      localStorage.setItem("myFranchiseId", franchiseId);

    } catch (err) {
      console.error("FRANCHISE DETECTION ERROR:", err);
      setError("Failed to detect franchise ID");
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
