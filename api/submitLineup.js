import cookie from "cookie";

export default async function handler(req, res) {
  const { TYPE, L, W, FRANCHISE_ID, STARTERS } = req.query;

  // ⭐ Read cookies from the incoming request
  const cookies = req.headers.cookie || "";
  console.log("FORWARDING COOKIES TO MFL:", cookies);

  const url = `https://www44.myfantasyleague.com/2026/import`;

  const params = new URLSearchParams({
    TYPE,
    L,
    W,
    FRANCHISE_ID,
    STARTERS,
    JSON: 1
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Cookie": cookies,          // ⭐ THIS IS THE FIX
      "Accept": "*/*"
    }
  });

  const text = await response.text();
  console.log("MFL RESPONSE:", text);

  try {
    const json = JSON.parse(text);
    return res.status(200).json(json);
  } catch {
    return res.status(500).json({
      error: "Lineup import returned non-JSON",
      raw: text
    });
  }
}
