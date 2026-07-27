import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  const { leagueId, franchiseId } = req.query;
  const year = getYear(req);

  try {
    const host = await detectMFLHost(year, leagueId, req);

    const url = `https://${host}/${year}/export?TYPE=rosters&L=${leagueId}&FRANCHISE=${franchiseId}&JSON=1`;

    console.log("ROSTER URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    // MFL returns: raw.rosters.franchise = array
    const franchiseArr = raw?.rosters?.franchise;

    // Find the franchise object matching the ID
    const franchiseObj = Array.isArray(franchiseArr)
      ? franchiseArr.find(f => f.id === franchiseId)
      : null;

    // Correct player extraction
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
