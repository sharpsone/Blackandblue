// src/App.jsx
import "./App.css";

import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import NavBar from "./components/NavBar";

// PAGE IMPORTS
import Standings from "./pages/Standings";
import Team from "./pages/Team";
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

  function renderPage() {
    if (!leagueInfo) return null;

    switch (page) {
      case "standings":
        return <Standings leagueInfo={leagueInfo} />;
      case "team":
        return <Team leagueInfo={leagueInfo} />;
      case "matchups":
        return <Matchups leagueInfo={leagueInfo} />;
      case "freeagents":
        return <FreeAgents leagueInfo={leagueInfo} />;
      case "playerstats":
        return <PlayerStats leagueInfo={leagueInfo} />;
      case "transactions":
        return <Transactions leagueInfo={leagueInfo} />;
      case "draft":
        return <DraftResults leagueInfo={leagueInfo} />;
      case "messages":
        return <MessageBoard leagueInfo={leagueInfo} />;
      case "schedule":
        return <Schedule leagueInfo={leagueInfo} />;
      case "playoffs":
        return <PlayoffBracket leagueInfo={leagueInfo} />;
      case "live":
        return <LiveScoring leagueInfo={leagueInfo} />;
      default:
        return <Standings leagueInfo={leagueInfo} />;
    }
  }

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

        {isLoggedIn && leagueInfo && renderPage()}
      </div>
    </>
  );
}
