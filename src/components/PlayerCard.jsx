import "./PlayerCard.css";

export default function PlayerCard({ player, onOpen, onAdd, onWaiver }) {
  const isLocked = player.status === "locked";

  return (
    <div className={`player-card ${isLocked ? "locked" : ""}`}>
      
      {/* Small always-visible lock icon */}
      {isLocked && (
        <div className="lock-icon" title="Locked until F/A opens">
          🔒
        </div>
      )}

      {/* Main clickable area */}
      <div className="fa-main" onClick={() => onOpen(player)}>
        <div className="fa-name">{player.name}</div>

        <div className="fa-pos-team">
          <span className="fa-pos">{player.pos}</span>
          <span className="fa-team">{player.team}</span>
        </div>

        <div className="fa-stats">
          <div className="fa-stat">
            <label>Rank</label>
            <span>{player.rank}</span>
          </div>
          <div className="fa-stat">
            <label>Avg</label>
            <span>{player.avg}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fa-actions">
        <button
          className="fa-btn add"
          disabled={isLocked}
          onClick={() => !isLocked && onAdd(player.id)}
        >
          Add
        </button>

        <button
          className="fa-btn waiver"
          disabled={isLocked}
          onClick={() => !isLocked && onWaiver(player.id)}
        >
          Waiver
        </button>
      </div>
    </div>
  );
}


