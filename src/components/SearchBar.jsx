import "./SearchBar.css";

export default function SearchBar({ value, onChange }) {
  return (
    <input
      className="fa-search"
      placeholder="Search players..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
