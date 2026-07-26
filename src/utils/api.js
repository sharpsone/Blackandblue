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
