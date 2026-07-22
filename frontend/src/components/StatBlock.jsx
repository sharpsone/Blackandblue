export default function StatBlock({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "50px"
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: "#aaa",
          marginBottom: "2px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: "bold",
          fontSize: "14px",
          color: "white"
        }}
      >
        {value}
      </span>
    </div>
  );
}
