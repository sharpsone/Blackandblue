export const API_BASE = "https://blackandblue.onrender.com";

export async function getLeague(leagueId) {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}`);
  return res.json();
}

export async function getStandings(leagueId) {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}/standings`);
  return res.json();
}

export async function getRosters(leagueId) {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}/rosters`);
  return res.json();
}
