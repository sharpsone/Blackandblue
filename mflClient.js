const fetch = global.fetch;

function buildUrl(host, year, endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `https://${host}/${year}/${endpoint}${query ? "?" + query : ""}`;
}

const PRIVATE_TYPES = new Set(["league", "myleagues"]);
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

  async login(username, password) {
    this.username = username;
    this.password = password;

    const url = buildUrl(
      "api.myfantasyleague.com",
      this.year,
      "login",
      { USERNAME: username, PASSWORD: password }
    );

    const res = await fetch(url, { method: "GET", redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");

    if (!setCookie) throw new Error("No cookie returned from MFL login");

    this.cookie = setCookie;
    return setCookie;
  }

  async request(type, params = {}) {
    let finalParams = { TYPE: type, ...params };

    if (PRIVATE_TYPES.has(type)) {
      finalParams.USERNAME = this.username;
      finalParams.PASSWORD = this.password;
    }

    if (PUBLIC_TYPES.has(type) && this.apiKey) {
      finalParams.APIKEY = this.apiKey;
    }

    finalParams.JSON = 1;

    const url = buildUrl(this.host, this.year, "export", finalParams);

    const res = await fetch(url, {
      headers: { Cookie: this.cookie || "" }
    });

    if (!res.ok) throw new Error(`MFL request failed: ${res.status}`);

    return res.json();
  }

  async getLeague(leagueId) {
    return this.request("league", { L: leagueId });
  }

  async getMyLeagues() {
    const raw = await this.request("myleagues", {});

    if (raw?.myleagues?.league) {
      return raw;
    }

    if (raw?.Leagues?.League) {
      return {
        myleagues: {
          league: raw.Leagues.League.map((l) => ({
            id: l.league_id,
            franchise: l.franchise_id,
            franchiseName: l.franchise_name || "",
            name: l.name || "",
            commissioner: l.is_commissioner === "1"
          }))
        }
      };
    }

    return { myleagues: { league: [] } };
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
