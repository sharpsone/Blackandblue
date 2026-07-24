import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

function Schedule({ leagueId, year }) {
  const [schedule, setSchedule] = useState(null);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

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
      try {
        const league = await fetchLeague(leagueId, year);

        const map = {};
        if (league?.franchises?.franchise) {
          league.franchises.franchise.forEach(f => {
            map[f.id] = f.name;
          });
        }

        setFranchiseMap(map);
      } catch (err) {
        console.error("LEAGUE LOAD ERROR:", err);
      }
    }

    loadLeague();
  }, [leagueId, year]);

  // ⭐ Load schedule
  useEffect(() => {
    async function loadSchedule() {
      try {
        const data = await fetchSchedule(leagueId, year);
        setSchedule(data?.schedule?.week || []);
      } catch (err) {
        console.error("SCHEDULE LOAD ERROR:", err);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading schedule...</div>;
  }

  if (!schedule || schedule.length === 0) {
    return <div style={{ padding: "1rem" }}>No schedule data found.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Schedule</h1>

      {schedule.map((week) => {
        const matchups = week?.matchup || [];

        return (
          <div key={week.week} style={{ marginBottom: "2rem" }}>
            <h2>Week {week.week}</h2>

            {matchups.length === 0 && (
              <div>No matchups for this week.</div>
            )}

            {matchups.map((m, idx) => {
              const home = franchiseMap[m.home] || `Franchise ${m.home}`;
              const away = franchiseMap[m.away] || `Franchise ${m.away}`;

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
        );
      })}
    </div>
  );
}

export default Schedule;
