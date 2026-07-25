const API_BASE = "https://blackandblue.onrender.com";

/* ⭐ LOGIN — includes year */
export async function loginUser(username, password, year = "2025") {
  const res = await fetch(`${API_BASE}/api/login?year=${year}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include"
  });
  return res.json();
}

/* ⭐ LEAGUE INFO */
export async function fetchLeague(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ ROSTER */
export async function fetchRoster(leagueId, franchiseId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/rosters?franchiseId=${franchiseId}&year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

/* ⭐ OTHER ENDPOINTS */

export async function fetchStandings(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/standings/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchLiveScoring(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/live/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchMatchups(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/matchups/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchFreeAgents(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/freeagents/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchMessages(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/messages/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchSchedule(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/schedule/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchTransactions(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/transactions/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchPlayerStats(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/playerstats/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchDraftResults(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/draftresults/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchPlayoffBracket(leagueId, year = "2025") {
  const res = await fetch(
    `${API_BASE}/api/playoffs/${leagueId}?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}
