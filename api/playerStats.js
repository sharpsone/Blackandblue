// pages/api/playerStats.js
export default async function handler(req, res) {
  const { playerId } = req.query;
  const cookies = req.headers.cookie || "";
  const year = new Date().getFullYear();

  const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=playerScores&L=19757&JSON=1&PLAYERS=${playerId}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Cookie": cookies,
      "Accept": "*/*"
    }
  });

  const data = await response.json();

  const scores = data.playerScores?.playerScore || [];

  const weekly = scores.map((w) => Number(w.score || 0));

  const avg =
    weekly.length > 0
      ? (weekly.reduce((a, b) => a + b, 0) / weekly.length).toFixed(1)
      : 0;

  const last3 =
    weekly.slice(-3).reduce((a, b) => a + b, 0).toFixed(1);

  res.status(200).json({
    weekly,
    avg,
    last3,
    rank: data.playerScores?.playerScore?.[0]?.rank || null
  });
}
