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
    if (this.cookie) {
      headers['Cookie'] = `MFL_USER_ID=${this.cookie}`;
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

    const cookie = setCookie.find(c => c.startsWith('MFL_USER_ID='));
    const value = cookie.split(';')[0].split('=')[1];

    this.cookie = value;
    return value;
  }

  async getLeague(leagueId) {
    return this.request('export', { TYPE: 'league', L: leagueId }, { json: true });
  }


  async getStandings(leagueId, week) {
  const params = { L: leagueId };
  if (week) params.W = week;
  return this.request('standings', params, { json: true });
  }


  async getRosters(leagueId) {
    return this.request('export', { TYPE: 'rosters', L: leagueId }, { json: true });
  }


  async getPlayers() {
    return this.request('export', { TYPE: 'players' });
  }
}

module.exports = MFLClient;
