import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  const year = getYear(req);

  try {
    const host = await detectMFLHost(year, null, req);

    const url = `https://${host}/${year}/export?TYPE=players&DETAILS=1&JSON=1`;

    console.log("PLAYERS URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const raw = await response.json();

    const players = raw?.players?.player || [];

    return res.json({ players });
  } catch (error) {
    console.error("PLAYERS BACKEND ERROR:", error);
    res.status(500).json({ error: "Failed to fetch players" });
  }
}
