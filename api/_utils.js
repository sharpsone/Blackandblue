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
 * AUTHENTICATED HOST DETECTION
 * Private leagues require the cookie to be passed.
 */
export async function detectMFLHost(year, leagueId, req) {
  const authHeaders = buildAuthHeaders(req);

  try {
    // 1. Try league info WITH COOKIE
    const leagueUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=league&L=${leagueId}&JSON=1`;
    const leagueRes = await fetch(leagueUrl, { headers: authHeaders });
    const leagueData = await leagueRes.json();

    if (leagueData.league?.host) {
      console.log(`Detected MFL host for ${year}: ${leagueData.league.host}`);
      return leagueData.league.host;
    }

    // 2. Fallback: myleagues WITH COOKIE
    const myLeaguesUrl = `https://api.myfantasyleague.com/${year}/export?TYPE=myleagues&JSON=1`;
    const myLeaguesRes = await fetch(myLeaguesUrl, { headers: authHeaders });
    const myLeaguesData = await myLeaguesRes.json();

    if (myLeaguesData.myleagues?.league) {
      const league = myLeaguesData.myleagues.league.find(
        (l) => l.id === leagueId.toString()
      );
      if (league?.host) {
        console.log(`Detected MFL host for ${year}: ${league.host}`);
        return league.host;
      }
    }

    // 3. Absolute fallback
    console.log(`Fallback host used for ${year}: api.myfantasyleague.com`);
    return "api.myfantasyleague.com";
  } catch (err) {
    console.error("HOST DETECTION ERROR:", err);
    return "api.myfantasyleague.com";
  }
}

export { fetch, xml2js };

