const axios = require('axios');

class MFLClient {
  constructor({ year = '2026', host = 'api.myfantasyleague.com', cookie = null, apiKey = null }) {
    this.year = year;
    this.host = host;
    this.cookie = cookie;
    this.apiKey = apiKey;
  }

  async request(command, params = {}, { json = true } = {}) {
    const baseUrl = `https://${this.host}/${this.year}/${command}`;
    const query = new URLSearchParams(params);

    if (json) {
      query.set('JSON', '1');
    }

    if (this.apiKey) {
      query.set('APIKEY', this.apiKey);
    }

    const url = `${baseUrl}?${query.toString()}`;

    const headers = {};

    // ⭐ Send ALL cookies exactly as decoded
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    try {
      const res = await axios.get(url, { headers });
      return res.data;
    } catch (err) {
      console.error('MFL request error:', err.message);
      throw err;
    }
  }

  async login(username, password) {
    const url = `https://api.myfantasyleague.com/${this.year}/login`;
    const params = new URLSearchParams({
      USERNAME: username,
      PASSWORD: password,
      XML: '1'
    });

    const res = await axios.post(`${url}?${params.toString()}`, null, {
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });

    const setCookie = res.headers['set-cookie'];
    if (!setCookie) {
      throw new Error('Login failed: no cookie returned');
    }

    console.log("SET-COOKIE RAW:", setCookie);

    // ⭐ Decode each cookie value
    const decodedCookies = setCookie.map(c => {
      const [name, value] = c.split(';')[0].split('=');
      return `${name}=${decodeURIComponent(value || '')}`;
    });

    // ⭐ Join into a single Cookie header
    this.cookie = decodedCookies.join('; ');

    console.log("FINAL COOKIE HEADER:", this.cookie);

    return this.cookie;
  }

  async getLeague(leagueId) {
    return this.request('export', { TYPE: 'league', L: leagueId }, { json: true });
  }

  async getStandings(leagueId, week) {
    const params = { TYPE: 'standings', L: leagueId };
    if (week) params.W = week;
    return this.request('export', params, { json: true });
}

  async getRosters(leagueId) {
    return this.request('export', { TYPE: 'rosters', L: leagueId }, { json: true });
  }

  async getPlayers() {
    return this.request('export', { TYPE: 'players' }, { json: true });
  }
}

module.exports = MFLClient;
