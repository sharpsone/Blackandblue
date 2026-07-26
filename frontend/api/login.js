const xml2js = require("xml2js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
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

    console.log("LOGIN URL:", url);

    const response = await fetch(url);
    const xml = await response.text();

    console.log("LOGIN XML RESPONSE:", xml);

    const parsed = await xml2js.parseStringPromise(xml);
    const statusAttrs = parsed?.status?.$;

    if (!statusAttrs) {
      res.json({ success: false });
      return;
    }

    let cookieName = null;
    let cookieValue = null;

    if (statusAttrs.MFL_USER_ID) {
      cookieName = "MFL_USER_ID";
      cookieValue = statusAttrs.MFL_USER_ID;
    } else if (statusAttrs.MFL_USER) {
      cookieName = "MFL_USER";
      cookieValue = statusAttrs.MFL_USER;
    } else if (statusAttrs.MFL_GLOBAL) {
      cookieName = "MFL_GLOBAL";
      cookieValue = statusAttrs.MFL_GLOBAL;
    } else {
      const firstKey = Object.keys(statusAttrs)[0];
      cookieName = firstKey;
      cookieValue = statusAttrs[firstKey];
    }

    if (!cookieName || !cookieValue) {
      res.json({ success: false });
      return;
    }

    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=None`
    );

    res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

