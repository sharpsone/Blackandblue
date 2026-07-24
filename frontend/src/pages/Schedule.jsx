import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

// Normalize IDs so "12" becomes "0012"
function normalizeId(id) {
  return id.toString().padStart(4, "0");
}

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

  // Load league info (team names + logos)
  useEffect(() => {
    async function loadLeague() {
      const league = await fetchLeague(leagueId, year);

      const map = {};
      if (league?.franchises?.franchise) {
        league.franchises.franchise.forEach(f => {
          const normalized = normalizeId(f.id);
          map[normalized] = {
            name: f.name,
            logo: f.icon || null
          };
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
      <h1 style={{ marginBottom: "1rem" }}>Schedule</h1>

      {weeks.map((weekObj, idx) => {
        const matchups = weekObj.matchup || [];

        return (
          <div key={idx} style={{ marginBottom: "2rem" }}>
            {/* ⭐ WEEK DIVIDER */}
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: "bold",
                padding: "0.5rem 0",
                borderBottom: "2px solid #444",
                marginBottom: "1rem"
              }}
            >
              Week {weekObj.week}
            </div>

            {matchups.map((m, mIdx) => {
              const home = m.franchise[1];
              const away = m.franchise[0];

              const homeInfo = franchiseMap[normalizeId(home.id)] || {};
              const awayInfo = franchiseMap[normalizeId(away.id)] || {};

              const homeName = homeInfo.name || `Franchise ${home.id}`;
              const awayName = awayInfo.name || `Franchise ${away.id}`;

              const homeScore = home.score;
              const awayScore = away.score;

              const homeResult = home.result;
              const awayResult = away.result;

              const homeLogo = homeInfo.logo;
              const awayLogo = awayInfo.logo;

              // ⭐ Winner highlight
              const homeColor = homeResult === "W" ? "#0f0" : "#f44";
              const awayColor = awayResult === "W" ? "#0f0" : "#f44";

              return (
                <div
                  key={mIdx}
                  style={{
                    background: "#111",
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}
                >
                  {/* ⭐ Matchup header */}
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    {awayName} @ {homeName}
                  </div>

                  {/* ⭐ Logos */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {awayLogo && (
                      <img
                        src={awayLogo}
                        alt={awayName}
                        style={{ width: "40px", height: "40px", borderRadius: "6px" }}
                      />
                    )}
                    {homeLogo && (
                      <img
                        src={homeLogo}
                        alt={homeName}
                        style={{ width: "40px", height: "40px", borderRadius: "6px" }}
                      />
                    )}
                  </div>

                  {/* ⭐ Date */}
                  {m.date && (
                    <div style={{ opacity: 0.7 }}>Date: {formatDate(m.date)}</div>
                  )}

                  {/* ⭐ Scores */}
                  <div style={{ marginTop: "0.5rem" }}>
                    <strong style={{ color: awayColor }}>{awayName}</strong>:{" "}
                    {awayScore} ({awayResult})
                  </div>
                  <div>
                    <strong style={{ color: homeColor }}>{homeName}</strong>:{" "}
                    {homeScore} ({homeResult})
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
