import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

// Extract ID from logo/icon/sound filenames
function extractIdFromAssets(franchise) {
  const fields = ["logo", "icon", "sound"];

  for (const field of fields) {
    const val = franchise[field];
    if (val && typeof val === "string") {
      const match = val.match(/franchise_(?:logo|icon|sound)(\d{4})/);
      if (match) return match[1];
    }
  }

  return franchise.id || null;
}

function Schedule({ leagueId, year }) {
  const [weeks, setWeeks] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

  function formatDate(raw) {
    if (!raw) return "";
    return `${raw.substring(4, 6)}/${raw.substring(6, 8)}/${raw.substring(0, 4)}`;
  }

  // Load league info
  useEffect(() => {
    async function loadLeague() {
      const league = await fetchLeague(leagueId, year);
      console.log("LEAGUE RAW:", league);

      const map = {};

      league?.franchises?.franchise?.forEach(f => {
        const id = extractIdFromAssets(f);
        if (!id) return;

        map[id] = {
          name: f.name || `Franchise ${id}`,
          logo: f.logo || f.icon || null
        };
      });

      setFranchiseMap(map);
    }

    loadLeague();
  }, [leagueId, year]);

  // Load schedule
  useEffect(() => {
    async function loadSchedule() {
      const data = await fetchSchedule(leagueId, year);
      console.log("SCHEDULE RAW:", data);

      setWeeks(data?.schedule?.weeklySchedule || []);
      setLoading(false);
    }

    loadSchedule();
  }, [leagueId, year]);

  if (loading) return <div>Loading schedule...</div>;
  if (!weeks.length) return <div>No schedule data found.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Schedule</h1>

      {weeks.map((weekObj, idx) => (
        <div key={idx} style={{ marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: "bold",
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #444",
              marginBottom: "1rem"
            }}
          >
            Week {weekObj.week}
          </div>

          {weekObj.matchup.map((m, mIdx) => {
            const away = m.franchise[0];
            const home = m.franchise[1];

            const awayInfo = franchiseMap[away.id] || {};
            const homeInfo = franchiseMap[home.id] || {};

            const awayColor = away.result === "W" ? "#0f0" : "#f44";
            const homeColor = home.result === "W" ? "#0f0" : "#f44";

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
                <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                  {awayInfo.name} @ {homeInfo.name}
                </div>

                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {awayInfo.logo && (
                    <img src={awayInfo.logo} alt="" style={{ width: 40, height: 40 }} />
                  )}
                  {homeInfo.logo && (
                    <img src={homeInfo.logo} alt="" style={{ width: 40, height: 40 }} />
                  )}
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <strong style={{ color: awayColor }}>{awayInfo.name}</strong>:{" "}
                  {away.score} ({away.result})
                </div>
                <div>
                  <strong style={{ color: homeColor }}>{homeInfo.name}</strong>:{" "}
                  {home.score} ({home.result})
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
