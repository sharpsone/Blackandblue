import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const year = new Date().getFullYear();

    const redirectUrl = "https://blackandblue.vercel.app";

    window.location.href =
      `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1&REDIRECT=${redirectUrl}`;
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
    </div>
  );
}
