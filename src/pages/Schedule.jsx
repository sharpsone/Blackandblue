import { useEffect, useState } from "react";
import "../pages/schedule.css";
import { getLeagueInfo } from "../utils/api";   // ⭐ FIXED
//test
export default function Schedule({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const year = leagueInfo?.year || 2026;

  const [schedule, setSchedule] = useState([]);
  const [franchises, setFranchises] = useState({});
  const [loading, setLoading] = useState(true);

  console.log("🔥 Schedule.jsx mounted");
  console.log("🔥 leagueInfo:", leagueInfo);

  useEffect(() => {
    console.log("🔥 useEffect running");
    loadFranchisesFromLeagueInfo();
  }, []);

  useEffect(() => {
    if (Object.keys(franchises).length > 0) {
      loadSchedule();   // ⭐ Only load schedule AFTER franchise names are ready
    }
  }, [franchises]);

  async function loadFranchisesFromLeagueInfo() {
    try {
      const leagueJson = await getLeagueInfo(leagueId, year);
      const franchiseList = leagueJson.league.franchises.franchise || [];

      const map = {};
      franchiseList.forEach(f => {
        map[f.id] = f.name || `Franchise ${f.id}`;
      });

      console.log("📣 Franchise map:", map);
      setFranchises(map);
    } catch (err) {
      console.error("FRANCHISE LOAD ERROR:", err);
    }
  }

  async function loadSchedule() {
    try {
      console.log("📅 Fetching schedule...");
      const schedRes = await fetch(
        `/api/mfl?action=schedule&leagueId=${leagueId}&year=${year}`
      );
      const schedData = await schedRes.json();
      console.log("📅 Schedule response:", schedData);

      const weekly = schedData?.schedule?.weeklySchedule;

      if (!Array.isArray(weekly)) {
        console.log("❌ weeklySchedule is not an array");
        return;
      }

      const weeks = weekly.map((weekObj, index) => {
      const realWeek = index + 1;   // ⭐ index 13 = Week 14

      // ⭐ REGULAR SEASON: indices 0–13
      if (index <= 13) {
        if (!Array.isArray(weekObj.matchup)) {
          return {
            week: realWeek,
            matchups: [],
            note: "Matchups not yet available for this regular season week."
          };
        }

        const matchups = weekObj.matchup.map(m => {
          const [f1, f2] = m.franchise;

          const home = f1.isHome === "1" ? f1 : f2;
          const away = f1.isHome === "1" ? f2 : f1;

          return {
            home: {
              id: home.id,
              name: franchises[home.id] || `Team ${home.id}`,
              spread: Number(home.spread)
            },
            away: {
              id: away.id,
              name: franchises[away.id] || `Team ${away.id}`,
              spread: Number(away.spread)
            }
          };
        });

        return { week: realWeek, matchups };
      }

      // ⭐ PLAYOFFS: indices 14–16
      return {
        week: realWeek,
        matchups: [],
        note:
          realWeek === 15
            ? "Week 15: Playoffs begin. View the Playoff Bracket for matchups."
            : realWeek === 16
            ? "Week 16: Playoff semifinals. View the Playoff Bracket."
            : "Week 17: Championship week. View the Playoff Bracket."
      };
    });

      setSchedule(weeks);
      setLoading(false);
    } catch (err) {
      console.error("SCHEDULE ERROR:", err);
      setLoading(false);
    }
  }

  if (loading) return <p>Loading schedule...</p>;

  return (
    <div className="schedule-container">
      <h1 className="schedule-title">League Schedule</h1>

      {schedule.map(week => (
        <div key={week.week} className="schedule-week">
          <h2 className="week-title">Week {week.week}</h2>

          {week.note && (
            <div className="week-note">{week.note}</div>
          )}

          <div className="matchup-list">
            {week.matchups.map((m, idx) => (
              <div key={idx} className="matchup-card">
                <div className="team-row">
                  <span className="team-name">{m.home.name}</span>
                  <span className="vs">vs</span>
                  <span className="team-name">{m.away.name}</span>
                </div>

                <div className="spread-row">
                  Spread: <strong>{m.home.spread}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
