import { fetch, getYear, buildAuthHeaders } from "./_utils";

export default async function handler(req, res) {
  const year = getYear(req);

  try {
    const url = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&JSON=1`;

    console.log("MYLEAGUES URL:", url);

    const response = await fetch(url, {
      headers: buildAuthHeaders(req)
    });

    const data = await response.json();

    return res.json(data);
  } catch (err) {
    console.error("MYLEAGUES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch my leagues" });
  }
}
