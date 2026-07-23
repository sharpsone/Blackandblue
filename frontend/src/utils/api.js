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

// FETCH MY LEAGUES
export async function fetchMyLeagues() {
  const res = await fetch("https://blackandblue.onrender.com/api/myleagues", {
    credentials: "include"
  });
  return res.json();
}

// FETCH LEAGUE DETAILS
export async function fetchLeague(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/league/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH LIVE SCORING
export async function fetchLiveScoring(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/live/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH STANDINGS
export async function fetchStandings(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/standings/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH ROSTER
export async function fetchRoster(leagueId, franchiseId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/roster/${leagueId}/${franchiseId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH MATCHUPS
export async function fetchMatchups(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/matchups/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}
