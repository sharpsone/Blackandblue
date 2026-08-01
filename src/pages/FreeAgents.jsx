import { useEffect, useState } from "react";
import "./FreeAgents.css";

import PlayerCard from "../components/PlayerCard";
import PlayerModal from "../components/PlayerModal";
import PositionFilter from "../components/PositionFilter";
import SortDropdown from "../components/SortDropdown";
import SearchBar from "../components/SearchBar";

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

      {/* NEW FILTER BAR */}
      <div className="fa-controls">
        <SearchBar value={search} onChange={setSearch} />
        <PositionFilter value={position} onChange={setPosition} />
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Loading */}
      {loading && <div className="loading">Loading free agents...</div>}

      {/* Player List */}
      {!loading && (
        <div className="fa-player-list">
          {filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onOpen={openPlayer}
              onAdd={handleAdd}
              onWaiver={handleWaiver}
            />
          ))}
        </div>
      )}

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        onClose={closePlayer}
        onAdd={handleAdd}
        onWaiver={handleWaiver}
      />
    </div>
  );
}

