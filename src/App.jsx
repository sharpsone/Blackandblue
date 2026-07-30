// src/App.jsx

import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import NavBar from "./components/NavBar";

import Standings from "./pages/Standings";
// If you have other pages, import them here:
import Roster from "./pages/Roster";
import Matchups from "./pages/submitlineup";
// import LiveScoring from "./pages/LiveScoring";
// etc.

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  // Page routing state
  const [page, setPage] = useState("standings");

  // League info loaded from /api/myleagues
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loadingLeague, setLoadingLeague] = useState(true);

  // STEP 1 — If not logged in, show login screen
  if (!isLoggedIn) {
    return <Login />;
  }

  // STEP 2 — Load league info AFTER login
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

  // STEP 3 — Show loading screen while league info loads
  if (loadingLeague) {
    return (
      <div style={{ color: "white", padding: "2rem" }}>
        Loading league...
      </div>
    );
  }

  // STEP 4 — If league info failed, show error
  if (!leagueInfo || leagueInfo.error) {
    return (
      <div style={{ color: "red", padding: "2rem" }}>
        Could not load league info.
      </div>
    );
  }

  // STEP 5 — Render navbar + routed pages
  return (
    <>
      <NavBar page={page} setPage={setPage} />

      <div style={{ paddingTop: "70px" }}>
        {page === "standings" && <Standings leagueInfo={leagueInfo} />}

        {/* Uncomment these as you restore pages */}
        {/* page === "roster" && <Roster leagueInfo={leagueInfo} /> */}
        {/* page === "live" && <LiveScoring leagueInfo={leagueInfo} /> */}
        {/* page === "matchups" && <Matchups leagueInfo={leagueInfo} /> */}
        {/* page === "playerstats" && <PlayerStats leagueInfo={leagueInfo} /> */}
        {/* page === "transactions" && <Transactions leagueInfo={leagueInfo} /> */}
        {/* page === "draft" && <DraftResults leagueInfo={leagueInfo} /> */}
        {/* page === "messages" && <MessageBoard leagueInfo={leagueInfo} /> */}
        {/* page === "freeagents" && <FreeAgents leagueInfo={leagueInfo} /> */}
        {/* page === "schedule" && <Schedule leagueInfo={leagueInfo} /> */}
        {/* page === "playoffs" && <PlayoffBracket leagueInfo={leagueInfo} /> */}
      </div>
    </>
  );
}
