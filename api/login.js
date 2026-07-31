import cookie from "cookie";
import xml2js from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;
  const year = new Date().getFullYear();

  // Your league server
  const SERVER = "www44";

  const url = `https://${SERVER}.myfantasyleague.com/${year}/login?USERNAME=${encodeURIComponent(
    username
  )}&PASSWORD=${encodeURIComponent(password)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BlackAndBlueApp",
      "Accept": "*/*",
      "Connection": "keep-alive"
    }
  });

  const xml = await response.text();
  console.log("LOGIN STATUS:", response.status);
  console.log("LOGIN RAW BODY:", xml);

  if (!response.ok) {
    return res
      .status(401)
      .json({ error: `MFL login failed with status ${response.status}` });
  }

  if (!xml || xml.trim() === "") {
    return res.status(401).json({ error: "Empty XML returned from MFL login" });
  }

  const parsed = await xml2js.parseStringPromise(xml);
  const statusAttrs = parsed?.status?.$;

  if (!statusAttrs) {
    return res
      .status(401)
      .json({ error: "Login failed — no status attributes in XML" });
  }

  const mflCookies = Object.entries(statusAttrs).map(([key, value]) =>
    cookie.serialize(key, value, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/"
    })
  );

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
