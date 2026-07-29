import { fetch, getYear, buildAuthHeaders } from "./_utils.js";

export default async function handler(req, res) {
  const { TYPE, L, FRANCHISE } = req.query;
  const year = getYear(req);

  if (!TYPE || !L || !FRANCHISE) {
    return res.status(400).json({ error: "Missing TYPE, L, or FRANCHISE" });
  }

  try {
    // submitLineup must go to api.myfantasyleague.com
    const url = `https://api.myfantasyleague.com/${year}/export?TYPE=${TYPE}&L=${L}&FRANCHISE=${FRANCHISE}&JSON=1`;

    console.log("SUBMIT URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      console.error("SubmitLineup returned non‑JSON:", text);
      return res
        .status(500)
        .json({ error: "SubmitLineup returned non‑JSON", raw: text });
    }
  } catch (err) {
    console.error("SUBMITLINEUP ERROR:", err);
    res.status(500).json({ error: "Failed to submit lineup" });
  }
}

