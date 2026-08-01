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

  // -----------------------------
  // LOAD FREE AGENTS
  // -----------------------------
  useEffect(() => {
    if (!leagueInfo) return;

    async function loadFreeAgents() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/mfl?action=freeAgents&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
        );

        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error("Failed to load free agents:", err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    loadFreeAgents();
  }, [leagueInfo]);

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
  // ADD PLAYER
  // -----------------------------
  const handleAdd = async (playerId) => {
    try {
      const res = await fetch(
        `/api/mfl?action=addPlayer&playerId=${playerId}&franchiseId=${leagueInfo.franchiseId}&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );

      const data = await res.json();
      alert(data.result?.status || "Add request sent");
    } catch (err) {
      console.error("Add player failed:", err);
      alert("Add failed");
    }
  };

  // -----------------------------
  // WAIVER CLAIM
  // -----------------------------
  const handleWaiver = async (playerId) => {
    try {
      const res = await fetch(
        `/api/mfl?action=waiverClaim&playerId=${playerId}&franchiseId=${leagueInfo.franchiseId}&bid=0&leagueId=${leagueInfo.leagueId}&year=${leagueInfo.year}`
      );

      const data = await res.json();
      alert(data.result?.status || "Waiver claim submitted");
    } catch (err) {
      console.error("Waiver claim failed:", err);
      alert("Waiver claim failed");
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="free-agents-page">
      <h2>Free Agents</h2>

      <div className="fa-controls">
        <SearchBar value={search} onChange={setSearch} />
        <PositionFilter value={position} onChange={setPosition} />
        <SortDropdown value={sortBy} onChange={setSortBy} />
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
