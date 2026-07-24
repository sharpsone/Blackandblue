import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";
import "./schedule.css"; // correct path for your structure

// Format YYYYMMDD → MM/DD/YYYY
function formatDate(raw) {
  if (!raw) return "";
  return `${raw.substring(4, 6)}/${raw.substring(6, 8)}/${raw.substring(0, 4)}`;
}

// Generate initials (Sleeper-style)
function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function Schedule({ leagueId, year }) {
  const [weeks, setWeeks] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Load franchise names + logos from fetchLeague (same as Standings)
  useEffect(() => {
    async function loadFranchises() {
      const leagueJson = await fetchLeague(leagueId, year);

      const franchiseList = leagueJson.league.franchises.franchise || [];

      const map = {};
      franchiseList.forEach(f => {
        map[f.id] = {
          name: f.name || `Franchise ${f.id}`,
          logo: f.icon || null,
          initials: getInitials(f.name)
        };
      });

      setFranchiseMap(map);
    }

    loadFranchises();
  }, [leagueId, year]);

  // Load schedule
  useEffect(() => {
    async function loadSchedule() {
      const data = await fetchSchedule(leagueId, year);
      setWeeks(data?.schedule?.weeklySchedule || []);
      setLoading(false);
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) return <div style={{ padding: "1rem" }}>Loading schedule...</div>;
  if (!weeks.length) return <div style={{ padding: "1rem" }}>No schedule data found.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Schedule</h1>

      {weeks.map((weekObj, idx) => (
        <div key={idx} style={{ marginBottom: "2rem" }}>
          
          {/* WEEK HEADER */}
          <div className="week-header">WEEK {weekObj.week}</div>

          {weekObj.matchup.map((m, mIdx) => {
            const away = m.franchise[0];
            const home = m.franchise[1];

            const awayInfo = franchiseMap[away.id] || {};
            const homeInfo = franchiseMap[home.id] || {};

            const awayName = awayInfo.name;
            const homeName = homeInfo.name;

            const awayLogo = awayInfo.logo;
            const homeLogo = homeInfo.logo;

            const awayInitials = awayInfo.initials;
            const homeInitials = homeInfo.initials;

            const awayWinner = away.result === "W";
            const homeWinner = home.result === "W";

            return (
              <div key={mIdx} className="matchup-card">
                
                {/* Away Team Row */}
                <div className="team-row">
                  <div className="team-info">
                    {awayLogo ? (
                      <img src={awayLogo} className="team-logo" alt={awayName} />
                    ) : (
                      <div className="initials-badge">{awayInitials}</div>
                    )}
                    <span className="team-name">{awayName}</span>
                  </div>

                  <div
                    className="team-score"
                    style={{
                      color: awayWinner ? "#00ff00" : "#ff4444",
                      fontWeight: awayWinner ? "bold" : "normal"
                    }}
                  >
                    {away.score} ({away.result})
                  </div>
                </div>

                {/* Home Team Row */}
                <div className="team-row">
                  <div className="team-info">
                    {homeLogo ? (
                      <img src={homeLogo} className="team-logo" alt={homeName} />
                    ) : (
                      <div className="initials-badge">{homeInitials}</div>
                    )}
                    <span className="team-name">{homeName}</span>
                  </div>

                  <div
                    className="team-score"
                    style={{
                      color: homeWinner ? "#00ff00" : "#ff4444",
                      fontWeight: homeWinner ? "bold" : "normal"
                    }}
                  >
                    {home.score} ({home.result})
                  </div>
                </div>

                {/* Matchup Summary (completed games only) */}
                {away.score && home.score && (
                  <div className="match-summary">
                    {awayWinner
                      ? `${awayName} beat ${homeName} by ${(away.score - home.score).toFixed(2)} points`
                      : `${homeName} beat ${awayName} by ${(home.score - away.score).toFixed(2)} points`}
                  </div>
                )}

                {/* Date */}
                {m.date && (
                  <div className="match-date">Date: {formatDate(m.date)}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Schedule;
