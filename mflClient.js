const fetch = global.fetch;

// ⭐ Utility: build URL with query params
function buildUrl(host, year, endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `https://${host}/${year}/${endpoint}${query ? "?" + query : ""}`;
}

class MFLClient {
  constructor({ year, host, cookie = null, apiKey = null }) {
    this.year = year;
    this.host = host;          // ⭐ dynamic host (www44, www03, etc.)
    this.cookie = cookie;      // ⭐ login cookie
    this.apiKey = apiKey;      // ⭐ league API key
  }

  // ⭐ LOGIN — must use API host, not wwwXX
  async login(username, password) {
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

  // ⭐ Generic request helper
  async request(endpoint, params = {}) {
    const url = buildUrl(this.host, this.year, "export", {
      ...params,
      APIKEY: this.apiKey,
      JSON: 1
    });

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

  // ⭐ League Info
  async getLeague(leagueId) {
    return this.request("league", { L: leagueId });
  }

  // ⭐ Standings
  async getStandings(leagueId) {
    return this.request("leagueStandings", { L: leagueId });
  }

  // ⭐ Rosters
  async getRosters(leagueId) {
    return this.request("rosters", { L: leagueId });
  }

  // ⭐ Live Scoring
  async getLiveScoring(leagueId) {
    return this.request("liveScoring", { L: leagueId });
  }

  // ⭐ Schedule / Matchups
  async getSchedule(leagueId) {
    return this.request("schedule", { L: leagueId });
  }

  // ⭐ Free Agents
  async getFreeAgents(leagueId) {
    return this.request("freeAgents", { L: leagueId });
  }

  // ⭐ Message Board
  async getMessageBoard(leagueId) {
    return this.request("messageBoard", { L: leagueId });
  }

  // ⭐ Transactions
  async getTransactions(leagueId) {
    return this.request("transactions", { L: leagueId });
  }

  // ⭐ Player Stats
  async getPlayerStats(leagueId) {
    return this.request("playerStats", { L: leagueId });
  }

  // ⭐ Draft Results
  async getDraftResults(leagueId) {
    return this.request("draftResults", { L: leagueId });
  }

  // ⭐ Playoff Bracket
  async getPlayoffBracket(leagueId) {
    return this.request("playoffBracket", { L: leagueId });
  }
}

module.exports = MFLClient;
