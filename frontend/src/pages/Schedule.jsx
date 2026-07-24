import React, { useEffect, useState } from "react";
import { fetchSchedule } from "../utils/api";

export default function Schedule({ leagueId, year }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const data = await fetchSchedule(leagueId, year);

        // MFL returns: { schedule: { weeklySchedule: [...] } }
        if (data && data.schedule && data.schedule.weeklySchedule) {
          setSchedule(data.schedule.weeklySchedule);
        }
      } catch (err) {
        console.error("Failed to load schedule:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) return <div>Loading schedule...</div>;
  if (!schedule) return <div>No schedule data available.</div>;

  return (
    <div className="schedule-page">
      <h1>Schedule</h1>

      {schedule.map((week) => (
        <div key={week.week} className="week-block">
          <h2>Week {week.week}</h2>

          {week.matchup.map((match, idx) => (
            <div key={idx} className="matchup-row">
              {match.franchise.map((fr) => (
                <div key={fr.id} className="team-row">
                  <div className="team-name">
                    Franchise {fr.id}
                  </div>

                  <div className="team-score">
                    {fr.score}
                  </div>

                  <div className={`team-result ${fr.result}`}>
                    {fr.result}
                  </div>

                  <div className="team-homeaway">
                    {fr.isHome === "1" ? "Home" : "Away"}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}