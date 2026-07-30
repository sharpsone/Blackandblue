import cookie from "cookie";

export default async function handler(req, res) {
  console.log("LOGIN API HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("MFL LOGIN URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/xml",
    },
  });

  console.log("MFL STATUS:", response.status);

  const raw = response.headers.get("set-cookie");
  console.log("RAW COOKIES:", raw);

  if (!raw) {
    console.log("NO COOKIES RECEIVED");
    return res.status(401).json({ error: "Login failed" });
  }

  // Correctly split multiple cookies
  const cookies = raw.match(/(?:[^,]+=[^;]+;[^,]+(?:,[^A-Z]|$))+/g) || [raw];
  console.log("PARSED COOKIES:", cookies);

  const setHeaders = [];

  cookies.forEach((c) => {
    const parsed = cookie.parse(c);
    const name = Object.keys(parsed)[0];
    const value = parsed[name];

    console.log("SETTING COOKIE:", name, value);

    setHeaders.push(
      cookie.serialize(name, value, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        path: "/",
      })
    );
  });

  console.log("FINAL SET-COOKIE HEADERS:", setHeaders);

  res.setHeader("Set-Cookie", setHeaders);

  console.log("LOGIN SUCCESS — RETURNING 200");
  return res.status(200).json({ ok: true });
}
