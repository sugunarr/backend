const mysql = require('mysql2/promise');

let pool;

/**
 * Initialize MySQL connection pool
 */
async function initializePool() {
  if (pool) return pool;

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'payment_support_ops',
    waitForConnections: true,
    connectionLimit: 10,
  };

  console.log(
    `Initializing MySQL pool: ${config.host}:${config.port}/${config.database}`
  );

  pool = mysql.createPool(config);

  // Test connection
  const conn = await pool.getConnection();
  conn.release();

  console.log('✓ MySQL pool connected');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('DB pool not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Execute query with positional params ONLY
 */
async function query(sql, params = []) {
  const p = getPool();

  try {
    console.log('[DB] SQL:', sql.trim());
    console.log('[DB] Params:', params.map(v => [v, typeof v]));

    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('✗ MySQL query error:', err.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL pool closed');
  }
}

module.exports = {
  initializePool,
  getPool,
  query,
  queryOne,
  closePool,
};
