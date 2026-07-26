import fetch from "node-fetch";
import xml2js from "xml2js";

const DEFAULT_YEAR = "2026";

export function getYear(req) {
  return req.query.year || DEFAULT_YEAR;
}

export function getCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = {};
  cookieHeader.split(";").forEach((part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name) return;
    cookies[name] = rest.join("=");
  });
  return cookies;
}

export function buildAuthHeaders(req) {
  const cookies = getCookies(req);

  const cookieName =
    cookies.MFL_USER_ID
      ? "MFL_USER_ID"
      : cookies.MFL_USER
      ? "MFL_USER"
      : cookies.MFL_GLOBAL
      ? "MFL_GLOBAL"
      : null;

  if (!cookieName) {
    console.log("❌ No MFL cookie found in request");
    return {};
  }

  return {
    Cookie: `${cookieName}=${cookies[cookieName]}`
  };
}

export async function detectMFLHost(year, leagueId) {
  const url = `https://api.myfantasyleague.com/${year}/export?TYPE=assets&L=${leagueId}&XML=1`;

  try {
    const res = await fetch(url);
    const xml = await res.text();

    const match = xml.match(/host="([^"]+)"/);
    const detectedHost = match ? match[1] : "www.myfantasyleague.com";

    console.log(`Detected MFL host for ${year}: ${detectedHost}`);
    return detectedHost;
  } catch (err) {
    console.error("HOST DETECTION ERROR:", err);
    return "www.myfantasyleague.com";
  }
}

export { fetch, xml2js };
