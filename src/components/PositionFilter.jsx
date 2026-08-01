import "./PositionFilter.css";

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "PK", "DEF", "DL", "LB", "DB"];

export default function PositionFilter({ value, onChange }) {
  return (
    <div className="fa-pos-filter">
      {POSITIONS.map((pos) => (
        <button
          key={pos}
          className={`fa-pos-btn ${value === pos ? "active" : ""}`}
          onClick={() => onChange(pos)}
        >
          {pos}
        </button>
      ))}
    </div>
  );
}
