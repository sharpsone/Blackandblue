import cookie from "cookie";

export default async function handler(req, res) {
  console.log("LOGIN API HIT");

  if (req.method !== "POST") {
    console.log("INVALID METHOD:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  console.log("USERNAME:", username);

  const year = new Date().getFullYear();
  console.log("YEAR:", year);

  const url = `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("MFL LOGIN URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/xml",
    },
  });

  console.log("MFL STATUS:", response.status);

  const rawCookies = response.headers.get("set-cookie");
  console.log("RAW COOKIES FROM MFL:", rawCookies);

  if (!rawCookies) {
    console.log("NO COOKIES RECEIVED FROM MFL");
    return res.status(401).json({ error: "Login failed" });
  }

  // MFL returns multiple cookies separated by commas
  const cookieParts = rawCookies.split(",");
  console.log("COOKIE PARTS:", cookieParts);

  const setHeaders = [];

  cookieParts.forEach((part) => {
    const parsed = cookie.parse(part);

    Object.keys(parsed).forEach((key) => {
      console.log("SETTING COOKIE:", key, parsed[key]);

      setHeaders.push(
        cookie.serialize(key, parsed[key], {
          httpOnly: false,
          secure: true,
          sameSite: "none",
          path: "/",
        })
      );
    });
  });

  console.log("FINAL SET-COOKIE HEADERS:", setHeaders);

  res.setHeader("Set-Cookie", setHeaders);

  console.log("LOGIN SUCCESS — RETURNING 200");

  return res.status(200).json({ ok: true });
}

