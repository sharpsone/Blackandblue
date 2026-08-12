import { useState } from "react";
import "./PlayerModal.css";

export default function PlayerModal({
  player,
  onClose,
  onAdd,
  onWaiver,
  fromRoster = false,   // ⭐ NEW FLAG
}) {
  // Prevent crash if player missing
  if (!player || player.loading) return null;

  const isLocked = player.faStatus === "locked";

  const [openNews, setOpenNews] = useState({});
  const [tab, setTab] = useState("overview");

  const headshotUrl = `/api/headshot?id=${player.id}`;
  const fallbackUrl = "/silhouettes/player.png";

  const getHealthColor = (status) => {
    if (!status) return "green";
    const s = status.toLowerCase();
    if (s.includes("out") || s.includes("doubt")) return "red";
    if (s.includes("question")) return "yellow";
    return "green";
  };

  // ⭐ SAFE NORMALIZED FIELDS
  const pos = player.pos || player.position || "—";
  const team = player.team || "—";
  const byeWeek = player.byeWeek || "—";
  const posRank = player.posRank || "—";
  const avg = player.avg ?? "—";
  const projected = player.projected ?? "—";
  const health = player.healthStatus || "Healthy";
  const rosteredPercent = player.rosteredPercent || "—";

  const matchup = player.matchup || null;
  const news = player.externalNews || [];
  const espnStats = player.espnStats || null;

  return (
    <div className="modal-overlay">
      <div className="modal player-modal">

        {/* FREE AGENT LOCK BANNER */}
        {!fromRoster && isLocked && (
          <div className="modal-lock-banner top-lock">
            🔒 Locked until Free Agency opens
          </div>
        )}

        {/* ============================== */}
        {/* TOP SECTION */}
        {/* ============================== */}
        <div className="pm-top">
          <div className="pm-info">
            <h2 className="pm-name">{player.name}</h2>

            <div className="pm-line">
              {pos} — {team}
            </div>

            <div className="pm-line">
              Bye Week: {byeWeek}
            </div>

            <div className="pm-line">
              {fromRoster ? "Roster Player" : "Free Agent"}
            </div>
          </div>

          <div className="pm-photo">
            <img
              src={headshotUrl}
              alt={player.name}
              onError={(e) => (e.target.src = fallbackUrl)}
            />
          </div>
        </div>

        <div className="pm-divider"></div>

        {/* ============================== */}
        {/* MID SECTION */}
        {/* ============================== */}
        <div className="pm-mid">
          <div className="pm-mid-box">
            <div className="pm-mid-label">Fantasy Points</div>
            <div className="pm-mid-value">{avg}</div>
          </div>

          <div className="pm-mid-box">
            <div className="pm-mid-label">Position Rank</div>
            <div className="pm-mid-value">{posRank}</div>
          </div>

          <div className="pm-mid-box">
            <div className="pm-mid-label">Rostered</div>
            <div className="pm-mid-value">
              {rosteredPercent !== "—" ? `${rosteredPercent}%` : "—"}
            </div>
          </div>
        </div>

        <div className="pm-divider"></div>

        {/* ============================== */}
        {/* TABS */}
        {/* ============================== */}
        <div className="pm-tabs">
          <button
            className={`pm-tab ${tab === "overview" ? "active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`pm-tab ${tab === "gamelog" ? "active" : ""}`}
            onClick={() => setTab("gamelog")}
          >
            Game Log
          </button>
          <button
            className={`pm-tab ${tab === "stats" ? "active" : ""}`}
            onClick={() => setTab("stats")}
          >
            Stats
          </button>
        </div>

        {/* ============================== */}
        {/* TAB CONTENT */}
        {/* ============================== */}

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="pm-tab-content">

            {/* MATCHUP */}
            <div className="pm-matchup">
              <div className="pm-matchup-title">
                Week {player.week || 1} Matchup
                <span
                  className={`pm-health-pill pm-health-${getHealthColor(
                    health
                  )}`}
                  style={{ marginLeft: "10px" }}
                >
                  {health}
                </span>
              </div>

              <div className="pm-matchup-line">
                {matchup?.kickoff || "Date/Time: TBD"} {" | "}
                {matchup
                  ? matchup.home
                    ? `v ${matchup.opponent}`
                    : `@ ${matchup.opponent}`
                  : "Opponent: TBD"}
                {" | "}
                {`Spread: ${matchup?.spread ?? "TBD"}`}
              </div>

              <div className="pm-matchup-line">
                Projected Points: {projected}
              </div>

              {player.injuryDetail && (
                <div className="pm-matchup-line injury-detail">
                  {player.injuryDetail}
                </div>
              )}
            </div>

            <div className="pm-divider"></div>

            {/* NEWS */}
            <h3 className="fa-section-title">Recent News</h3>

            <div className="fa-news-box">
              {news.length > 0 ? (
                news.map((item, idx) => {
                  const isOpen = openNews[idx] || false;

                  return (
                    <div key={idx} className="fa-news-item">
                      <div
                        className="fa-news-headline collapsible-header"
                        onClick={() =>
                          setOpenNews((prev) => ({ ...prev, [idx]: !isOpen }))
                        }
                      >
                        {item.headline || "News Update"}
                        <span className="fa-collapse-icon">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>

                      <div className="fa-news-meta always-visible">
                        {item.timestamp && (
                          <span className="fa-news-time">
                            Reported:{" "}
                            {new Date(item.timestamp * 1000).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                            })}
                          </span>
                        )}

                        {item.source && (
                          <span className="fa-news-source">
                            Source: {item.source}
                          </span>
                        )}
                      </div>

                      {isOpen && (
                        <div className="fa-news-content">
                          {item.body && (
                            <div className="fa-news-body">{item.body}</div>
                          )}

                          {item.fantasyImpact && (
                            <div className="fa-news-impact">
                              <strong>Fantasy Impact:</strong>{" "}
                              {item.fantasyImpact}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="fa-news-none">No recent news available.</div>
              )}
            </div>
          </div>
        )}

        {/* GAME LOG */}
        {tab === "gamelog" && (
          <div className="pm-tab-content">
            <h3>Game Log</h3>
            <div className="pm-placeholder">Game log data coming soon…</div>
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div className="pm-tab-content">
            <h3>
              {espnStats?.seasonYear
                ? `${espnStats.seasonYear} ${espnStats.seasonType} Stats`
                : "Stats"}
            </h3>

            {espnStats?.stats?.length > 0 ? (
              <table className="pm-stats-table">
                <thead>
                  <tr>
                    <th>Stat</th>
                    <th>Value</th>
                    <th>Rank</th>
                  </tr>
                </thead>

                <tbody>
                  {espnStats.stats.map((stat) => (
                    <tr key={stat.name}>
                      <td>{stat.label}</td>
                      <td>{stat.displayValue}</td>
                      <td
                        className={
                          stat.rank <= 5
                            ? "pm-rank-green"
                            : stat.rank <= 10
                            ? "pm-rank-yellow"
                            : "pm-rank-red"
                        }
                      >
                        {stat.rankDisplay || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No stats available.</p>
            )}
          </div>
        )}

        {/* ============================== */}
        {/* ACTION BUTTONS */}
        {/* ============================== */}
        <div className="modal-actions">

          {/* FreeAgents buttons */}
          {!fromRoster && (
            <>
              <button
                className={`modal-btn add-btn ${isLocked ? "locked" : ""}`}
                disabled={isLocked}
                onClick={() => !isLocked && onAdd(player.id)}
              >
                Add Player
              </button>

              <button
                className={`modal-btn waiver-btn ${isLocked ? "locked" : ""}`}
                disabled={isLocked}
                onClick={() => !isLocked && onWaiver(player.id)}
              >
                Submit Waiver Claim
              </button>
            </>
          )}

          {/* Roster buttons */}
          {fromRoster && (
            <>
              <button className="modal-btn drop-btn">
                Drop Player
              </button>

              <button className="modal-btn ir-btn">
                Move to IR
              </button>
            </>
          )}

          <button className="modal-btn close-btn" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}