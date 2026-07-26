import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils";

export default async function handler(req, res) {
  const { leagueId } = req.query;
  const year = getYear(req);

  try {
    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=schedule&L=${leagueId}&JSON=1`;

    console.log("SCHEDULE URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    const weeklySchedule =
      raw?.schedule?.weeklySchedule ||
      raw?.weeklySchedule ||
      [];

    return res.json({
      schedule: {
        weeklySchedule
      }
    });
  } catch (err) {
    console.error("SCHEDULE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
}
