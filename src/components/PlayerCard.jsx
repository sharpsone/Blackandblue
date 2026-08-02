// src/components/PlayerCard.jsx
import "./PlayerCard.css";

export default function PlayerCard({ player, onOpen, onAdd, onWaiver }) {
  const isLocked = player.status === "locked";

  return (
    <div
      className={`player-card ${isLocked ? "locked" : ""}`}
      onClick={() => {
        console.log("[PlayerCard] CARD CLICKED:", {
          id: player.id,
          name: player.name,
          pos: player.pos,
          team: player.team,
          status: player.status,
        });
        onOpen(player);
      }}
    >
      {isLocked && (
        <div className="lock-icon" title="Locked until F/A opens">
          🔒
        </div>
      )}

      <div className="fa-main">
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
              <label>Pos Rank</label>
              <span>{player.posRank}</span>
          </div>
          <div className="fa-stat">
              <label>Avg</label>
              <span>{player.avg}</span>
          </div>
          </div>
      </div>

      <div className="fa-actions">
        <button
          className="fa-btn add"
          disabled={isLocked}
          onClick={(e) => {
            e.stopPropagation();
            !isLocked && onAdd(player.id);
          }}
        >
          Add
        </button>

        <button
          className="fa-btn waiver"
          disabled={isLocked}
          onClick={(e) => {
            e.stopPropagation();
            !isLocked && onWaiver(player.id);
          }}
        >
          Waiver
        </button>
      </div>
    </div>
  );
}
