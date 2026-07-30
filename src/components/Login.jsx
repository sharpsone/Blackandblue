import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const year = new Date().getFullYear();

    // Redirect to MFL login
    window.location.href =
      `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login to MFL</h2>

      <input
        placeholder="Username or Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <hr />

      <p>After logging in and seeing the “OK” page:</p>

      <button
        onClick={() =>
          window.location.href = "https://blackandblue.vercel.app/after-login.jsx"
        }
      >
        Return to App
      </button>
    </div>
  );
}
