import { fetch, getYear, buildAuthHeaders } from "./_utils.js";

export default async function handler(req, res) {
  const { L, FRANCHISE_ID, W, STARTERS } = req.query;
  const year = getYear(req);

  if (!L || !FRANCHISE_ID || !W || !STARTERS) {
    return res.status(400).json({ error: "Missing L, FRANCHISE_ID, W, or STARTERS" });
  }

  try {
    const url = `https://api.myfantasyleague.com/${year}/import?TYPE=lineup&L=${L}&W=${W}&FRANCHISE_ID=${FRANCHISE_ID}&STARTERS=${STARTERS}`;

    console.log("LINEUP IMPORT URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      console.error("Lineup import returned non‑JSON:", text);
      return res.status(500).json({ error: "Lineup import returned non‑JSON", raw: text });
    }
  } catch (err) {
    console.error("LINEUP IMPORT ERROR:", err);
    res.status(500).json({ error: "Failed to import lineup" });
  }
}

