import { useEffect } from "react";

export default function AfterLogin() {
  useEffect(() => {
    // Give cookies time to settle
    setTimeout(() => {
      window.location.href = "https://blackandblue.vercel.app";
    }, 800);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Login successful!</h2>
      <p>Redirecting you back to the app…</p>
    </div>
  );
}
