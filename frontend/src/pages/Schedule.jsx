import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

function Schedule({ leagueId, year }) {
  const [weeks, setWeeks] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Format YYYYMMDD → MM/DD/YYYY
  function formatDate(raw) {
    if (!raw) return "";
    const y = raw.substring(0, 4);
    const m = raw.substring(4, 6);
    const d = raw.substring(6, 8);
    return `${m}/${d}/${y}`;
  }

  // Load league info (team names)
  useEffect(() => {
    async function loadLeague() {
      const league = await fetchLeague(leagueId, year);

      const map = {};
      if (league?.franchises?.franchise) {
        league.franchises.franchise.forEach(f => {
          map[f.id] = f.name;
        });
      }

      setFranchiseMap(map);
    }

    loadLeague();
  }, [leagueId, year]);

  // Load schedule
  useEffect(() => {
    async function loadSchedule() {
      const data = await fetchSchedule(leagueId, year);
      console.log("SCHEDULE RAW:", data);

      const weeksData = data?.schedule?.weeklySchedule || [];
      setWeeks(weeksData);
      setLoading(false);
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading schedule...</div>;
  }

  if (!weeks.length) {
    return <div style={{ padding: "1rem" }}>No schedule data found.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Schedule</h1>

      {weeks.map((weekObj, idx) => {
        const matchups = weekObj.matchup || [];

        return (
          <div key={idx} style={{ marginBottom: "2rem" }}>
            <h2>Week {weekObj.week}</h2>

            {matchups.map((m, mIdx) => {
              const homeTeam = m.franchise[1];
              const awayTeam = m.franchise[0];

              const homeName = franchiseMap[homeTeam.id] || `Franchise ${homeTeam.id}`;
              const awayName = franchiseMap[awayTeam.id] || `Franchise ${awayTeam.id}`;

              const homeScore = homeTeam.score;
              const awayScore = awayTeam.score;

              const homeResult = homeTeam.result;
              const awayResult = awayTeam.result;

              return (
                <div
                  key={mIdx}
                  style={{
                    background: "#111",
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    {awayName} @ {homeName}
                  </div>

                  {m.date && (
                    <div>Date: {formatDate(m.date)}</div>
                  )}

                  <div style={{ marginTop: "0.5rem" }}>
                    <strong>{awayName}</strong>: {awayScore} ({awayResult})
                  </div>
                  <div>
                    <strong>{homeName}</strong>: {homeScore} ({homeResult})
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
