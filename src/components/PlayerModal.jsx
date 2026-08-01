import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) return null;

  return (
    <div className="fa-modal-overlay" onClick={onClose}>
      <div className="fa-modal" onClick={(e) => e.stopPropagation()}>
        {player.loading ? (
          <div className="fa-loading">Loading player stats...</div>
        ) : (
          <>
            <h2 className="fa-modal-name">{player.name}</h2>
            <div className="fa-modal-sub">
              {player.pos} — {player.team}
            </div>

            <div className="fa-modal-stats">
              <div className="fa-modal-stat">
                <label>Rank</label>
                <span>{player.rank ?? "—"}</span>
              </div>
              <div className="fa-modal-stat">
                <label>Avg</label>
                <span>{player.avg ?? "—"}</span>
              </div>
              <div className="fa-modal-stat">
                <label>Last 3</label>
                <span>{player.last3 ?? "—"}</span>
              </div>
            </div>

            <h3 className="fa-section-title">Weekly Points</h3>
            <ul className="fa-weekly-list">
              {player.weekly?.map((pts, i) => (
                <li key={i}>
                  Week {i + 1}: <strong>{pts}</strong>
                </li>
              ))}
            </ul>

            <div className="fa-modal-buttons">
              <button className="fa-btn add" onClick={() => onAdd(player.id)}>
                Add Player
              </button>
              <button
                className="fa-btn waiver"
                onClick={() => onWaiver(player.id)}
              >
                Submit Waiver Claim
              </button>
              <button className="fa-btn close" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
