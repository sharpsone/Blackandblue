// scripts/fetchSchedule.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const YEAR = 2026;
const BASE = `https://api.myfantasyleague.com/fflnetdynamic${YEAR}`;

async function fetchWeek(week) {
  const url = `${BASE}/nfl_sched_${week}.json`;
  console.log("Fetching", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed week ${week}: ${resp.status}`);
  }

  const json = await resp.json();

  const outDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `nflScheduleWeek${week}.json`);
  fs.writeFileSync(outFile, JSON.stringify(json, null, 2), "utf8");

  console.log("Saved", outFile);
}

async function main() {
  for (let w = 1; w <= 18; w++) {
    try {
      await fetchWeek(w);
    } catch (err) {
      console.error("Error on week", w, err.message);
    }
  }
}

main();
