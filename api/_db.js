import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.MONGODB_URI,
      ssl: false,
      max: 2,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

// Schema version — bump when adding new migrations
const SCHEMA_VERSION = 1;
let initialized = false;

export async function initDB() {
  if (initialized) return;
  const p = getPool();

  // Create migration tracking table (lightweight, always safe to run)
  await p.query(`
    CREATE TABLE IF NOT EXISTS udv_schema_version (
      id INTEGER PRIMARY KEY DEFAULT 1,
      version INTEGER DEFAULT 0,
      CHECK (id = 1)
    );
    INSERT INTO udv_schema_version (id, version) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
  `);

  const { rows } = await p.query('SELECT version FROM udv_schema_version WHERE id = 1');
  const currentVersion = rows[0]?.version || 0;

  if (currentVersion >= SCHEMA_VERSION) {
    initialized = true;
    return;
  }

  // Run full migration only when schema version is behind
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

    CREATE TABLE IF NOT EXISTS udv_user_goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      name VARCHAR(200) NOT NULL,
      emoji VARCHAR(10) DEFAULT '📖',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    DO $$ BEGIN
      ALTER TABLE udv_user_marked_days ADD COLUMN goal_id UUID;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'udv_user_marked_days_unique'
      ) THEN
        ALTER TABLE udv_user_marked_days DROP CONSTRAINT IF EXISTS udv_user_marked_days_pkey;
        ALTER TABLE udv_user_marked_days ADD CONSTRAINT udv_user_marked_days_unique UNIQUE (user_id, day_key, goal_id);
      END IF;
    END $$;

    DELETE FROM udv_user_marked_days a
    USING udv_user_marked_days b
    WHERE a.goal_id IS NULL AND b.goal_id IS NULL
      AND a.user_id = b.user_id AND a.day_key = b.day_key
      AND a.ctid < b.ctid;

    CREATE UNIQUE INDEX IF NOT EXISTS udv_marked_days_null_goal_idx
      ON udv_user_marked_days (user_id, day_key) WHERE goal_id IS NULL;

    CREATE TABLE IF NOT EXISTS udv_competitions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      invite_code VARCHAR(8) UNIQUE NOT NULL,
      goal_id UUID,
      start_date VARCHAR(20) NOT NULL,
      end_date VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );

    DO $$ BEGIN
      ALTER TABLE udv_competitions ADD COLUMN goal_id UUID;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS udv_competition_members (
      competition_id UUID NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      photo_url TEXT,
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (competition_id, user_id)
    );

    DO $$ BEGIN
      ALTER TABLE udv_competition_members ADD COLUMN photo_url TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON udv_user_goals (user_id);
    CREATE INDEX IF NOT EXISTS idx_user_marked_days_user_marked ON udv_user_marked_days (user_id, marked) WHERE marked = true;
    CREATE INDEX IF NOT EXISTS idx_competition_members_user_id ON udv_competition_members (user_id);

    -- Mark migration complete
    UPDATE udv_schema_version SET version = ${SCHEMA_VERSION} WHERE id = 1;
  `);

  initialized = true;
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
