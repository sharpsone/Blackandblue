import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`;

  const response = await fetch(url);
  const xml = await response.text();

  const parsed = await xml2js.parseStringPromise(xml);
  const statusAttrs = parsed?.status?.$;

  if (!statusAttrs) {
    return res.status(401).json({ error: "Login failed" });
  }

  // ⭐ Save ALL cookies returned by MFL
  const mflCookies = Object.entries(statusAttrs).map(([key, value]) =>
    cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  // ⭐ Save your own convenience cookies too
  mflCookies.push(
    cookie.serialize("MFL_USERNAME", username, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  mflCookies.push(
    cookie.serialize("MFL_PASSWORD", password, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  mflCookies.push(
    cookie.serialize("MFL_YEAR", year.toString(), {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  res.setHeader("Set-Cookie", mflCookies);

  return res.status(200).json({ ok: true });
}
