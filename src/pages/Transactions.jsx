import { useEffect, useState } from "react";
import "../pages/transactions.css";
import { getLeagueInfo } from "../utils/api";

export default function Transactions({ leagueInfo }) {
  const leagueId = leagueInfo?.leagueId;
  const year = leagueInfo?.year || 2026;

  const [franchises, setFranchises] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [franchiseFilter, setFranchiseFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  // Load franchise names first
  useEffect(() => {
    loadFranchises();
  }, []);

  // Load transactions after franchise map is ready
  useEffect(() => {
    if (Object.keys(franchises).length > 0) {
      loadTransactions();
    }
  }, [franchises]);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, typeFilter, franchiseFilter, searchFilter]);

  async function loadFranchises() {
    try {
      const leagueJson = await getLeagueInfo(leagueId, year);
      const franchiseList = leagueJson.league.franchises.franchise || [];

      const map = {};
      franchiseList.forEach(f => {
        map[f.id] = f.name || `Franchise ${f.id}`;
      });

      setFranchises(map);
    } catch (err) {
      console.error("FRANCHISE LOAD ERROR:", err);
    }
  }

  async function loadTransactions() {
    try {
      const res = await fetch(
        `/api/mfl?action=transactions&leagueId=${leagueId}&year=${year}`
      );
      const data = await res.json();

      const raw = data?.transactions?.transaction;

      // Normalize to array
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

      // ⭐ FIX: include leagueId AND year
      const playersData = await fetch(`/api/mfl?action=players&leagueId=${leagueId}&year=${year}`);
      const playersJson = await playersData.json();
      const allPlayers = playersJson?.players?.player || [];

      const parsed = list.map(t => {
        let players = [];

        if (t.type === "LOAD_ROSTERS") {
          const ids = t.transaction
            .split(",")
            .filter(x => x && x !== "|");

          players = ids.map(id => {
            const p = allPlayers.find(x => x.id === id);
            return {
              id,
              name: p?.name || "Unknown",
              position: p?.position || "",
              team: p?.team || ""
            };
          });
        } else {
          players = Array.isArray(t.player)
            ? t.player
            : t.player
            ? [t.player]
            : [];
        }

        return {
          type: t.type || "Unknown",
          franchise: t.franchise || "",
          timestamp: Number(t.timestamp) * 1000,
          by_commish: t.by_commish === "1",
          players
        };
      });

      setTransactions(parsed);

      setLoading(false);
    } catch (err) {
      console.error("TRANSACTION LOAD ERROR:", err);
      setLoading(false);
    }
  }

  function applyFilters() {
    let list = [...transactions];

    if (typeFilter !== "ALL") {
      list = list.filter(t => t.type === typeFilter);
    }

    if (franchiseFilter !== "ALL") {
      list = list.filter(t => t.franchise === franchiseFilter);
    }

    if (searchFilter.trim() !== "") {
      const term = searchFilter.toLowerCase();
      list = list.filter(t =>
        t.players.some(p => p.name.toLowerCase().includes(term))
      );
    }

    setFiltered(list);
  }

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div className="transactions-container">
      <h1 className="transactions-title">League Transactions</h1>

      {/* FILTER BAR */}
      <div className="filter-bar">
        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="Add">Add</option>
          <option value="Drop">Drop</option>
          <option value="Trade">Trade</option>
          <option value="Waiver">Waiver</option>
          <option value="LOAD_ROSTERS">Load Rosters</option>
        </select>

        {/* Franchise Filter */}
        <select
          value={franchiseFilter}
          onChange={e => setFranchiseFilter(e.target.value)}
        >
          <option value="ALL">All Teams</option>
          {Object.entries(franchises).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        {/* Search Filter */}
        <input
          type="text"
          placeholder="Search players..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
        />
      </div>

      {/* TRANSACTION LIST */}
      <div className="transaction-list">
        {filtered.map((t, idx) => (
        <div key={idx} className="transaction-card">
          <div className="transaction-header">
            <span className={`transaction-type ${t.type}`}>
              {t.type}
            </span>

            {t.by_commish && (
              <span className="commish-badge">Commish</span>
            )}

            <span className="transaction-time">
              {new Date(t.timestamp).toLocaleString()}
            </span>

            {/* Expand / Collapse Toggle */}
            {t.players.length > 4 && (
              <button
                className="expand-btn"
                onClick={() =>
                  setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))
                }
              >
                {expanded[idx] ? "Hide" : `Show ${t.players.length} players`}
              </button>
            )}
          </div>

          <div className="transaction-franchise">
            {franchises[t.franchise] || `Team ${t.franchise}`}
          </div>

          {/* COLLAPSIBLE PLAYER LIST */}
          {(expanded[idx] || t.players.length <= 8) && (
            <div className="transaction-players">
              {t.players.map(p => (
                <div key={p.id} className="player-row">
                  <span className="player-name">{p.name}</span>

                  <span className={`pos-badge pos-${p.position}`}>
                    {p.position}
                  </span>

                  <span className="player-team">{p.team || "FA"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        ))}
      </div>
    </div>
  );
}

