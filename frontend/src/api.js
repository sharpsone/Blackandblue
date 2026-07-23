export const API_BASE = "https://blackandblue.onrender.com";

/**
 * ⭐ All API calls now accept `year`
 * This allows you to switch between 2025 and 2026 easily.
 */

export async function getLeague(leagueId, year) {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}?year=${year}`);
  return res.json();
}

export async function getStandings(leagueId, year) {
  const res = await fetch(
    `${API_BASE}/api/standings/${leagueId}?year=${year}`
  );
  return res.json();
}


export async function getRosters(leagueId, year) {
  const res = await fetch(`${API_BASE}/api/league/${leagueId}/rosters?year=${year}`);
  return res.json();
}

