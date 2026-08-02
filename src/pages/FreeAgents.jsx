// src/pages/FreeAgents.jsx
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
  const [conference, setConference] = useState("CONFERENCE00");

  // -----------------------------
  // LOAD FREE AGENTS (PRESEASON SAFE)
  // -----------------------------
  async function loadFreeAgents() {
    if (!leagueInfo) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/mfl?action=freeAgents&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );
      const data = await res.json();
      // ✅ Updated to use conference-specific data
      setPlayers(data.conferences[conference] || []);
    } catch (err) {
      console.error("Failed to load free agents:", err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Updated to reload when conference changes
  useEffect(() => {
    if (!leagueInfo) return;
    loadFreeAgents();
  }, [leagueInfo, conference]);

  // -----------------------------
  // FILTER + SEARCH + SORT
  // -----------------------------
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

  // -----------------------------
  // PLAYER MODAL: LOAD STATS
  // -----------------------------
  const openPlayer = async (player) => {
    setSelectedPlayer({ loading: true });

    try {
      const res = await fetch(
        `/api/mfl?action=playerStats&playerId=${player.id}&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );
      const stats = await res.json();

      setSelectedPlayer({
        ...player,
        ...stats,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load player stats:", err);
      setSelectedPlayer({
        ...player,
        stats: [],
        loading: false,
      });
    }
  };

  const closePlayer = () => setSelectedPlayer(null);

  // -----------------------------
  // ADD PLAYER (LOCKED PRESEASON)
  // -----------------------------
  const handleAdd = async (playerId) => {
    alert("Players are locked until the season starts.");
  };

  // -----------------------------
  // WAIVER CLAIM (LOCKED PRESEASON)
  // -----------------------------
  const handleWaiver = async (playerId) => {
    alert("Waiver claims are unavailable until the season starts.");
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="free-agents-page">
      <h2>Free Agents</h2>

      {/* ✅ Added conference toggle UI */}
      <div className="conference-filter">
        <button
          className={`fa-btn ${conference === "CONFERENCE00" ? "active" : ""}`}
          onClick={() => setConference("CONFERENCE00")}
        >
          Black
        </button>

        <button
          className={`fa-btn ${conference === "CONFERENCE01" ? "active" : ""}`}
          onClick={() => setConference("CONFERENCE01")}
        >
          Blue
        </button>
      </div>

      <div className="fa-controls">
        <SearchBar value={search} onChange={setSearch} />

        <div className="fa-controls-right">
          <conference-filter />
          <PositionFilter value={position} onChange={setPosition} />
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {loading && <div className="loading">Loading free agents...</div>}

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

      <PlayerModal
        player={selectedPlayer}
        onClose={closePlayer}
        onAdd={handleAdd}
        onWaiver={handleWaiver}
      />
    </div>
  );
}


