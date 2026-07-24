import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

function Schedule({ leagueId, year }) {
  const [schedule, setSchedule] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});

  // ⭐ Format MFL date YYYYMMDD → MM/DD/YYYY
  function formatDate(raw) {
    if (!raw) return "";
    const year = raw.substring(0, 4);
    const month = raw.substring(4, 6);
    const day = raw.substring(6, 8);
    return `${month}/${day}/${year}`;
  }

  // ⭐ Load league info (team names)
  useEffect(() => {
    async function loadLeague() {
      const league = await fetchLeague(leagueId, year);

      const map = {};
      league.franchises.franchise.forEach(f => {
        map[f.id] = f.name;
      });

      setFranchiseMap(map);
    }

    loadLeague();
  }, [leagueId, year]);

  // ⭐ Load schedule
  useEffect(() => {
    async function loadSchedule() {
      const data = await fetchSchedule(leagueId, year);
      setSchedule(data.schedule.week);
    }
    loadSchedule();
  }, [leagueId, year]);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Schedule</h1>

      {schedule.map((week) => (
        <div key={week.week} style={{ marginBottom: "2rem" }}>
          <h2>Week {week.week}</h2>

          {week.matchup.map((m, idx) => {
            const home = franchiseMap[m.home];
            const away = franchiseMap[m.away];

            return (
              <div
                key={idx}
                style={{
                  background: "#111",
                  padding: "1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px"
                }}
              >
                <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  {away} @ {home}
                </div>

                <div>Date: {formatDate(m.date)}</div>

                <div style={{ marginTop: "0.5rem" }}>
                  <strong>{away}</strong>: {m.awayScore} ({m.awayResult})
                </div>
                <div>
                  <strong>{home}</strong>: {m.homeScore} ({m.homeResult})
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Schedule;
v
