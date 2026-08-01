import "./SortDropdown.css";

export default function SortDropdown({ value, onChange }) {
  return (
    <select
      className="fa-sort"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="rank">Rank</option>
      <option value="avg">Weekly Avg</option>
      <option value="name">Name</option>
    </select>
  );
}
