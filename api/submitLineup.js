import { fetch, getYear } from "./_utils.js";

export default async function handler(req, res) {
  const { L, FRANCHISE_ID, W, STARTERS } = req.query;
  const year = getYear(req);

  if (!L || !FRANCHISE_ID || !W || !STARTERS) {
    return res.status(400).json({ error: "Missing L, FRANCHISE_ID, W, or STARTERS" });
  }

  try {
    const url = `https://api.myfantasyleague.com/${year}/import?TYPE=lineup&L=${L}&W=${W}&FRANCHISE_ID=${FRANCHISE_ID}&STARTERS=${STARTERS}`;

    // ⭐ FIX: forward ALL cookies manually
    const cookieHeader = Object.entries(req.cookies || {})
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    console.log("FORWARDED COOKIES:", cookieHeader);
    console.log("REQ.COOKIE OBJECT:", req.cookies);

    const response = await fetch(url, {
      headers: {
        Cookie: cookieHeader
      }
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
