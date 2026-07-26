import { fetch, getYear, buildAuthHeaders, detectMFLHost } from "./_utils.js";

export default async function handler(req, res) {
  try {
    // Log what the browser actually sent to your backend
    console.log("REQ COOKIES HEADER:", req.headers.cookie);

    // Build the Cookie header that will be forwarded to MFL
    const headers = buildAuthHeaders(req);
    console.log("AUTH HEADERS SENT TO MFL:", headers);

    const { leagueId } = req.query;
    const year = getYear(req);

    const host = await detectMFLHost(year, leagueId);

    const url = `https://${host}/${year}/export?TYPE=standings&L=${leagueId}&JSON=1`;
    console.log("STANDINGS URL:", url);

    const response = await fetch(url, {
      headers
    });

    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("STANDINGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
}
