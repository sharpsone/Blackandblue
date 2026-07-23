import { useEffect, useState } from "react";
import TeamCard from "../components/TeamCard";
import { fetchLeague, fetchStandings } from "../utils/api";
import "../utils/animations.css";

export default function Standings({ leagueId, myFranchiseId, year }) {
  const [teams, setTeams] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [error, setError] = useState(null);

  // ⭐ Re-run standings whenever leagueId or year changes
  useEffect(() => {
    loadStandings();
  }, [leagueId, year]);

  async function loadStandings() {
    try {
      // ⭐ Pass year to backend API
      const standingsJson = await fetchStandings(leagueId, year);
      const leagueJson = await fetchLeague(leagueId, year);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const divisionList = leagueJson.league.divisions?.division || [];
      const conferenceList = leagueJson.league.conferences?.conference || [];

      const nameMap = {};
      const divisionIdMap = {};
      const conferenceIdMap = {};
      const logoMap = {};

      franchiseList.forEach(f => {
        nameMap[f.id] = f.name;
        divisionIdMap[f.id] = f.division;
        conferenceIdMap[f.id] = f.conference;
        logoMap[f.id] = f.icon || null;
      });

      const divisionNameMap = {};
      divisionList.forEach(d => {
        divisionNameMap[d.id] = d.name;
      });

      const conferenceNameMap = {};
      conferenceList.forEach(c => {
        conferenceNameMap[c.id] = c.name;
      });

      const merged = standingsJson.leagueStandings.franchise.map(team => {
        const id = team.id;
        const name = nameMap[id] || id;
        const divisionId = divisionIdMap[id];
        const conferenceId = conferenceIdMap[id];

        const divisionName = divisionNameMap[divisionId] || "";
        const conferenceName = conferenceNameMap[conferenceId] || "";

        const initials = name
          .split(" ")
          .map(w => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3);

        const winPct = team.h2hpct ? parseFloat(team.h2hpct) : 0;

        return {
          ...team,
          name,
          divisionName,
          conferenceName,
          initials,
          winPct,
          logo: logoMap[id],
          isOwner: id === myFranchiseId
        };
      });

      setTeams(merged);
    } catch (err) {
      console.error("STANDINGS ERROR:", err);
      setError("Failed to load standings");
    }
  }

  function getSortedTeams() {
    const sorted = [...teams];

    sorted.sort((a, b) => {
      let av, bv;

      switch (sortBy) {
        case "pf":
          av = parseFloat(a.pf || "0");
          bv = parseFloat(b.pf || "0");
          break;
        case "pa":
          av = parseFloat(a.pa || "0");
          bv = parseFloat(b.pa || "0");
          break;
        case "winPct":
          av = a.winPct || 0;
          bv = b.winPct || 0;
          break;
        case "name":
        default:
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  function groupTeams(sorted) {
    const groups = {};

    sorted.forEach(team => {
      const conf = team.conferenceName || "Conference";
      const div = team.divisionName || "Division";

      if (!groups[conf]) groups[conf] = {};
      if (!groups[conf][div]) groups[conf][div] = [];

      groups[conf][div].push(team);
    });

    return groups;
  }

  const sortedTeams = getSortedTeams();
  const grouped = groupTeams(sortedTeams);

  return (
    <div style={{ padding: "1rem" }}>
      
      {/* ⭐ Sorting Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <span style={{ color: "#aaa" }}>Sort by:</span>

        {[
          { key: "name", label: "Team" },
          { key: "pf", label: "PF" },
          { key: "pa", label: "PA" },
          { key: "winPct", label: "Win %" }
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => toggleSort(opt.key)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: sortBy === opt.key ? "1px solid #00aaff" : "1px solid #333",
              background: sortBy === opt.key ? "#001f3f" : "#111",
              color: "white",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {opt.label}
            {sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      {/* ⭐ Conference + Division Sections */}
      {Object.keys(grouped).map(conf => (
        <div key={conf} style={{ marginBottom: "2rem" }}>
          
          {/* Conference Header */}
          {conf && (
            <h2
              className="slide-in"
              style={{
                color: "#00aaff",
                background: "#001f3f",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                marginBottom: "1rem"
              }}
            >
              {conf}
            </h2>
          )}

          {Object.keys(grouped[conf]).map(div => (
            <div key={div} style={{ marginBottom: "1.5rem" }}>
              
              {/* Division Header */}
              {div && (
                <h3
                  className="slide-in"
                  style={{
                    color: "#fff",
                    background: "#003566",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    marginBottom: "0.75rem"
                  }}
                >
                  {div}
                </h3>
              )}

              {grouped[conf][div].map((team, index) => (
                <TeamCard key={team.id} team={team} seed={index + 1} />
              ))}
            </div>
          ))}
        </div>
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
