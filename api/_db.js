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

    -- Multi-user tables
    CREATE TABLE IF NOT EXISTS udv_user_settings (
      user_id VARCHAR(255) PRIMARY KEY,
      goal TEXT DEFAULT 'Mi Meta Diaria',
      view_mode VARCHAR(10) DEFAULT 'month'
    );
    CREATE TABLE IF NOT EXISTS udv_user_marked_days (
      user_id VARCHAR(255) NOT NULL,
      day_key VARCHAR(20) NOT NULL,
      marked BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, day_key)
    );
    CREATE TABLE IF NOT EXISTS udv_user_sync (
      user_id VARCHAR(255) PRIMARY KEY,
      version INTEGER DEFAULT 0
    );
  `);
}

export async function migrateLegacyData(userId) {
  const p = getPool();

  // Check if user already has data (already migrated)
  const { rows: existing } = await p.query(
    'SELECT user_id FROM udv_user_sync WHERE user_id = $1', [userId]
  );
  if (existing.length > 0) return false; // Already migrated

  // Copy legacy settings
  const { rows: settings } = await p.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
  if (settings.length > 0) {
    await p.query(
      'INSERT INTO udv_user_settings (user_id, goal, view_mode) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
      [userId, settings[0].goal, settings[0].view_mode]
    );
  }

  // Copy legacy marked days
  const { rows: days } = await p.query('SELECT day_key, marked, created_at FROM udv_marked_days');
  for (const day of days) {
    await p.query(
      'INSERT INTO udv_user_marked_days (user_id, day_key, marked, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, day_key) DO NOTHING',
      [userId, day.day_key, day.marked, day.created_at]
    );
  }

  // Copy legacy sync version
  const { rows: sync } = await p.query('SELECT version FROM udv_sync WHERE id = 1');
  const version = sync[0]?.version || 0;
  await p.query(
    'INSERT INTO udv_user_sync (user_id, version) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
    [userId, version]
  );

  return true; // Migration done
}

export async function bumpVersion(userId) {
  const p = getPool();
  if (userId) {
    await p.query(
      'INSERT INTO udv_user_sync (user_id, version) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET version = udv_user_sync.version + 1',
      [userId]
    );
  } else {
    await p.query('UPDATE udv_sync SET version = version + 1 WHERE id = 1');
  }
}
