import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  console.log("LOGIN API HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  const url = `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}&XML=1`;
  console.log("MFL LOGIN URL:", url);

  const response = await fetch(url);
  const xml = await response.text();

  console.log("RAW XML:", xml);

  const parsed = await xml2js.parseStringPromise(xml);
  const statusAttrs = parsed?.status?.$;

  if (!statusAttrs) {
    console.log("LOGIN FAILED — NO STATUS ATTRS");
    return res.status(401).json({ error: "Login failed" });
  }

  // ⭐ Collect ALL MFL cookies returned by the login API
  const mflCookies = Object.entries(statusAttrs).map(([key, value]) =>
    cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
    })
  );

  // ⭐ Also store username/password/year for convenience
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

  console.log("FINAL SET-COOKIE HEADERS:", mflCookies);

  res.setHeader("Set-Cookie", mflCookies);

  console.log("LOGIN SUCCESS — RETURNING 200");
  return res.status(200).json({ ok: true });
}
