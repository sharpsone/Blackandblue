import { useEffect, useState } from "react";
import "./FreeAgents.css"; // optional styling file

export default function FreeAgents({ leagueInfo }) {
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [sortBy, setSortBy] = useState("rank");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Load free agents on mount
  useEffect(() => {
    async function loadFreeAgents() {
      try {
        const res = await fetch("/api/freeAgents", {
          credentials: "include",
        });
        const data = await res.json();

        // Expecting: data.players = [{ id, name, pos, team }]
        setPlayers(data.players || []);
      } catch (err) {
        console.error("Failed to load free agents:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFreeAgents();
  }, []);

  // Apply filters + search + sorting
  useEffect(() => {
    let list = [...players];

    if (position !== "ALL") {
      list = list.filter((p) => p.pos === position);
    }

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }

    // Sorting logic
    list.sort((a, b) => {
      if (sortBy === "rank") return (a.rank || 9999) - (b.rank || 9999);
      if (sortBy === "avg") return (b.avg || 0) - (a.avg || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFiltered(list);
  }, [players, search, position, sortBy]);

  const openPlayer = async (player) => {
    setSelectedPlayer({ loading: true });

    const res = await fetch(`/api/playerStats?playerId=${player.id}`, {
      credentials: "include",
    });
    const stats = await res.json();

    setSelectedPlayer({
      ...player,
      ...stats,
      loading: false,
    });
  };

  const closePlayer = () => setSelectedPlayer(null);

  const handleAdd = async (playerId) => {
    const res = await fetch(`/api/addPlayer?playerId=${playerId}`, {
      credentials: "include",
    });
    const data = await res.json();

    alert(data.status || "Add request sent");
  };

  const handleWaiver = async (playerId) => {
    const res = await fetch(`/api/waiverClaim?playerId=${playerId}`, {
      credentials: "include",
    });
    const data = await res.json();

    alert(data.status || "Waiver claim submitted");
  };

  return (
    <div className="free-agents-page">
      <h2>Free Agents</h2>

      {/* Filters */}
      <div className="filters">
        <input
          className="search"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="ALL">All Positions</option>
          <option value="QB">QB</option>
          <option value="RB">RB</option>
          <option value="WR">WR</option>
          <option value="TE">TE</option>
          <option value="PK">K</option>
          <option value="DEF">DEF</option>
          <option value="DL">DL</option>
          <option value="LB">LB</option>
          <option value="DB">DB</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="rank">Rank</option>
          <option value="avg">Weekly Avg</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <div className="loading">Loading free agents...</div>}

      {/* Player List */}
      {!loading && (
        <div className="player-list">
          {filtered.map((p) => (
            <div key={p.id} className="player-card">
              <div className="player-main" onClick={() => openPlayer(p)}>
                <div className="player-name">{p.name}</div>
                <div className="player-pos">{p.pos}</div>
                <div className="player-team">{p.team}</div>
                <div className="player-rank">Rank: {p.rank ?? "—"}</div>
                <div className="player-avg">Avg: {p.avg ?? "—"}</div>
              </div>

              <div className="player-actions">
                <button onClick={() => handleAdd(p.id)}>Add</button>
                <button onClick={() => handleWaiver(p.id)}>Waiver</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={closePlayer}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedPlayer.loading ? (
              <div>Loading player stats...</div>
            ) : (
              <>
                <h3>{selectedPlayer.name}</h3>
                <p>{selectedPlayer.pos} - {selectedPlayer.team}</p>

                <div className="modal-stats">
                  <div>Rank: {selectedPlayer.rank ?? "—"}</div>
                  <div>Avg: {selectedPlayer.avg ?? "—"}</div>
                  <div>Last 3 Weeks: {selectedPlayer.last3 ?? "—"}</div>
                </div>

                <h4>Weekly Points</h4>
                <ul>
                  {selectedPlayer.weekly?.map((w, i) => (
                    <li key={i}>Week {i + 1}: {w}</li>
                  ))}
                </ul>

                <button onClick={() => handleAdd(selectedPlayer.id)}>
                  Add Player
                </button>

                <button onClick={() => handleWaiver(selectedPlayer.id)}>
                  Submit Waiver Claim
                </button>

                <button onClick={closePlayer}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
