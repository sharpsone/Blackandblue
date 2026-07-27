import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  const { leagueId, franchiseId } = req.query;
  const year = getYear(req);

  try {
    const host = await detectMFLHost(year, leagueId, req);

    // ⭐ MUST include APIKEY or roster will return empty
    const url = `https://${host}/${year}/export?TYPE=rosters&L=${leagueId}&FRANCHISE=${franchiseId}&APIKEY=${process.env.MFL_API_KEY}&JSON=1`;

    console.log("ROSTER URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    // MFL returns: raw.rosters.franchise = array OR object
    const franchiseObj = Array.isArray(raw?.rosters?.franchise)
      ? raw.rosters.franchise.find(f => f.id === franchiseId)
      : raw?.rosters?.franchise;

    const players = franchiseObj?.player || [];

    return res.json({
      roster: {
        franchiseId,
        players
      }
    });
  } catch (error) {
    console.error("ROSTER BACKEND ERROR:", error);
    res.status(500).json({ error: "Failed to fetch rosters" });
  }
}
