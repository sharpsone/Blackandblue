import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const response = await fetch(
    `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    }
  );

  const rawCookie = response.headers.get("set-cookie");

  if (!rawCookie) {
    return res.status(401).json({ error: "Login failed" });
  }

  // Parse the cookie from MFL
  const parsed = cookie.parse(rawCookie);

  // Re-set cookie for YOUR domain
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("MFL_USER_ID", parsed.MFL_USER_ID, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  return res.status(200).json({ ok: true });
}

