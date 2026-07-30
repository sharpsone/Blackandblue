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

  if (!parsed.status || !parsed.status.$ || !parsed.status.$.MFL_USER_ID) {
    console.log("LOGIN FAILED — NO USER ID");
    return res.status(401).json({ error: "Login failed" });
  }

  const userId = parsed.status.$.MFL_USER_ID;
  const pwSeq = parsed.status.$.MFL_PW_SEQ || "0";

  console.log("EXTRACTED USER ID:", userId);
  console.log("EXTRACTED PW SEQ:", pwSeq);

  // Detect environment
  const isProd = process.env.VERCEL === "1";

  const cookieOptions = {
    httpOnly: false,
    secure: isProd,          // secure only in production
    sameSite: isProd ? "none" : "lax", // SameSite=None only in production
    path: "/",
  };

  const cookies = [
    cookie.serialize("MFL_USER_ID", userId, cookieOptions),
    cookie.serialize("MFL_PW_SEQ", pwSeq, cookieOptions),
    cookie.serialize("MFL_USERNAME", username, cookieOptions),
  ];

  console.log("FINAL SET-COOKIE HEADERS:", cookies);

  res.setHeader("Set-Cookie", cookies);

  console.log("LOGIN SUCCESS — RETURNING 200");
  return res.status(200).json({ ok: true });
}
