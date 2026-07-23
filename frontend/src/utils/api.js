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

// FETCH FREE AGENTS
export async function fetchFreeAgents(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/freeagents/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH MESSAGE BOARD
export async function fetchMessages(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/messages/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH SCHEDULE
export async function fetchSchedule(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/schedule/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH TRANSACTIONS
export async function fetchTransactions(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/transactions/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH PLAYER STATS
export async function fetchPlayerStats(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/playerstats/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH DRAFT RESULTS
export async function fetchDraftResults(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/draftresults/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}

// FETCH PLAYOFF BRACKET
export async function fetchPlayoffBracket(leagueId) {
  const res = await fetch(
    `https://blackandblue.onrender.com/api/playoffs/${leagueId}`,
    { credentials: "include" }
  );
  return res.json();
}
