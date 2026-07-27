// Optional fallback names (used only if league info missing)
const CONFERENCE_NAMES = {
  "00": "Black Conference",
  "01": "Blue Conference"
};

const DIVISION_NAMES = {
  "00": "Black East",
  "01": "Black West",
  "02": "Blue North",
  "03": "Blue South"
};

import { useEffect, useState } from "react";
import { getStandings, getLeagueInfo } from "../utils/api";
import "./standings.css";

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

// Normalize franchise IDs so highlight works
function normalize(id) {
  if (!id) return "";
  return id.toString().padStart(4, "0");
}

export default function Standings({ leagueId, myFranchiseId, year }) {
  const [rows, setRows] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("wins");
  const [sortDir, setSortDir] = useState("desc");

  // Load franchise names + logos + conference + division
  useEffect(() => {
    async function loadFranchises() {
      const leagueJson = await getLeagueInfo(leagueId, year);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const conferenceList = leagueJson.league.conferences?.conference || [];
      const divisionList = leagueJson.league.divisions?.division || [];

      // Build lookup maps from league info
      const conferenceLookup = {};
      const divisionLookup = {};
      const divisionToConference = {};

      conferenceList.forEach(c => {
        conferenceLookup[c.id] = c.name;
      });

      divisionList.forEach(d => {
        divisionLookup[d.id] = d.name;
        divisionToConference[d.id] = d.conference;
      });

      // Build franchise map
      const map = {};
      franchiseList.forEach(f => {
        const divisionId = f.division;
        const conferenceId = divisionToConference[divisionId];

        map[f.id] = {
          name: f.name || `Franchise ${f.id}`,
          logo: f.icon || null,
          initials: getInitials(f.name),
          division:
            divisionLookup[divisionId] ||
            DIVISION_NAMES[divisionId] ||
            "Unknown Division",
          conference:
            conferenceLookup[conferenceId] ||
            CONFERENCE_NAMES[conferenceId] ||
            "Unknown Conference"
        };
      });

      setFranchiseMap(map);
    }

    loadFranchises();
  }, [leagueId, year]);

  // Load standings
  useEffect(() => {
    async function loadStandings() {
      setLoading(true);

      try {
        const data = await getStandings(leagueId, year);
        const list = data?.leagueStandings?.franchise || [];
        setRows(list);
      } catch (err) {
        console.error("STANDINGS ERROR:", err);
      }

      setLoading(false);
    }

    loadStandings();
  }, [leagueId, year]);

  if (loading) {
    return <div className="loading">Loading standings...</div>;
  }

  if (!rows.length) {
    return (
      <div className="loading" style={{ color: "red" }}>
        Could not load standings.
      </div>
    );
  }

  // Sorting logic
  function sortTeams(teams) {
    return [...teams].sort((a, b) => {
      const [aw, al] = a.h2hwlt.split("-").map(Number);
      const [bw, bl] = b.h2hwlt.split("-").map(Number);

      const stats = {
        wins: aw - bw,
        losses: bl - al,
        pf: Number(a.pf) - Number(b.pf),
        pa: Number(a.pa) - Number(b.pa),
        pct: (aw / (aw + al || 1)) - (bw / (bw + bl || 1))
      };

      const val = stats[sortKey];
      return sortDir === "desc" ? -val : val;
    });
  }

  // Group by conference → division
  const grouped = {};

  rows.forEach(fr => {
    const info = franchiseMap[fr.id] || {};
    const conf = info.conference;
    const div = info.division;

    if (!grouped[conf]) grouped[conf] = {};
    if (!grouped[conf][div]) grouped[conf][div] = [];

    grouped[conf][div].push(fr);
  });

  return (
    <div className="standings-container fade-in">
      <h1 className="standings-title">Standings</h1>

      {Object.entries(grouped).map(([conference, divisions]) => (
        <div key={conference} className="conference-block">

          {/* Conference Banner */}
          <div className="conference-banner">
            <span className="conference-name">{conference}</span>
          </div>

          {Object.entries(divisions).map(([division, teams]) => (
            <div key={division} className="division-block">

              {/* Division Banner */}
              <div className="division-banner">
                <span className="division-name">{division}</span>
              </div>

              <div className="standings-table">

                {/* Sortable Header */}
                <div className="standings-header">
                  <span className="col-team">Team</span>

                  <span
                    className="col-wl sortable"
                    onClick={() => {
                      setSortKey("wins");
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    }}
                  >
                    W
                  </span>

                  <span
                    className="col-wl sortable"
                    onClick={() => {
                      setSortKey("losses");
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    }}
                  >
                    L
                  </span>

                  <span
                    className="col-pf sortable"
                    onClick={() => {
                      setSortKey("pf");
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    }}
                  >
                    PF
                  </span>

                  <span
                    className="col-pa sortable"
                    onClick={() => {
                      setSortKey("pa");
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    }}
                  >
                    PA
                  </span>

                  <span
                    className="col-pct sortable"
                    onClick={() => {
                      setSortKey("pct");
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    }}
                  >
                    PCT
                  </span>

                  <span className="col-strk">Streak</span>
                </div>

                {sortTeams(teams).map(fr => {
                  const info = franchiseMap[fr.id] || {};
                  const name = info.name || fr.id;
                  const logo = info.logo;
                  const initials = info.initials;

                  const [wins, losses] = fr.h2hwlt?.split("-") || ["0", "0"];
                  const pf = fr.pf || "0";
                  const pa = fr.pa || "0";
                  const streak = fr.strk || "-";

                  const pct = (wins / (wins + losses || 1)).toFixed(3);

                  const isMe =
                    normalize(fr.id) === normalize(myFranchiseId);

                  return (
                    <div
                      key={fr.id}
                      className={`standings-row ${
                        isMe ? "highlight animated-highlight" : ""
                      }`}
                    >
                      <div className="team-cell">
                        {logo ? (
                          <img src={logo} className="team-logo" alt={name} />
                        ) : (
                          <div className="initials-badge">{initials}</div>
                        )}
                        <span className="team-name">{name}</span>
                      </div>

                      <span className="col-wl">{wins}</span>
                      <span className="col-wl">{losses}</span>
                      <span className="col-pf">{pf}</span>
                      <span className="col-pa">{pa}</span>
                      <span className="col-pct">{pct}</span>
                      <span className="col-strk">{streak}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
