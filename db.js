const mysql = require('mysql2/promise');
require('dotenv').config();

const pools = new Map();

function getPool(dbName = process.env.DB_NAME) {
    const name = dbName || '';
    if (pools.has(name)) return pools.get(name);
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: name || undefined,
        port: Number(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    pools.set(name, pool);
    return pool;
}

async function closeAllPools() {
    await Promise.all([...pools.values()].map(p => p.end()));
    pools.clear();
}

module.exports = { getPool, closeAllPools };
