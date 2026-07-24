const fetch = global.fetch;

// ⭐ Utility: build URL with query params
function buildUrl(host, year, endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `https://${host}/${year}/${endpoint}${query ? "?" + query : ""}`;
}

// ⭐ Endpoints that require USERNAME + PASSWORD + COOKIE (no APIKEY)
const PRIVATE_TYPES = new Set([
  "league",
  "myleagues"
]);

// ⭐ Endpoints that allow APIKEY + COOKIE
const PUBLIC_TYPES = new Set([
  "leagueStandings",
  "schedule",
  "rosters",
  "liveScoring",
  "freeAgents",
  "transactions",
  "playerStats",
  "draftResults",
  "messageBoard",
  "playoffBracket"
]);

class MFLClient {
  constructor({ year, host, cookie = null, apiKey = null, username = null, password = null }) {
    this.year = year;
    this.host = host;
    this.cookie = cookie;
    this.apiKey = apiKey;
    this.username = username;
    this.password = password;
  }

  // ⭐ LOGIN — must use API host
  async login(username, password) {
    this.username = username;
    this.password = password;

    const url = buildUrl(
      "api.myfantasyleague.com",
      this.year,
      "login",
      { USERNAME: username, PASSWORD: password }
    );

    const res = await fetch(url, {
      method: "GET",
      redirect: "manual"
    });

    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) {
      throw new Error("No cookie returned from MFL login");
    }

    this.cookie = setCookie;
    return setCookie;
  }

  // ⭐ Automatic mode detection
  async request(type, params = {}) {
    let finalParams = { TYPE: type, ...params };

    // ⭐ PRIVATE MODE (league, myleagues)
    if (PRIVATE_TYPES.has(type)) {
      finalParams.USERNAME = this.username;
      finalParams.PASSWORD = this.password;
      // APIKEY forbidden
    }

    // ⭐ PUBLIC MODE (standings, schedule, rosters, etc.)
    if (PUBLIC_TYPES.has(type)) {
      if (this.apiKey) {
        finalParams.APIKEY = this.apiKey;
      }
    }

    // ⭐ Always return JSON
    finalParams.JSON = 1;

    const url = buildUrl(this.host, this.year, "export", finalParams);

    const res = await fetch(url, {
      headers: {
        Cookie: this.cookie || ""
      }
    });

    if (!res.ok) {
      throw new Error(`MFL request failed: ${res.status}`);
    }

    return res.json();
  }

  // ⭐ Correct MFL endpoints
  async getLeague(leagueId) {
    return this.request("league", { L: leagueId });
  }

  async getMyLeagues() {
    return this.request("myleagues", {});
  }

  async getStandings(leagueId) {
    return this.request("leagueStandings", { L: leagueId });
  }

  async getRosters(leagueId) {
    return this.request("rosters", { L: leagueId });
  }

  async getLiveScoring(leagueId) {
    return this.request("liveScoring", { L: leagueId });
  }

  async getSchedule(leagueId) {
    return this.request("schedule", { L: leagueId });
  }

  async getFreeAgents(leagueId) {
    return this.request("freeAgents", { L: leagueId });
  }

  async getMessageBoard(leagueId) {
    return this.request("messageBoard", { L: leagueId });
  }

  async getTransactions(leagueId) {
    return this.request("transactions", { L: leagueId });
  }

  async getPlayerStats(leagueId) {
    return this.request("playerStats", { L: leagueId });
  }

  async getDraftResults(leagueId) {
    return this.request("draftResults", { L: leagueId });
  }

  async getPlayoffBracket(leagueId) {
    return this.request("playoffBracket", { L: leagueId });
  }
}

module.exports = MFLClient;
