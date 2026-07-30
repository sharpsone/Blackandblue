import xml2js from "xml2js";

export default async function handler(req, res) {
  console.log("MYLEAGUES API HIT");

  const { username, password, year } = req.cookies;

  const url = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("MYLEAGUES URL:", url);

  const response = await fetch(url);
  const xml = await response.text();

  console.log("RAW MYLEAGUES XML:", xml);

  const parsed = await xml2js.parseStringPromise(xml);

  // FIX: MFL uses <leagues>, not <myleagues>
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

