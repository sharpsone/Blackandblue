const API_BASE = "/api";

// LOGIN
export async function login(username, password, year = "2026") {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password, year })
  });

  return response.json();
}

// GET MY LEAGUES
export async function getMyLeagues(year = "2026") {
  const response = await fetch(`${API_BASE}/myleagues?year=${year}`, {
    credentials: "include"
  });

  return response.json();
}

// GET LEAGUE INFO
export async function getLeagueInfo(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/league?leagueId=${leagueId}&year=${year}`,
    {
      credentials: "include"
    }
  );

  return response.json();
}

// GET STANDINGS
export async function getStandings(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/standings?leagueId=${leagueId}&year=${year}`,
    {
      credentials: "include"
    }
  );

  return response.json();
}

// GET LEAGUE
export async function getLeague(leagueId, year) {
  const res = await fetch(`/api/league?leagueId=${leagueId}&year=${year}`);
  return res.json();
}


// GET SCHEDULE
export async function getSchedule(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/schedule?leagueId=${leagueId}&year=${year}`,
    {
      credentials: "include"
    }
  );

  return response.json();
}

// GET ROSTER
export async function getRoster(leagueId, franchiseId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/rosters?leagueId=${leagueId}&franchiseId=${franchiseId}&year=${year}`,
    {
      credentials: "include"
    }
  );

  return response.json();
}

// GET PLAYERS
export async function getPlayers(year = "2026") {
  const response = await fetch(`${API_BASE}/players?year=${year}`, {
    credentials: "include"
  });
  return response.json();
}

// GET WEEKLY LINEUP
export async function getWeeklyLineup(leagueId, franchiseId, year, week) {
  const url = `https://www.myfantasyleague.com/${year}/export?TYPE=weeklyResults&L=${leagueId}&FRANCHISE=${franchiseId}&W=${week}&JSON=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`weeklyResults fetch failed: ${res.status}`);
  }

  return res.json();
}

