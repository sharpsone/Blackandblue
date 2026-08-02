// src/components/PlayerModal.jsx
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) return null;

  const isLocked = player.status === "locked";

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{player.name}</h2>
        <div className="modal-meta">
          <span>{player.pos}</span> — <span>{player.team}</span>
        </div>

        <div className="modal-stats">
          <div>
            <strong>RANK</strong>
            <div>{player.rank}</div>
          </div>
          <div>
            <strong>AVG</strong>
            <div>{player.avg}</div>
          </div>
          <div>
            <strong>LAST 3</strong>
            <div>{player.last3 || "—"}</div>
          </div>
        </div>

        <h3>Weekly Points</h3>

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

