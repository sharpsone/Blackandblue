export default function Badge({ text, color = "#00aaff" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "bold",
        background: color,
        color: "black",
        borderRadius: "999px",
        letterSpacing: "0.3px",
        boxShadow: "0 0 4px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap"
      }}
    >
      {text}
    </span>
  );
}
