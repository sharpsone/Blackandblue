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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "#003566",
        borderBottom: "2px solid #00aaff",
        flexWrap: "wrap"
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setPage(t.id)}
          style={{
            background: page === t.id ? "#00aaff" : "transparent",
            color: page === t.id ? "black" : "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
