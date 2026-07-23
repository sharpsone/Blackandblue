// LOGIN USER
export async function loginUser(username, password) {
  const res = await fetch("https://blackandblue.onrender.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include"
  });
  return res.json();
}

// FETCH MY LEAGUES (used after login)
export async function fetchMyLeagues() {
  const res = await fetch("https://blackandblue.onrender.com/api/myleagues", {
    credentials: "include"
  });
  return res.json();
}

// FETCH LEAGUE DETAILS (needed by several pages)
export async function fetchLeague(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/league/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH LIVE SCORING (needed by LiveScoring.jsx)
export async function fetchLiveScoring(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/live/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH STANDINGS (needed by Standings.jsx)
export async function fetchStandings(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/standings/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}
