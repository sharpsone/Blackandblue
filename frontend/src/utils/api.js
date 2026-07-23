const API_BASE = "https://blackandblue.onrender.com";

/* ⭐ LOGIN — MUST NOT include ?year= */
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include"
  });
  return res.json();
}

/* ⭐ MY LEAGUES — DOES need year */
export async function fetchMyLeagues(year) {
  const res = await fetch(`${API_BASE}/api/myleagues?year=${year}`, {
    credentials: "include"
  });
  return res.json();
}

/* ⭐ LEAGUE DETAILS */
export async function fetchLeague(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ LIVE SCORING */
export async function fetchLiveScoring(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/live/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ STANDINGS — FIXED */
export async function fetchStandings(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/standings/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ ROSTER — FIXED (your old version was wrong) */
export async function fetchRoster(leagueId, franchiseId, year) {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/rosters?franchiseId=${franchiseId}&year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ MATCHUPS */
export async function fetchMatchups(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/matchups/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ FREE AGENTS */
export async function fetchFreeAgents(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/freeagents/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ MESSAGE BOARD */
export async function fetchMessages(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/messages/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ SCHEDULE */
export async function fetchSchedule(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/schedule/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ TRANSACTIONS */
export async function fetchTransactions(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/transactions/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ PLAYER STATS */
export async function fetchPlayerStats(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/playerstats/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ DRAFT RESULTS */
export async function fetchDraftResults(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/draftresults/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ PLAYOFF BRACKET */
export async function fetchPlayoffBracket(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/playoffs/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}
