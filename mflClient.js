const axios = require('axios');

class MFLClient {
  constructor({
    year,
    host = 'www.myfantasyleague.com',   // ⭐ export host
    cookie = null,
    apiKey = null
  }) {
    this.year = year;
    this.host = host;
    this.cookie = cookie;
    this.apiKey = apiKey;
  }

  // ⭐ All EXPORT calls must use wwwXX.myfantasyleague.com
  async request(command, params = {}, { json = true } = {}) {
    const baseUrl = `https://${this.host}/${this.year}/export`;
    const query = new URLSearchParams(params);

    if (json) query.set('JSON', '1');
    if (this.apiKey) query.set('APIKEY', this.apiKey);

    const url = `${baseUrl}?${query.toString()}`;

    const headers = {};
    if (this.cookie) headers['Cookie'] = this.cookie;

    const res = await axios.get(url, { headers });
    return res.data;
  }

  // ⭐ Login MUST use api.myfantasyleague.com
  async login(username, password) {
    const loginHost = "api.myfantasyleague.com";
    const url = `https://${loginHost}/${this.year}/login`;

    const params = new URLSearchParams({
      USERNAME: username,
      PASSWORD: password,
      XML: '1'
    });

    const res = await axios.post(`${url}?${params.toString()}`);

    const setCookie = res.headers['set-cookie'];
    if (!setCookie) throw new Error('Login failed: no cookie returned');

    const decodedCookies = setCookie.map(c => {
      const [name, value] = c.split(';')[0].split('=');
      const decoded = decodeURIComponent(value || '');
      const reencoded = encodeURIComponent(decoded);
      return `${name}=${reencoded}`;
    });

    this.cookie = decodedCookies.join('; ');
    return this.cookie;
  }

  async getLeague(leagueId) {
    return this.request('export', { TYPE: 'league', L: leagueId });
  }

  async getStandings(leagueId, week) {
    const params = { TYPE: 'standings', L: leagueId };
    if (week) params.W = week;
    return this.request('export', params);
  }

  async getRosters(leagueId) {
    return this.request('export', { TYPE: 'rosters', L: leagueId });
  }

  async getPlayers() {
    return this.request('export', { TYPE: 'players' });
  }
}

module.exports = MFLClient;
