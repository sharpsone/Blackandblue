const API_BASE = "https://blackandblue.onrender.com";

// LOGIN
export async function login(username, password, year = "2026") {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",   // ⭐ REQUIRED
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password, year })
  });

  return response.json();
}

// GET MY LEAGUES (detect franchise)
export async function getMyLeagues(year = "2026") {
  const response = await fetch(`${API_BASE}/api/myleagues?year=${year}`, {
    credentials: "include"     // ⭐ REQUIRED
  });

  return response.json();
}

// GET LEAGUE INFO
export async function getLeagueInfo(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/api/league/${leagueId}?year=${year}`,
    {
      credentials: "include"   // ⭐ REQUIRED
    }
  );

  return response.json();
}

// GET STANDINGS
export async function getStandings(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/api/league/${leagueId}/standings?year=${year}`,
    {
      credentials: "include"   // ⭐ REQUIRED
    }
  );

  return response.json();
}

// GET SCHEDULE
export async function getSchedule(leagueId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/api/league/${leagueId}/schedule?year=${year}`,
    {
      credentials: "include"   // ⭐ REQUIRED
    }
  );

  return response.json();
}

// GET ROSTER
export async function getRoster(leagueId, franchiseId, year = "2026") {
  const response = await fetch(
    `${API_BASE}/api/league/${leagueId}/rosters?franchiseId=${franchiseId}&year=${year}`,
    {
      credentials: "include"   // ⭐ REQUIRED
    }
  );

  return response.json();
}
