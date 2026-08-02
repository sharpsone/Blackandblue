// src/components/PlayerModal.jsx
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) {
    console.log("[PlayerModal] No player → modal not rendered");
    return null;
  }

  console.log("[PlayerModal] Rendering modal with player:", player);

  const isLocked = player.status === "locked";

  // Placeholder news until API is added
  const news = player.news || null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        {/* NAME */}
        <h2 className="fa-modal-name">{player.name}</h2>

        {/* LOCK BANNER */}
        {isLocked && (
          <div className="modal-lock-banner">
            🔒 Locked until Free Agency opens
          </div>
        )}

        {/* POSITION + TEAM */}
        <div className="fa-modal-sub">
          {player.pos} — {player.team}
        </div>

        {/* RANKS + AVG */}
        <div className="fa-modal-stats">
          <div className="fa-modal-stat">
            <label>Rank (Overall)</label>
            <span>{player.rank}</span>
          </div>

          <div className="fa-modal-stat">
            <label>Rank (Position)</label>
            <span>{player.posRank}</span>
          </div>

          <div className="fa-modal-stat">
            <label>Avg</label>
            <span>{player.avg}</span>
          </div>
        </div>

        {/* NEWS SECTION */}
        <div className="fa-section-title">Recent News</div>
        <div className="fa-news-box">
          {player.news ? (
            <div className="fa-news-text">{player.news}</div>
          ) : (
            <div className="fa-news-none">No recent news available.</div>
          )}
        </div>


        {/* WEEKLY POINTS HEADER */}
        <div className="fa-section-title">Weekly Points</div>

        {/* WEEKLY LIST (placeholder until stats added) */}
        <ul className="fa-weekly-list">
          {(player.weekly || []).map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>

        {/* BUTTONS */}
        <div className="fa-modal-buttons">
          <button
            className={`fa-btn add ${isLocked ? "locked" : ""}`}
            disabled={isLocked}
            onClick={() => !isLocked && onAdd(player.id)}
          >
            Add Player
          </button>

          <button
            className={`fa-btn waiver ${isLocked ? "locked" : ""}`}
            disabled={isLocked}
            onClick={() => !isLocked && onWaiver(player.id)}
          >
            Submit Waiver Claim
          </button>

          <button className="fa-btn close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
