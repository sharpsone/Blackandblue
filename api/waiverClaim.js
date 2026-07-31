// pages/api/waiverClaim.js
export default async function handler(req, res) {
  const { playerId } = req.query;
  const cookies = req.headers.cookie || "";
  const year = new Date().getFullYear();

  const params = new URLSearchParams({
    TYPE: "waiver",
    L: "19757",
    FRANCHISE_ID: "0012",
    ADD: playerId,
    JSON: 1
  });

  const url = `https://www44.myfantasyleague.com/${year}/import?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Cookie": cookies,
      "Accept": "*/*"
    }
  });

  const text = await response.text();

  try {
    const json = JSON.parse(text);
    res.status(200).json(json);
  } catch {
    res.status(500).json({ error: "Non-JSON response", raw: text });
  }
}
