import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  // ⭐ Your registered API client User-Agent
  const USER_AGENT = "BlackAndBlueApp/1.0";

  const url = `https://api.myfantasyleague.com/${year}/login?USERNAME=${username}&PASSWORD=${password}`;

  // ⭐ Critical: MFL requires a custom User-Agent or it returns EMPTY XML
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive"
    }
  });

  const xml = await response.text();
  console.log("RAW XML:", xml);

  // ⭐ If XML is empty, login failed
  if (!xml || xml.trim() === "") {
    return res.status(401).json({ error: "Empty XML returned from MFL login" });
  }

  const parsed = await xml2js.parseStringPromise(xml);
  const statusAttrs = parsed?.status?.$;

  if (!statusAttrs) {
    return res.status(401).json({ error: "Login failed — no status attributes" });
  }

  // ⭐ Save ALL real MFL cookies returned by the login API
  const mflCookies = Object.entries(statusAttrs).map(([key, value]) =>
    cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

  // ⭐ Save convenience cookies
  mflCookies.push(
    cookie.serialize("MFL_USERNAME", username, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

  mflCookies.push(
    cookie.serialize("MFL_PASSWORD", password, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

  mflCookies.push(
    cookie.serialize("MFL_YEAR", year.toString(), {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

  res.setHeader("Set-Cookie", mflCookies);

  return res.status(200).json({ ok: true });
}
