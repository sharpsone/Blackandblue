import { useEffect, useState } from "react";
import { fetchSchedule, fetchLeague } from "../utils/api";

// Extract franchise ID from logo/icon/sound filenames OR fallback to f.id
function extractIdFromAssets(franchise) {
  const fields = ["logo", "icon", "sound"];

  for (const field of fields) {
    const val = franchise[field];
    if (val && typeof val === "string") {
      const match = val.match(/franchise_(?:logo|icon|sound)(\d{4})/);
      if (match) return match[1]; // return the 4-digit ID
    }
  }

  return franchise.id || null;
}

// Extract franchise name from multiple possible fields
function extractName(franchise, id) {
  if (franchise.name) return franchise.name;
  if (franchise.franchiseName) return franchise.franchiseName;
  if (franchise.owner_name) return franchise.owner_name;
  if (franchise.username) return franchise.username;
  if (franchise.abbrev) return franchise.abbrev;

  // Derive name from logo/icon filename if needed
  const fields = ["logo", "icon"];
  for (const field of fields) {
    const val = franchise[field];
    if (val && typeof val === "string") {
      const match = val.match(/franchise_logo(\d{4})/);
      if (match) return `Franchise ${match[1]}`;
    }
  }

  return `Franchise ${id}`;
}

// Format YYYYMMDD → MM/DD/YYYY
function formatDate(raw) {
  if (!raw) return "";
  return `${raw.substring(4, 6)}/${raw.substring(6, 8)}/${raw.substring(0, 4)}`;
}

function Schedule({ leagueId, year }) {
  const [weeks, setWeeks] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Load league info (team names + logos)
  useEffect(() => {
    async function loadLeague() {
      const league = await fetchLeague(leagueId, year);
      console.log("LEAGUE RAW:", league);

      const map = {};

      league?.franchises?.franchise?.forEach(f => {
        const id = extractIdFromAssets(f);
        if (!id) return;

        const name = extractName(f, id);
        const logo = f.logo || f.icon || null;

        map[id] = { name, logo };
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

  if (loading) return <div style={{ padding: "1rem" }}>Loading schedule...</div>;
  if (!weeks.length) return <div style={{ padding: "1rem" }}>No schedule data found.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Schedule</h1>

      {weeks.map((weekObj, idx) => (
        <div key={idx} style={{ marginBottom: "2rem" }}>
          {/* ⭐ WEEK DIVIDER */}
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

            const awayName = awayInfo.name || `Franchise ${away.id}`;
            const homeName = homeInfo.name || `Franchise ${home.id}`;

            const awayLogo = awayInfo.logo;
            const homeLogo = homeInfo.logo;

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
                      style={{ width: 40, height: 40, borderRadius: "6px" }}
                    />
                  )}
                  {homeLogo && (
                    <img
                      src={homeLogo}
                      alt={homeName}
                      style={{ width: 40, height: 40, borderRadius: "6px" }}
                    />
                  )}
                </div>

                {/* ⭐ Date */}
                {m.date && (
                  <div style={{ opacity: 0.7, marginTop: "0.5rem" }}>
                    Date: {formatDate(m.date)}
                  </div>
                )}

                {/* ⭐ Scores */}
                <div style={{ marginTop: "0.5rem" }}>
                  <strong style={{ color: awayColor }}>{awayName}</strong>:{" "}
                  {away.score} ({away.result})
                </div>
                <div>
                  <strong style={{ color: homeColor }}>{homeName}</strong>:{" "}
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
