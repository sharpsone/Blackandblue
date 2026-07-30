// src/App.jsx
import "./App.css";               // ⭐ REQUIRED FOR PAGE WRAPPER + GLOBAL LAYOUT
import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import NavBar from "./components/NavBar";

import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import Matchups from "./pages/SubmitLineup";
// import LiveScoring from "./pages/LiveScoring";
// import PlayerStats from "./pages/PlayerStats";
// import Transactions from "./pages/Transactions";
// import DraftResults from "./pages/DraftResults";
// import MessageBoard from "./pages/MessageBoard";
// import FreeAgents from "./pages/FreeAgents";
// import Schedule from "./pages/Schedule";
// import PlayoffBracket from "./pages/PlayoffBracket";

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  // ⭐ Page routing
  const [page, setPage] = useState("standings");

  // ⭐ League info from backend
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loadingLeague, setLoadingLeague] = useState(true);

  // ⭐ If not logged in → show login
  if (!isLoggedIn) {
    return <Login />;
  }

  // ⭐ Load league info AFTER login
  useEffect(() => {
    async function loadLeague() {
      try {
        const res = await fetch("/api/myleagues");
        const data = await res.json();
        setLeagueInfo(data);
      } catch (err) {
        console.error("Failed to load league info:", err);
      } finally {
        setLoadingLeague(false);
      }
    }

    loadLeague();
  }, [isLoggedIn]);

  // ⭐ Show loading screen while league loads
  if (loadingLeague) {
    return (
      <div className="page-wrapper" style={{ color: "white", padding: "2rem" }}>
        Loading league...
      </div>
    );
  }

  // ⭐ If league info failed
  if (!leagueInfo || leagueInfo.error) {
    return (
      <div className="page-wrapper" style={{ color: "red", padding: "2rem" }}>
        Could not load league info.
      </div>
    );
  }

  // ⭐ MAIN RENDER — NAVBAR + PAGE ROUTING
  return (
    <>
      <NavBar page={page} setPage={setPage} />

      {/* ⭐ THIS WRAPPER IS CRITICAL — WITHOUT IT YOUR PAGE IS BLACK */}
      <div className="page-wrapper">
        {page === "standings" && <Standings leagueInfo={leagueInfo} />}
        {page === "roster" && <Roster leagueInfo={leagueInfo} />}
        {page === "matchups" && <Matchups leagueInfo={leagueInfo} />}

        {/* Uncomment these when ready */}
        {/* {page === "live" && <LiveScoring leagueInfo={leagueInfo} />} */}
        {/* {page === "playerstats" && <PlayerStats leagueInfo={leagueInfo} />} */}
        {/* {page === "transactions" && <Transactions leagueInfo={leagueInfo} />} */}
        {/* {page === "draft" && <DraftResults leagueInfo={leagueInfo} />} */}
        {/* {page === "messages" && <MessageBoard leagueInfo={leagueInfo} />} */}
        {/* {page === "freeagents" && <FreeAgents leagueInfo={leagueInfo} />} */}
        {/* {page === "schedule" && <Schedule leagueInfo={leagueInfo} />} */}
        {/* {page === "playoffs" && <PlayoffBracket leagueInfo={leagueInfo} />} */}
      </div>
    </>
  );
}
