import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.MONGODB_URI,
      ssl: false,
    });
  }
  return pool;
}

export async function initDB() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS udv_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      goal TEXT DEFAULT 'Mi Meta Diaria',
      view_mode VARCHAR(10) DEFAULT 'month',
      CHECK (id = 1)
    );
    CREATE TABLE IF NOT EXISTS udv_marked_days (
      day_key VARCHAR(20) PRIMARY KEY,
      marked BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS udv_sync (
      id INTEGER PRIMARY KEY DEFAULT 1,
      version INTEGER DEFAULT 0,
      CHECK (id = 1)
    );
    INSERT INTO udv_settings (id, goal, view_mode)
    VALUES (1, 'Mi Meta Diaria', 'month')
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO udv_sync (id, version)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
  `);
}

export async function bumpVersion() {
  const p = getPool();
  await p.query('UPDATE udv_sync SET version = version + 1 WHERE id = 1');
}
