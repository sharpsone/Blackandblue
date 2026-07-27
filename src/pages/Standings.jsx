//updated 7/26/26
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

export default function Standings({ leagueId, myFranchiseId, year }) {
  const [rows, setRows] = useState([]);
  const [franchiseMap, setFranchiseMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Load franchise names + logos
  useEffect(() => {
    async function loadFranchises() {
      const leagueJson = await getLeagueInfo(leagueId, year);
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

  return (
    <div className="standings-container">
      <h1 className="standings-title">Standings</h1>

      <div className="standings-table">
        <div className="standings-header">
          <span className="col-team">Team</span>
          <span className="col-wl">W</span>
          <span className="col-wl">L</span>
          <span className="col-pf">PF</span>
          <span className="col-pa">PA</span>
          <span className="col-strk">Streak</span>
        </div>

        {rows.map(fr => {
          const info = franchiseMap[fr.id] || {};
          const name = info.name || fr.id;
          const logo = info.logo;
          const initials = info.initials;

          const [wins, losses] = fr.h2hwlt?.split("-") || ["0", "0"];
          const pf = fr.pf || "0";
          const pa = fr.pa || "0";
          const streak = fr.strk || "-";

          const isMe = fr.id === String(myFranchiseId);

          return (
            <div
              key={fr.id}
              className={`standings-row ${isMe ? "highlight" : ""}`}
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
              <span className="col-strk">{streak}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
