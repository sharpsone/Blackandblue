import StatBlock from "./StatBlock";
import Badge from "./Badge";

export default function TeamCard({ team, seed }) {
  const {
    id,
    name,
    pf,
    pa,
    h2hwlt,
    divwlt,
    confwlt,
    winPct,
    strk,
    initials,
    logo,
    conferenceName,
    divisionName,
    isOwner
  } = team;

  // Playoff seed highlighting
  const playoffBorder =
    seed <= 2
      ? "2px solid gold" // bye week
      : seed <= 6
      ? "2px solid #00aaff" // playoff team
      : "1px solid #222";

  // Owner highlight glow
  const ownerGlow = isOwner
    ? "0 0 12px rgba(0,170,255,0.9)"
    : "0 0 6px rgba(0,0,0,0.4)";

  // Streak color
  function streakColor(strk) {
    if (!strk || strk === "-") return "#888";
    if (strk.startsWith("W")) return "#00aaff";
    if (strk.startsWith("L")) return "#ff0033";
    return "#f1c40f";
  }

  return (
    <div
      className="fade-in hover-grow"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem",
        background: "#111",
        borderRadius: "10px",
        border: playoffBorder,
        boxShadow: ownerGlow,
        marginBottom: "0.75rem",
        flexWrap: "wrap"
      }}
    >
      {/* Logo + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Logo */}
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #00aaff"
            }}
          />
        ) : (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#00aaff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              color: "black"
            }}
          >
            {initials}
          </div>
        )}

        {/* Name + Badges */}
        <div>
          <span style={{ fontWeight: "bold", fontSize: "16px" }}>
            {name}
          </span>

          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
            <Badge text={conferenceName} color="#00aaff" />
            <Badge text={divisionName} color="#003566" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "0.5rem"
        }}
      >
        <StatBlock label="PF" value={pf} />
        <StatBlock label="PA" value={pa} />
        <StatBlock label="H2H" value={h2hwlt} />
        <StatBlock label="DIV" value={divwlt} />
        <StatBlock label="CONF" value={confwlt} />
        <StatBlock label="Win %" value={winPct.toFixed(3)} />
      </div>

      {/* Streak */}
      <div style={{ minWidth: "80px", textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: "#aaa" }}>Streak</span>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: streakColor(strk)
          }}
        >
          {strk}
        </div>
      </div>
    </div>
  );
}
