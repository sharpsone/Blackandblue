import "./PlayerCard.css";

export default function PlayerCard({ player, onOpen, onAdd, onWaiver }) {
  return (
    <div className="fa-card">
      <div className="fa-main" onClick={() => onOpen(player)}>
        <div className="fa-name">{player.name}</div>
        <div className="fa-pos-team">
          <span className="fa-pos">{player.pos}</span>
          <span className="fa-team">{player.team}</span>
        </div>

        <div className="fa-stats">
          <div className="fa-stat">
            <label>Rank</label>
            <span>{player.rank ?? "—"}</span>
          </div>
          <div className="fa-stat">
            <label>Avg</label>
            <span>{player.avg ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="fa-actions">
        <button className="fa-btn add" onClick={() => onAdd(player.id)}>
          Add
        </button>
        <button className="fa-btn waiver" onClick={() => onWaiver(player.id)}>
          Waiver
        </button>
      </div>
    </div>
  );
}
