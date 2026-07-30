// src/pages/api/myleagues.js

export default async function handler(req, res) {
  console.log("MYLEAGUES API HIT — HARD CODED VALUES");

  // We ignore cookies, XML, host detection, franchise detection.
  // This is a diagnostic version to PROVE the rest of your app works.

  return res.status(200).json({
    leagueId: "19757",          // ✔ Your league ID (never changes)
    franchiseId: "0012",        // ✔ TEMPORARY hardcoded franchise
    host: "www44.myfantasyleague.com", // ✔ Your league host (never changes)
    year: 2026                  // ✔ Your league year
  });
}
// test