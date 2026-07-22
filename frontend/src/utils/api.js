export async function loginUser(username, password) {
  const res = await fetch("https://blackandblue.onrender.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include"
  });
  return res.json();
}

export async function fetchMyLeagues() {
  const res = await fetch("https://blackandblue.onrender.com/api/myleagues", {
    credentials: "include"
  });
  return res.json();
}
