import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.MONGODB_URI,
  ssl: false,
});

let version = 0;

async function initDB() {
  await pool.query(`
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
  const { rows } = await pool.query('SELECT version FROM udv_sync WHERE id = 1');
  version = rows[0]?.version || 0;
  console.log('Tablas udv_ listas, version:', version);
}

async function bumpVersion() {
  await pool.query('UPDATE udv_sync SET version = version + 1 WHERE id = 1');
  version++;
}

// GET /api/sync?v=N
app.get('/api/sync', async (req, res) => {
  try {
    const clientVersion = parseInt(req.query.v || '0');
    if (clientVersion === version) {
      return res.json({ changed: false, version });
    }

    const { rows: settingsRows } = await pool.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
    const { rows: markedRows } = await pool.query('SELECT day_key FROM udv_marked_days WHERE marked = true');
    const marked = {};
    markedRows.forEach(r => { marked[r.day_key] = true; });

    res.json({ changed: true, version, settings: settingsRows[0], marked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
    res.json(rows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener settings' });
  }
});

// PUT /api/settings
app.put('/api/settings', async (req, res) => {
  try {
    const { goal, view_mode } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (goal !== undefined) { fields.push(`goal = $${i++}`); values.push(goal); }
    if (view_mode !== undefined) { fields.push(`view_mode = $${i++}`); values.push(view_mode); }

    if (fields.length === 0) return res.json({ ok: true });

    await pool.query(`UPDATE udv_settings SET ${fields.join(', ')} WHERE id = 1`, values);
    await bumpVersion();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar settings' });
  }
});

// GET /api/marked
app.get('/api/marked', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT day_key FROM udv_marked_days WHERE marked = true');
    const marked = {};
    rows.forEach(r => { marked[r.day_key] = true; });
    res.json(marked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dias' });
  }
});

// POST /api/marked
app.post('/api/marked', async (req, res) => {
  try {
    const { day_key, marked } = req.body;
    if (marked) {
      await pool.query(
        'INSERT INTO udv_marked_days (day_key, marked) VALUES ($1, true) ON CONFLICT (day_key) DO UPDATE SET marked = true',
        [day_key]
      );
    } else {
      await pool.query('DELETE FROM udv_marked_days WHERE day_key = $1', [day_key]);
    }
    await bumpVersion();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar dia' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Servidor UDV corriendo en http://localhost:${PORT}`));
}).catch(err => {
  console.error('Error conectando a la base de datos:', err);
  process.exit(1);
});
