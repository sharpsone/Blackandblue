// src/components/PlayerModal.jsx
import { useState } from "react";
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
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

  return (
    <div className="modal-overlay">
      <div className="modal player-modal">

        {isLocked && (
          <div className="modal-lock-banner top-lock">
            🔒 Locked until Free Agency opens
          </div>
        )}

        {/* TOP SECTION */}
        <div className="pm-top">
          <div className="pm-info">
            <h2 className="pm-name">{player.name}</h2>

            <div className="pm-line">
              {player.pos} — {player.team}
            </div>

            <div className="pm-line">
              Bye Week: {player.byeWeek || "—"}
            </div>

            <div className="pm-line">Free Agent</div>
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

        {/* MID SECTION */}
        <div className="pm-mid">
          <div className="pm-mid-box">
            <div className="pm-mid-label">Fantasy Points</div>
            <div className="pm-mid-value">{player.avg || 0}</div>
          </div>

          <div className="pm-mid-box">
            <div className="pm-mid-label">Position Rank</div>
            <div className="pm-mid-value">{player.posRank}</div>
          </div>

          {/* ⭐ Rostered Status */}
          <div className="pm-mid-box">
            <div className="pm-mid-label">Rostered</div>
            <div className="pm-mid-value">
              {player.rosteredPercent ? `${player.rosteredPercent}%` : "—"}
            </div>
          </div>

        </div>

        <div className="pm-divider"></div>

        {/* TABS */}
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

        {/* TAB CONTENT */}
        {tab === "overview" && (
          <div className="pm-tab-content">

            {/* MATCHUP SECTION */}
            <div className="pm-matchup">
              <div className="pm-matchup-title">
                Week {player.week || 1} Matchup
                <span
                  className={`pm-health-pill pm-health-${getHealthColor(
                    player.healthStatus
                  )}`}
                  style={{ marginLeft: "10px" }}
                >
                  {player.healthStatus}
                </span>
              </div>

              <div className="pm-matchup-line">
                {player.matchup?.kickoff || "Date/Time: TBD"},
                {player.matchup
                  ? player.matchup.home
                    ? `v ${player.matchup.opponent}`
                    : `@ ${player.matchup.opponent}`
                  : "Opponent: TBD"},
                Spread: {player.matchup?.spread || "TBD"}
              </div>

              {/* Projected Points */}
              <div className="pm-matchup-line">
                Projected Points: {player.projected || "—"}
              </div>

              {player.injuryDetail && (
                <div className="pm-matchup-line injury-detail">
                  {player.injuryDetail}
                </div>
              )}
            </div>

            <div className="pm-divider"></div>

            <h3 className="fa-section-title">Recent News</h3>

            <div className="fa-news-box">
              {player.externalNews && player.externalNews.length > 0 ? (
                player.externalNews.map((item, idx) => {
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
                            Reported: {item.timestamp}
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

        {tab === "gamelog" && (
          <div className="pm-tab-content">
            <h3>Game Log</h3>
            <div className="pm-placeholder">Game log data coming soon…</div>
          </div>
        )}

        {tab === "stats" && (
          <div className="pm-tab-content">
            <h3>Stats</h3>
            <div className="pm-placeholder">Season stats coming soon…</div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="modal-actions">
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

          <button className="modal-btn close-btn" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
