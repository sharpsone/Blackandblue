import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password, year } = req.body;
    const season = year || "2026";

    const params = new URLSearchParams({
      USERNAME: username,
      PASSWORD: password,
      XML: "1"
    });

    const url = `https://api.myfantasyleague.com/${season}/login?${params.toString()}`;

    const response = await fetch(url);
    const xml = await response.text();

    const parsed = await parseStringPromise(xml);
    const statusAttrs = parsed?.status?.$;

    if (!statusAttrs) {
      return res.json({ success: false });
    }

    // ⭐ Store ALL cookies returned by MFL
    const cookies = Object.entries(statusAttrs).map(([key, value]) => {
      return `${key}=${value}; Path=/; HttpOnly; Secure; SameSite=None`;
    });

    res.setHeader("Set-Cookie", cookies);

    return res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

