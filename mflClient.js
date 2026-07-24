const fetch = global.fetch;

// ⭐ Utility: build URL with query params
function buildUrl(host, year, endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `https://${host}/${year}/${endpoint}${query ? "?" + query : ""}`;
}

class MFLClient {
  constructor({ year, host, cookie = null, apiKey = null }) {
    this.year = year;
    this.host = host;
    this.cookie = cookie;
    this.apiKey = apiKey;
  }

  // ⭐ LOGIN — must use API host
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

 async request(type, params = {}) {
  const url = buildUrl(this.host, this.year, "export", {
    TYPE: type,
    ...params,
    APIKEY: this.apiKey
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

  // ⭐ Correct MFL endpoints
  async getLeague(leagueId) {
    return this.request("league", { L: leagueId });
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
