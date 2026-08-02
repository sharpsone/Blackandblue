// src/App.jsx
import "./App.css";

import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import NavBar from "./components/NavBar";

// PAGE IMPORTS
import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import Matchups from "./pages/SubmitLineup";
import FreeAgents from "./pages/FreeAgents";
import PlayerStats from "./pages/PlayerStats";
import Transactions from "./pages/Transactions";
import DraftResults from "./pages/DraftResults";
import MessageBoard from "./pages/MessageBoard";
import Schedule from "./pages/Schedule";
import PlayoffBracket from "./pages/PlayoffBracket";
import LiveScoring from "./pages/LiveScoring";

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  const [page, setPage] = useState("standings");
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loadingLeague, setLoadingLeague] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    setLoadingLeague(true);

    async function loadLeague() {
      try {
        const res = await fetch("/api/myleagues");
        const data = await res.json();
        setLeagueInfo(data);
      } catch (err) {
        console.error("Failed to load league info:", err);
        setLeagueInfo(null);
      } finally {
        setLoadingLeague(false);
      }
    }

    loadLeague();
  }, [isLoggedIn]);

  return (
    <>
      <NavBar page={page} setPage={setPage} />

      <div className="page-wrapper">
        {!isLoggedIn && <Login />}

        {isLoggedIn && loadingLeague && (
          <div style={{ color: "white", padding: "2rem" }}>
            Loading league...
          </div>
        )}

        {isLoggedIn && !loadingLeague && !leagueInfo && (
          <div style={{ color: "red", padding: "2rem" }}>
            Could not load league info.
          </div>
        )}

        {isLoggedIn && leagueInfo && (
          <>
            {/* ⭐ Pages stay mounted — only visibility changes */}
            <div style={{ display: page === "standings" ? "block" : "none" }}>
              <Standings leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "roster" ? "block" : "none" }}>
              <Roster leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "matchups" ? "block" : "none" }}>
              <Matchups leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "freeagents" ? "block" : "none" }}>
              <FreeAgents leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "playerstats" ? "block" : "none" }}>
              <PlayerStats leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "transactions" ? "block" : "none" }}>
              <Transactions leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "draft" ? "block" : "none" }}>
              <DraftResults leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "messages" ? "block" : "none" }}>
              <MessageBoard leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "schedule" ? "block" : "none" }}>
              <Schedule leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "playoffs" ? "block" : "none" }}>
              <PlayoffBracket leagueInfo={leagueInfo} />
            </div>

            <div style={{ display: page === "live" ? "block" : "none" }}>
              <LiveScoring leagueInfo={leagueInfo} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
