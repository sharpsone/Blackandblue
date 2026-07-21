const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Force IPv4
  family: 4
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
