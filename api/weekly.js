import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  const { leagueId, franchise, week } = req.query;
  const year = getYear(req);

  if (!leagueId || !franchise || !week) {
    return res.status(400).json({ error: "Missing leagueId, franchise, or week" });
  }

  try {
    const host = await detectMFLHost(year, leagueId, req);

    const url = `https://${host}/${year}/export?TYPE=weeklyResults&L=${leagueId}&W=${week}&FRANCHISE=${franchise}&JSON=1`;

    console.log("WEEKLY URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const text = await response.text();

    // Some MFL responses are JSON but served as text
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      console.error("Weekly returned non‑JSON:", text);
      return res.status(500).json({ error: "Weekly returned non‑JSON", raw: text });
    }
  } catch (err) {
    console.error("WEEKLY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch weekly results" });
  }
}
