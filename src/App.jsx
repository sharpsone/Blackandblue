// src/App.jsx
import "./App.css";

import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import NavBar from "./components/NavBar";

import Standings from "./pages/Standings";
import Roster from "./pages/Roster";
import Matchups from "./pages/SubmitLineup";

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
        {/* NOT LOGGED IN → SHOW LOGIN */}
        {!isLoggedIn && <Login />}

        {/* LOGGED IN BUT LEAGUE STILL LOADING */}
        {isLoggedIn && loadingLeague && (
          <div style={{ color: "white", padding: "2rem" }}>
            Loading league...
          </div>
        )}

        {/* LOGGED IN, LEAGUE FAILED */}
        {isLoggedIn && !loadingLeague && !leagueInfo && (
          <div style={{ color: "red", padding: "2rem" }}>
            Could not load league info.
          </div>
        )}

        {/* LOGGED IN, LEAGUE LOADED → ROUTE PAGES */}
        {isLoggedIn && leagueInfo && (
          <>
            {page === "standings" && <Standings leagueInfo={leagueInfo} />}
            {page === "roster" && <Roster leagueInfo={leagueInfo} />}
            {page === "matchups" && <Matchups leagueInfo={leagueInfo} />}
          </>
        )}
      </div>
    </>
  );
}
