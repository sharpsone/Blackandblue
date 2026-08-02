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
  // LOAD FREE AGENTS
  // -----------------------------
  async function loadFreeAgents() {
    if (!leagueInfo) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/mfl?action=freeAgents&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );
      const data = await res.json();

      setPlayers(data.conferences[conference] || []);
    } catch (err) {
      console.error("Failed to load free agents:", err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!leagueInfo) return;
    loadFreeAgents();
  }, [leagueInfo, conference]);

  // -----------------------------
  // FILTER + SEARCH + SORT + POS RANK
  // -----------------------------
  useEffect(() => {
    let list = [...players];

    // Position filtering with DL/DB mapping
    if (position !== "ALL") {
      if (position === "DL") {
        list = list.filter((p) => ["DE", "DT"].includes(p.pos));
      } else if (position === "DB") {
        list = list.filter((p) => ["CB", "S"].includes(p.pos));
      } else {
        list = list.filter((p) => p.pos === position);
      }
    }

    // Search
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }

    // Sort by overall rank
    list.sort((a, b) => {
      if (sortBy === "rank") return (a.rank || 9999) - (b.rank || 9999);
      if (sortBy === "avg") return (b.avg || 0) - (a.avg || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    // ⭐ Compute position rank
    const grouped = {};
    list.forEach((p) => {
      if (!grouped[p.pos]) grouped[p.pos] = [];
      grouped[p.pos].push(p);
    });

    Object.values(grouped).forEach((group) => {
      group.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
      group.forEach((p, i) => {
        p.posRank = i + 1; // ⭐ Add position rank
      });
    });

    setFiltered(list);
  }, [players, search, position, sortBy]);

  // -----------------------------
  // PLAYER MODAL
  // -----------------------------
  const openPlayer = async (player) => {
    console.log("[openPlayer] clicked player:", player);

    setSelectedPlayer({ loading: true });
    console.log("[openPlayer] selectedPlayer set to loading");

    try {
      const res = await fetch(
        `/api/mfl?action=playerStats&playerId=${player.id}&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );
      const stats = await res.json();
      console.log("[openPlayer] fetched stats:", stats);

      setSelectedPlayer({
        ...player,
        ...stats,
        loading: false,
      });
      console.log("[openPlayer] selectedPlayer after merge:", {
        ...player,
        ...stats,
        loading: false,
      });
    } catch (err) {
      console.error("[openPlayer] Failed to load player stats:", err);
      setSelectedPlayer({
        ...player,
        stats: [],
        loading: false,
      });
      console.log("[openPlayer] selectedPlayer after error:", {
        ...player,
        stats: [],
        loading: false,
      });
    }
  };

  const closePlayer = () => setSelectedPlayer(null);

  // -----------------------------
  // ADD / WAIVER (LOCKED)
  // -----------------------------
  const handleAdd = () => alert("Players are locked until the season starts.");
  const handleWaiver = () =>
    alert("Waiver claims are unavailable until the season starts.");

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="free-agents-page">
      <h2>Free Agents</h2>

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
          <PositionFilter value={position} onChange={setPosition} />
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {loading && <div className="loading">Loading free agents...</div>}

      <div className="fa-player-list">
        {!loading &&
          filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onOpen={openPlayer}
              onAdd={handleAdd}
              onWaiver={handleWaiver}
            />
          ))}
      </div>

      {/* Modal stays mounted */}
      <PlayerModal
        player={selectedPlayer}
        onClose={closePlayer}
        onAdd={handleAdd}
        onWaiver={handleWaiver}
      />
    </div>
  );
}

