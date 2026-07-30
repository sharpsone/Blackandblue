import xml2js from "xml2js";

export default async function handler(req, res) {
  console.log("MYLEAGUES API HIT");

  const username = req.cookies.MFL_USERNAME;
  const password = req.cookies.MFL_PASSWORD;
  const year = req.cookies.MFL_YEAR;

  if (!username || !password || !year) {
    console.log("❌ Missing auth cookies");
    return res.status(401).json({ error: "Missing auth cookies" });
  }

  // Hardcode league + host (these never change)
  const leagueId = "19757";
  const host = "www44.myfantasyleague.com";

  // Detect franchise ID dynamically
  const url = `https://${host}/${year}/export?TYPE=league&L=${leagueId}&USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("LEAGUE URL:", url);

  const response = await fetch(url);
  const xml = await response.text();

  console.log("RAW LEAGUE XML:", xml);

  const parsed = await xml2js.parseStringPromise(xml);

  const franchiseId = parsed.league?.franchises?.[0]?.franchise?.find(
    f => f.$.owner === username
  )?.$.id;

  if (!franchiseId) {
    console.log("❌ Could not detect franchise ID");
    return res.status(404).json({ error: "Could not detect franchise ID" });
  }

  console.log("DETECTED FRANCHISE ID:", franchiseId);

  return res.status(200).json({
    leagueId,
    franchiseId,
    host
  });
}


