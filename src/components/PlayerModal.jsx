// src/components/PlayerModal.jsx
import { useState } from "react";
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) return null;

  const isLocked = player.status === "locked";

  // Collapsible news state
  const [openNews, setOpenNews] = useState({});

  // Tab state
  const [tab, setTab] = useState("overview");

  // Player image (same pattern as MyRoster)
  const headshotUrl = player.id
    ? `https://www.myfantasyleague.com/player_photos/${player.id}.jpg`
    : "/default-player.png";

  return (
    <div className="modal-overlay">
      <div className="modal player-modal">

        {/* ============================== */}
        {/* TOP LOCK BANNER */}
        {/* ============================== */}
        {isLocked && (
          <div className="modal-lock-banner top-lock">
            🔒 Locked until Free Agency opens
          </div>
        )}

        {/* ============================== */}
        {/* TOP SECTION */}
        {/* ============================== */}
        <div className="pm-top">
          {/* LEFT SIDE INFO */}
          <div className="pm-info">
            <h2 className="pm-name">{player.name}</h2>

            <div className="pm-line">{player.pos} — {player.team}</div>
            <div className="pm-line">Week 1</div>
            <div className="pm-line">Free Agent</div>
          </div>

          {/* RIGHT SIDE IMAGE */}
          <div className="pm-photo">
            <img
              src={headshotUrl}
              onError={(e) => (e.target.src = "/default-player.png")}
              alt={player.name}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="pm-divider"></div>

        {/* ============================== */}
        {/* MID SECTION: Fantasy Points + Pos Rank */}
        {/* ============================== */}
        <div className="pm-mid">
          <div className="pm-mid-box">
            <div className="pm-mid-label">Fantasy Points</div>
            <div className="pm-mid-value">{player.avg || 0}</div>
          </div>

          <div className="pm-mid-box">
            <div className="pm-mid-label">Position Rank</div>
            <div className="pm-mid-value">{player.posRank}</div>
          </div>

          <div className="pm-mid-box pm-status">
            <div className="pm-mid-label">Status</div>
            <div className="pm-mid-value">Healthy</div>
          </div>
        </div>

        {/* Divider */}
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
          <div className="pm-section">

            {/* Week 1 Matchup Placeholder */}
            <div className="pm-matchup">
              <div className="pm-matchup-title">Week 1 Matchup</div>
              <div className="pm-matchup-line">Opponent: TBD</div>
              <div className="pm-matchup-line">Game Time: TBD</div>
            </div>

            {/* Divider */}
            <div className="pm-divider"></div>

            {/* Recent News */}
            <h3 className="fa-section-title">Recent News</h3>

            <div className="fa-news-box">
              {player.externalNews && player.externalNews.length > 0 ? (
                player.externalNews.map((item, idx) => {
                  const isOpen = openNews[idx] || false;

                  return (
                    <div key={idx} className="fa-news-item">

                      {/* Collapsible Header */}
                      <div
                        className="fa-news-headline collapsible-header"
                        onClick={() =>
                          setOpenNews(prev => ({ ...prev, [idx]: !isOpen }))
                        }
                      >
                        {item.headline || "News Update"}
                        <span className="fa-collapse-icon">{isOpen ? "▲" : "▼"}</span>
                      </div>

                      {/* Timestamp + Source */}
                      <div className="fa-news-meta always-visible">
                        {item.timestamp && (
                          <span className="fa-news-time">Reported: {item.timestamp}</span>
                        )}
                        {item.source && (
                          <span className="fa-news-source">Source: {item.source}</span>
                        )}
                      </div>

                      {/* Collapsible Body */}
                      {isOpen && (
                        <div className="fa-news-content">
                          {item.body && (
                            <div className="fa-news-body">{item.body}</div>
                          )}

                          {item.fantasyImpact && (
                            <div className="fa-news-impact">
                              <strong>Fantasy Impact:</strong> {item.fantasyImpact}
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

        {/* GAME LOG TAB */}
        {tab === "gamelog" && (
          <div className="pm-section">
            <h3>Game Log</h3>
            <div className="pm-placeholder">Game log data coming soon…</div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div className="pm-section">
            <h3>Stats</h3>
            <div className="pm-placeholder">Season stats coming soon…</div>
          </div>
        )}

        {/* ============================== */}
        {/* ACTION BUTTONS */}
        {/* ============================== */}
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
