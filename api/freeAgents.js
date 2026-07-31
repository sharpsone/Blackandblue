// pages/api/freeAgents.js
export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";
  const year = new Date().getFullYear();

  const url = `https://www44.myfantasyleague.com/${year}/export?TYPE=freeAgents&L=19757&JSON=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Cookie": cookies,
      "Accept": "*/*"
    }
  });

  const data = await response.json();

  // Normalize players
  const players = (data.freeAgents || []).map((p) => ({
    id: p.id,
    name: p.name,
    pos: p.position,
    team: p.team,
    rank: null, // filled later
    avg: null   // filled later
  }));

  res.status(200).json({ players });
}
