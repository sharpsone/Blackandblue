import "./PositionFilter.css";

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "PK", "DEF", "DL", "LB", "DB"];

// src/components/PositionFilter.jsx
export default function PositionFilter({ value, onChange }) {
  const positions = [
    "ALL",
    "QB",
    "RB",
    "WR",
    "TE",
    "PK",
    "DEF",
    "DL",   // maps to DE + DT
    "LB",
    "DB",   // maps to CB + S
  ];

  return (
    <div className="fa-position-filter">
      {positions.map((pos) => (
        <button
          key={pos}
          className={`fa-btn ${value === pos ? "active" : ""}`}
          onClick={() => onChange(pos)}
        >
          {pos}
        </button>
      ))}
    </div>
  );
}

