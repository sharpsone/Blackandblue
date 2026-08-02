// src/components/PlayerCard.jsx
import "./PlayerCard.css";

export default function PlayerCard({ player, onOpen, onAdd, onWaiver }) {
  const isLocked = player.status === "locked";

  return (
    <div className={`player-card ${isLocked ? "locked" : ""}`}>
      {/* Lock Badge */}
      {isLocked && (
        <div className="lock-badge">
          🔒 Locked
        </div>
      )}

      <div className="player-main" onClick={() => onOpen(player)}>
        <div className="player-name">{player.name}</div>

        <div className="player-meta">
          <span className="player-pos">{player.pos}</span>
          <span className="player-team">{player.team}</span>
        </div>

        <div className="player-stats">
          <span className="player-rank">Rank {player.rank}</span>
          <span className="player-avg">Avg {player.avg}</span>
        </div>
      </div>

      <div className="player-actions">
        <button
          className="add-btn"
          disabled={isLocked}
          onClick={() => !isLocked && onAdd(player.id)}
        >
          Add
        </button>

        <button
          className="waiver-btn"
          disabled={isLocked}
          onClick={() => !isLocked && onWaiver(player.id)}
        >
          Waiver
        </button>
      </div>
    </div>
  );
}
