export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  // Call MFL login API
  const response = await fetch(
    `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    }
  );

  // Extract cookies from MFL response
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    return res.status(401).json({ error: "Login failed" });
  }

  // Forward cookies to browser
  res.setHeader("Set-Cookie", setCookie);

  return res.status(200).json({ ok: true });
}
