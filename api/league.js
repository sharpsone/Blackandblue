import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  const { leagueId } = req.query;
  const year = getYear(req);

  try {
    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=league&L=${leagueId}&JSON=1`;

    console.log("LEAGUE URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("LEAGUE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch league" });
  }
}
