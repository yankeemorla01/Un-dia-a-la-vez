import { getPool, initDB } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDB();
    const pool = getPool();

    // Obtener version actual
    const { rows: syncRows } = await pool.query('SELECT version FROM udv_sync WHERE id = 1');
    const currentVersion = syncRows[0]?.version || 0;

    // Si el cliente ya tiene esta version, no hay cambios
    const clientVersion = parseInt(req.query.v || '0');
    if (clientVersion === currentVersion) {
      return res.json({ changed: false, version: currentVersion });
    }

    // Hay cambios: enviar todo el estado actual
    const { rows: settingsRows } = await pool.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
    const { rows: markedRows } = await pool.query('SELECT day_key FROM udv_marked_days WHERE marked = true');

    const marked = {};
    markedRows.forEach(r => { marked[r.day_key] = true; });

    res.json({
      changed: true,
      version: currentVersion,
      settings: settingsRows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' },
      marked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
