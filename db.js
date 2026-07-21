const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Force IPv4 instead of IPv6
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  host: process.env.DATABASE_URL.split('@')[1].split(':')[0]
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
