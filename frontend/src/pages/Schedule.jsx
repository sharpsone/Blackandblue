import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";
import "./schedule.css";

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

// Determine game status
function getGameStatus(awayScore, homeScore, dateRaw) {
  if (awayScore && homeScore) return "Final";

  const today = new Date();
  const gameDate = new Date(
    `${dateRaw.substring(0, 4)}-${dateRaw.substring(4, 6)}-${dateRaw.substring(6, 8)}`
  );

  if (gameDate > today) return "Scheduled";
  return "In Progress";
}

function Schedule({ leagueId, year }) {
  const [weeks, setWeeks] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Load franchise names + logos
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
      const weekly = data?.schedule?.weeklySchedule || [];
      setWeeks(weekly);

      if (weekly.length > 0) {
        setSelectedWeek(weekly[0].week);
      }

      setLoading(false);
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) return <div style={{ padding: "1rem" }}>Loading schedule...</div>;
  if (!weeks.length) return <div style={{ padding: "1rem" }}>No schedule data found.</div>;

  const filteredWeeks = weeks.filter(w => w.week === selectedWeek);

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Schedule</h1>

      {/* ⭐ Week Selector */}
      <div className="week-selector">
        {weeks.map(w => (
          <button
            key={w.week}
            className={`week-button ${selectedWeek === w.week ? "active-week" : ""}`}
            onClick={() => setSelectedWeek(w.week)}
          >
            W{w.week}
          </button>
        ))}
      </div>

      {/* ⭐ Selected Week Display */}
      {filteredWeeks.map((weekObj, idx) => (
        <div key={idx} style={{ marginBottom: "2rem" }}>
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

            const status = getGameStatus(away.score, home.score, m.date);

            return (
              <div key={mIdx} className="matchup-card">

                {/* ⭐ Game Status */}
                <div className={`game-status status-${status.toLowerCase()}`}>
                  {status}
                </div>

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

                {/* Matchup Summary */}
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
