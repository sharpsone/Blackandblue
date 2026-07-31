import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://www.myfantasyleague.com/${year}/login`;

  const body = new URLSearchParams({
    USERNAME: username,
    PASSWORD: password
  });

  const response = await fetch(url, {
    method: "POST",
    redirect: "follow", // FOLLOW REDIRECTS
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*",
      "Connection": "keep-alive"
    },
    body
  });

  // Collect ALL cookies from ALL redirects
  const rawCookies = response.headers.get("set-cookie");
  console.log("RAW SET-COOKIE:", rawCookies);

  if (!rawCookies) {
    return res.status(401).json({ error: "Login failed — no cookies returned" });
  }

  const cookieParts = rawCookies.split(",").map(c => c.trim());

  const cookiesToSet = cookieParts.map(c => {
    const [key, value] = c.split(";")[0].split("=");
    return cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    });
  });

  res.setHeader("Set-Cookie", cookiesToSet);

  return res.status(200).json({ ok: true });
}
