import { getPool, initDB, migrateLegacyData } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (userId) {
      // Si es el primer usuario, migrar datos legacy automaticamente
      await migrateLegacyData(userId);

      const { rows: syncRows } = await pool.query(
        'SELECT version FROM udv_user_sync WHERE user_id = $1', [userId]
      );
      const currentVersion = syncRows[0]?.version || 0;
      const clientVersion = parseInt(req.query.v || '0');

      if (clientVersion === currentVersion) {
        return res.json({ changed: false, version: currentVersion });
      }

      const { rows: settingsRows } = await pool.query(
        'SELECT goal, view_mode FROM udv_user_settings WHERE user_id = $1', [userId]
      );
      const { rows: markedRows } = await pool.query(
        'SELECT day_key FROM udv_user_marked_days WHERE user_id = $1 AND marked = true', [userId]
      );

      const marked = {};
      markedRows.forEach(r => { marked[r.day_key] = true; });

      return res.json({
        changed: true,
        version: currentVersion,
        settings: settingsRows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' },
        marked,
      });
    }

    // Fallback: legacy (no auth)
    const { rows: syncRows } = await pool.query('SELECT version FROM udv_sync WHERE id = 1');
    const currentVersion = syncRows[0]?.version || 0;
    const clientVersion = parseInt(req.query.v || '0');

    if (clientVersion === currentVersion) {
      return res.json({ changed: false, version: currentVersion });
    }

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
