const API_BASE = "https://blackandblue.onrender.com";

export async function loginUser(username, password, year = "2026") {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, year })
  });
  return res.json();
}

export async function fetchLeague(leagueId, year = "2026") {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}?year=${year}`, {
    credentials: "include"
  });
  return res.json();
}

export async function fetchRoster(leagueId, franchiseId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/rosters?franchiseId=${franchiseId}&year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchStandings(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/standings?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchLiveScoring(leagueId, franchiseId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/live?franchiseId=${franchiseId}&year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchMatchups(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/matchups?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchPlayerStats(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/playerstats?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchTransactions(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/transactions?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchDraftResults(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/draft?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchMessages(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/messages?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchFreeAgents(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/freeagents?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchSchedule(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/schedule?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}

export async function fetchPlayoffBracket(leagueId, year = "2026") {
  const res = await fetch(
    `${API_BASE}/api/league/${leagueId}/playoffs?year=${year}`,
    { credentials: "include" }
  );
  return res.json();
}
