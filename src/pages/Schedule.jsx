import { useEffect, useState } from "react";
import "../pages/schedule.css";

export default function Schedule({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const year = leagueInfo?.year || 2026;

  const [schedule, setSchedule] = useState([]);
  const [franchises, setFranchises] = useState({});
  const [loading, setLoading] = useState(true);

  console.log("🔥 Schedule.jsx mounted");
  console.log("🔥 leagueInfo:", leagueInfo);
  console.log("🔥 leagueId:", leagueId);
  console.log("🔥 year:", year);

  useEffect(() => {
    console.log("🔥 useEffect running");
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

      const scheduleRoot = schedData?.schedule;
      if (!scheduleRoot) {
        console.log("❌ No schedule object returned");
        return;
      }

      // CASE 1: weeklySchedule.week exists (multi-week or single-week)
      if (scheduleRoot.weeklySchedule?.week) {
        console.log("📅 Using weeklySchedule.week format");

        const rawWeeks = scheduleRoot.weeklySchedule.week;
        const weekArray = Array.isArray(rawWeeks) ? rawWeeks : [rawWeeks];

        const weeks = weekArray.map(weekObj => {
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
        setLoading(false);
        return;
      }

      // CASE 2: schedule.matchup exists (flat list)
      if (scheduleRoot.matchup) {
        console.log("📅 Using schedule.matchup flat format");

        const grouped = {};

        scheduleRoot.matchup.forEach(m => {
          const week = parseInt(m.week, 10);
          if (!grouped[week]) grouped[week] = [];

          const [f1, f2] = m.franchise;
          const home = f1.isHome === "1" ? f1 : f2;
          const away = f1.isHome === "1" ? f2 : f1;

          grouped[week].push({
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
          });
        });

        const weeks = Object.keys(grouped).map(week => ({
          week: Number(week),
          matchups: grouped[week]
        }));

        setSchedule(weeks);
        setLoading(false);
        return;
      }

      console.log("❌ No recognizable schedule format");

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
