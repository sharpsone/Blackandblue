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

    const rawValue = rest.join("=");
    const decodedValue = decodeURIComponent(rawValue);

    cookies[name] = decodedValue;
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

  console.log("COOKIE SENT TO MFL:", cookieName, cookies[cookieName]);

  return {
    Cookie: `${cookieName}=${cookies[cookieName]}`
  };
}

/**
 * AUTHENTICATED HOST DETECTION USING THE OFFICIAL MFL METHOD
 * Matches the Perl sample: extract host from the `url="..."` attribute.
 */
export async function detectMFLHost(year, leagueId, req) {
  const authHeaders = buildAuthHeaders(req);

  try {
    // MUST use XML (JSON=0) because the host is inside the URL attribute
    const myLeaguesUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&JSON=0`;
    const myLeaguesRes = await fetch(myLeaguesUrl, { headers: authHeaders });
    const xml = await myLeaguesRes.text();

    // EXACT regex from the Perl sample
    const regex = new RegExp(
      `url="https?://([a-z0-9]+\\.myfantasyleague\\.com)/${year}/home/${leagueId}"`,
      "i"
    );

    const match = xml.match(regex);

    if (match) {
      const host = match[1];
      console.log(`Detected MFL host for ${year}: ${host}`);
      return host;
    }

    console.log("❌ Could not detect host from myleagues XML");
  } catch (err) {
    console.error("HOST DETECTION ERROR:", err);
  }

  // Fallback (rare)
  console.log(`Fallback host used for ${year}: api.myfantasyleague.com`);
  return "api.myfantasyleague.com";
}

export { fetch, xml2js };

