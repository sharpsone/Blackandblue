import xml2js from "xml2js";

export default async function handler(req, res) {
  console.log("MYLEAGUES API HIT");

  const username = req.cookies.MFL_USERNAME;
  const password = req.cookies.MFL_PASSWORD;
  const year = req.cookies.MFL_YEAR;

  console.log("USING USERNAME:", username);
  console.log("USING PASSWORD:", password);
  console.log("USING YEAR:", year);

  if (!username || !password || !year) {
    console.log("❌ Missing auth cookies");
    return res.status(401).json({ error: "Missing auth cookies" });
  }

  const url = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("MYLEAGUES URL:", url);

  const response = await fetch(url);
  const xml = await response.text();

  console.log("RAW MYLEAGUES XML:", xml);

  const parsed = await xml2js.parseStringPromise(xml);

  // Correct root: <leagues>
  const leagues = parsed.leagues?.league;

  if (!leagues || leagues.length === 0) {
    console.log("❌ No leagues found for user");
    return res.status(404).json({ error: "No leagues found" });
  }

  const league = leagues[0].$;

  const leagueId = league.league_id;
  const franchiseId = league.franchise_id;
  const host = league.url.split("/")[2]; // www44.myfantasyleague.com

  console.log("DETECTED LEAGUE ID:", leagueId);
  console.log("DETECTED FRANCHISE ID:", franchiseId);
  console.log("DETECTED HOST:", host);

  return res.status(200).json({
    leagueId,
    franchiseId,
    host,
  });
}

