import { getPool, initDB, bumpVersion } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (req.method === 'GET') {
      if (userId) {
        const { rows } = await pool.query('SELECT day_key FROM udv_user_marked_days WHERE user_id = $1 AND marked = true', [userId]);
        const marked = {};
        rows.forEach(r => { marked[r.day_key] = true; });
        return res.json(marked);
      }
      const { rows } = await pool.query('SELECT day_key FROM udv_marked_days WHERE marked = true');
      const marked = {};
      rows.forEach(r => { marked[r.day_key] = true; });
      return res.json(marked);
    }

    if (req.method === 'POST') {
      const { day_key, marked } = req.body;

      if (userId) {
        if (marked) {
          await pool.query(
            'INSERT INTO udv_user_marked_days (user_id, day_key, marked) VALUES ($1, $2, true) ON CONFLICT (user_id, day_key) DO UPDATE SET marked = true',
            [userId, day_key]
          );
        } else {
          await pool.query('DELETE FROM udv_user_marked_days WHERE user_id = $1 AND day_key = $2', [userId, day_key]);
        }
        await bumpVersion(userId);
      } else {
        if (marked) {
          await pool.query(
            'INSERT INTO udv_marked_days (day_key, marked) VALUES ($1, true) ON CONFLICT (day_key) DO UPDATE SET marked = true',
            [day_key]
          );
        } else {
          await pool.query('DELETE FROM udv_marked_days WHERE day_key = $1', [day_key]);
        }
        await bumpVersion();
      }
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
