// src/components/PlayerModal.jsx
import { useState } from "react";
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) {
    console.log("[PlayerModal] No player → modal not rendered");
    return null;
  }

  console.log("[PlayerModal] Rendering modal with player:", player);

  const isLocked = player.status === "locked";

  // Collapsible state for news items
  const [openNews, setOpenNews] = useState({});

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* NAME */}
        <h2>{player.name}</h2>

        {/* LOCK BANNER */}
        {isLocked && (
          <div className="modal-lock-banner">
            🔒 Locked until Free Agency opens
          </div>
        )}

        {/* POSITION + TEAM */}
        <div className="modal-meta">
          <span>{player.pos}</span> — <span>{player.team}</span>
        </div>

        {/* STATS GRID */}
        <div className="modal-stats">
          <div>
            <strong>RANK (Overall)</strong>
            <div>{player.rank}</div>
          </div>
          <div>
            <strong>RANK (Position)</strong>
            <div>{player.posRank}</div>
          </div>
          <div>
            <strong>AVG</strong>
            <div>{player.avg}</div>
          </div>
        </div>

        {/* ----------------------------- */}
        {/* NEWS SECTION */}
        {/* ----------------------------- */}
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

                  {/* ALWAYS SHOW TIMESTAMP + SOURCE */}
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

        {/* WEEKLY POINTS HEADER */}
        <h3>Weekly Points</h3>

        {/* BUTTONS */}
        <div className="modal-actions">
          <button
            className={`modal-btn add-btn ${isLocked ? "locked" : ""}`}
            disabled={isLocked}
            title={isLocked ? "Locked until F/A opens" : ""}
            onClick={() => !isLocked && onAdd(player.id)}
          >
            Add Player
          </button>

          <button
            className={`modal-btn waiver-btn ${isLocked ? "locked" : ""}`}
            disabled={isLocked}
            title={isLocked ? "Locked until F/A opens" : ""}
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
