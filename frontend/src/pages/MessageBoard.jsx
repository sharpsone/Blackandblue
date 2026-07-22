import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import "../utils/animations.css";
import { fetchMessages, fetchLeague } from "../utils/api";

export default function MessageBoard({ leagueId }) {
  const [messages, setMessages] = useState([]);
  const [franchiseNames, setFranchiseNames] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const leagueJson = await fetchLeague(leagueId);
      const msgJson = await fetchMessages(leagueId);

      const franchiseList = leagueJson.league.franchises.franchise || [];
      const nameMap = {};
      franchiseList.forEach(f => {
        nameMap[f.id] = {
          name: f.name,
          logo: f.icon || null
        };
      });

      setFranchiseNames(nameMap);

      const list = msgJson.messages?.message || [];
      setMessages(list.reverse()); // newest first
    } catch (err) {
      console.error("MESSAGE BOARD ERROR:", err);
      setError("Failed to load message board");
    }
  }

  function postLocalMessage() {
    if (!newMessage.trim()) return;

    const fake = {
      id: "local-" + Date.now(),
      franchise: "LOCAL",
      subject: "User Message",
      body: newMessage,
      timestamp: Date.now() / 1000,
      replies: []
    };

    setMessages([fake, ...messages]);
    setNewMessage("");
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="fade-in" style={{ color: "#00aaff" }}>
        Message Board
      </h1>

      {/* Composer */}
      <div
        style={{
          background: "#111",
          padding: "1rem",
          borderRadius: "10px",
          marginBottom: "1rem",
          border: "1px solid #222"
        }}
      >
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          style={{
            width: "100%",
            height: "80px",
            background: "#000814",
            color: "white",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "0.5rem",
            resize: "none"
          }}
        />

        <button
          onClick={postLocalMessage}
          className="hover-grow"
          style={{
            marginTop: "0.5rem",
            background: "#00aaff",
            color: "black",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Post Message
        </button>
      </div>

      {/* Messages */}
      {messages.map(m => (
        <MessageCard
          key={m.id}
          msg={m}
          franchiseNames={franchiseNames}
        />
      ))}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function MessageCard({ msg, franchiseNames }) {
  const franchiseInfo = franchiseNames[msg.franchise] || {};
  const { name, logo } = franchiseInfo;

  const time = new Date(parseInt(msg.timestamp) * 1000).toLocaleString();

  return (
    <div
      className="fade-in hover-grow"
      style={{
        background: "#111",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "1rem",
        border: "1px solid #222"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.75rem"
        }}
      >
        {/* Logo */}
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #00aaff"
            }}
          />
        ) : (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#00aaff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "14px",
              color: "black"
            }}
          >
            {name?.[0] || "?"}
          </div>
        )}

        <div>
          <div style={{ fontWeight: "bold", fontSize: "16px" }}>
            {name || msg.franchise}
          </div>
          <div style={{ fontSize: "12px", color: "#aaa" }}>{time}</div>
        </div>
      </div>

      {/* Subject */}
      {msg.subject && (
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "0.5rem",
            color: "#00aaff"
          }}
        >
          {msg.subject}
        </div>
      )}

      {/* Body */}
      <div style={{ marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
        {msg.body}
      </div>

      {/* Replies */}
      {(msg.replies || []).map(r => (
        <ReplyCard key={r.id} reply={r} franchiseNames={franchiseNames} />
      ))}
    </div>
  );
}

function ReplyCard({ reply, franchiseNames }) {
  const franchiseInfo = franchiseNames[reply.franchise] || {};
  const { name, logo } = franchiseInfo;

  const time = new Date(parseInt(reply.timestamp) * 1000).toLocaleString();

  return (
    <div
      className="fade-in"
      style={{
        background: "#222",
        padding: "0.75rem",
        borderRadius: "6px",
        marginBottom: "0.5rem",
        display: "flex",
        gap: "0.75rem"
      }}
    >
      {/* Logo */}
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #00aaff"
          }}
        />
      ) : (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#00aaff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "12px",
            color: "black"
          }}
        >
          {name?.[0] || "?"}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>
          {name || reply.franchise}
        </div>
        <div style={{ fontSize: "12px", color: "#aaa" }}>{time}</div>

        <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
          {reply.body}
        </div>
      </div>
    </div>
  );
}
