export default function NavBar({ page, setPage }) {
  const tabs = [
    { id: "standings", label: "Standings" },
    { id: "roster", label: "My Roster" },
    { id: "live", label: "Live Scoring" },
    { id: "matchups", label: "Matchups" },
    { id: "playerstats", label: "Player Stats" },
    { id: "transactions", label: "Transactions" },
    { id: "draft", label: "Draft Results" },
    { id: "messages", label: "Message Board" },
    { id: "freeagents", label: "Free Agents" },
    { id: "schedule", label: "Schedule" },
    { id: "playoffs", label: "Playoff Bracket" }
  ];

  return (
    <div className="navbar">
      <img
        src="https://www44.myfantasyleague.com/fflnetdynamic2025/19757_league_logo.png"
        alt="League Logo"
        className="navbar-logo"
      />

      <div className="navbar-links">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setPage(t.id)}
            className={page === t.id ? "active" : ""}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
