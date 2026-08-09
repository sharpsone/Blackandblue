console.log("🔥 Schedule.jsx mounted");
console.log("🔥 leagueInfo:", leagueInfo);
console.log("🔥 leagueId:", leagueId);
console.log("🔥 year:", year);

import { useEffect, useState } from "react";
import "../pages/schedule.css";

export default function Schedule({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const year = leagueInfo?.year || 2026;

  const [schedule, setSchedule] = useState([]);
  const [franchises, setFranchises] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      console.log("📅 Fetching schedule...");
      const schedRes = await fetch(
        `/api/mfl?action=schedule&leagueId=${leagueId}&year=${year}`
      );
      const schedData = await schedRes.json();
      console.log("📅 Schedule response:", schedData);

      if (!schedData?.schedule?.weeklySchedule) {
        console.log("❌ weeklySchedule missing in frontend");
        return;
      }

      const weeks = schedData.schedule.weeklySchedule.map(weekObj => {
        const week = parseInt(weekObj.week, 10);

        const matchups = weekObj.matchup.map(m => {
          const [f1, f2] = m.franchise;

          const home = f1.isHome === "1" ? f1 : f2;
          const away = f1.isHome === "1" ? f2 : f1;

          return {
            home: {
              id: home.id,
              name: franchises[home.id] || home.id,
              spread: Number(home.spread)
            },
            away: {
              id: away.id,
              name: franchises[away.id] || away.id,
              spread: Number(away.spread)
            }
          };
        });

        return { week, matchups };
      });

      setSchedule(weeks);

    } catch (err) {
      console.error("SCHEDULE ERROR:", err);
    }

    setLoading(false);
  }

  if (loading) return <p>Loading schedule...</p>;

  return (
    <div className="schedule-container">
      <h1 className="schedule-title">League Schedule</h1>

      {schedule.map(week => (
        <div key={week.week} className="schedule-week">
          <h2 className="week-title">Week {week.week}</h2>

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
