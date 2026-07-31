import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://api.myfantasyleague.com/${year}/login`;

  const body = new URLSearchParams({
    USERNAME: username,
    PASSWORD: password,
    XML: 1
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*"
    },
    body
  });

  const xml = await response.text();
  console.log("RAW XML:", xml);

  if (!xml || xml.trim() === "") {
    return res.status(401).json({ error: "Empty XML returned from MFL login" });
  }

  const parsed = await xml2js.parseStringPromise(xml);
  const statusAttrs = parsed?.status?.$;

  if (!statusAttrs) {
    return res.status(401).json({ error: "Login failed — no status attributes" });
  }

  const mflCookies = Object.entries(statusAttrs).map(([key, value]) =>
    cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

  res.setHeader("Set-Cookie", mflCookies);

  return res.status(200).json({ ok: true });
}
