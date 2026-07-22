import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchSchedule, fetchLeague } from "../utils/api";

export default function Schedule({ leagueId }) {
  const [weeks, setWeeks] = useState({});
  const [franchiseNames, setFranchiseNames] = useState({});
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const schedJson = await fetchSchedule(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });
      setFranchiseNames(nameMap);

      const games = schedJson.schedule?.weeklySchedule || [];
      const grouped = {};
      games.forEach(w => {
        const week = w.week;
        grouped[week] = w.matchup || [];
      });

      setWeeks(grouped);

      const allWeeks = Object.keys(grouped).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      if (allWeeks.length > 0) setSelectedWeek(allWeeks[0]);
    } catch (err) {
      console.error("SCHEDULE ERROR:", err);
      setError("Failed to load schedule");
    }
  }

  const weekKeys = Object.keys(weeks).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Schedule
      </h1>

      {/* Week Selector */}
      {weekKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            flexWrap: "wrap"
          }}
        >
          {weekKeys.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                border:
                  selectedWeek === w
                    ? "1px solid #00aaff"
                    : "1px solid #333",
                background: selectedWeek === w ? "#001f3f" : "#111",
                color: "white",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Week {w}
            </button>
          ))}
        </div>
      )}

      {/* Matchups for selected week */}
      {selectedWeek && (weeks[selectedWeek] || []).map((m, idx) => (
        <MatchupRow
          key={idx}
          matchup={m}
          franchiseNames={franchiseNames}
        />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function MatchupRow({ matchup, franchiseNames }) {
  const home = matchup.franchise[0];
  const away = matchup.franchise[1];

  const homeInfo = franchiseNames[home.id] || {};
  const awayInfo = franchiseNames[away.id] || {};

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "0.75rem",
        marginBottom: "0.75rem",
        border: "1px solid #222",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}
    >
      <TeamScheduleCard team={home} info={homeInfo} />
      <TeamScheduleCard team={away} info={awayInfo} />
    </div>
  );
}

function TeamScheduleCard({ team, info }) {
  const { id } = team;
  const { name, logo } = info;

  return (
    <div
      style={{
        flex: "1",
        minWidth: "140px",
        background: "#000814",
        padding: "0.75rem",
        borderRadius: "8px",
        border: "1px solid #333"
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #00aaff",
            marginBottom: "0.5rem"
          }}
        />
      ) : (
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#00aaff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
            color: "black",
            marginBottom: "0.5rem"
          }}
        >
          {name?.[0] || "?"}
        </div>
      )}

      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
        {name || id}
      </div>

      <div style={{ marginTop: "0.25rem" }}>
        <Badge text="Scheduled" color="#00aaff" />
      </div>
    </div>
  );
}
