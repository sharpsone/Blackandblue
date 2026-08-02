// src/components/PlayerModal.jsx
import "./PlayerModal.css";

export default function PlayerModal({ player, onClose, onAdd, onWaiver }) {
  if (!player) {
    console.log("[PlayerModal] No player → modal not rendered");
    return null;
  }

  console.log("[PlayerModal] Rendering modal with player:", player);

  const isLocked = player.status === "locked";

  const news = player.news || null;
  const weekly = Array.isArray(player.stats?.weekly) ? player.stats.weekly : [];
  const season = player.stats?.season || null;
  const projections = player.stats?.projections || null;
  const profile = player.stats?.profile || null;

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
          {news ? (
            <>
              <div className="fa-news-text">{news}</div>
              {player.newsSource && (
                <div className="fa-news-source">Source: {player.newsSource}</div>
              )}
            </>
          ) : (
            <div className="fa-news-none">No recent news available.</div>
          )}
        </div>

        {/* WEEKLY POINTS */}
        <div className="fa-section-title">Weekly Points</div>
        <ul className="fa-weekly-list">
          {weekly.map((w, i) => (
            <li key={i}>
              Week {w.week}: {w.score}
            </li>
          ))}
        </ul>

        {/* SEASON TOTALS */}
        {season && (
          <>
            <div className="fa-section-title">Season Stats</div>
            <pre className="fa-season-block">
              {JSON.stringify(season, null, 2)}
            </pre>
          </>
        )}

        {/* PROJECTIONS */}
        {projections && (
          <>
            <div className="fa-section-title">Projections</div>
            <pre className="fa-proj-block">
              {JSON.stringify(projections, null, 2)}
            </pre>
          </>
        )}

        {/* PROFILE */}
        {profile && (
          <>
            <div className="fa-section-title">Player Profile</div>
            <pre className="fa-profile-block">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </>
        )}

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
