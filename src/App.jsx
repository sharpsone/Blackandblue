import { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import Standings from "./pages/Standings";

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  const [leagueInfo, setLeagueInfo] = useState(null);
  const [loadingLeague, setLoadingLeague] = useState(true);

  // STEP 1 — Wait for login
  useEffect(() => {
    if (!isLoggedIn) return;

    async function loadLeague() {
      try {
        const res = await fetch("/api/myleagues");
        const data = await res.json();

        setLeagueInfo(data);
      } catch (err) {
        console.error("Failed to load league info", err);
      } finally {
        setLoadingLeague(false);
      }
    }

    loadLeague();
  }, [isLoggedIn]);

  // STEP 2 — If not logged in → show login
  if (!isLoggedIn) {
    return <Login />;
  }

  // STEP 3 — If logged in but league not loaded → show loading
  if (loadingLeague) {
    return <div style={{ color: "white" }}>Loading league...</div>;
  }

  // STEP 4 — If league failed → show error
  if (!leagueInfo || leagueInfo.error) {
    return <div style={{ color: "red" }}>Could not load league info.</div>;
  }

  // STEP 5 — Pass league info to Standings
  return <Standings leagueInfo={leagueInfo} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
