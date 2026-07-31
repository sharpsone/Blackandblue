import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogin = async () => {
    console.log("LOGIN BUTTON CLICKED");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    console.log("LOGIN RESPONSE STATUS:", res.status);

    const text = await res.text();
    console.log("LOGIN RESPONSE BODY:", text);

    console.log("COOKIES AFTER LOGIN:", document.cookie);

    if (res.ok) {
      console.log("LOGIN SUCCESS — UPDATING AUTH CONTEXT");
      setIsLoggedIn(true);        // ⭐ THIS IS THE FIX
      return;
    }

    console.log("LOGIN FAILED");
    alert("Login failed");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login to MFL</h2>

      <input
        placeholder="Username"
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
