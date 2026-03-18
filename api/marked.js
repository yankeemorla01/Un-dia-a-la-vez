import { getPool, initDB, bumpVersion } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (req.method === 'GET') {
      if (userId) {
        const goalId = req.query.goal_id || null;
        let rows;
        if (goalId) {
          ({ rows } = await pool.query(
            'SELECT day_key FROM udv_user_marked_days WHERE user_id = $1 AND goal_id = $2 AND marked = true',
            [userId, goalId]
          ));
        } else {
          ({ rows } = await pool.query(
            'SELECT day_key FROM udv_user_marked_days WHERE user_id = $1 AND goal_id IS NULL AND marked = true',
            [userId]
          ));
        }
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
      const { day_key, marked, goal_id } = req.body;

      if (userId) {
        const goalId = goal_id || null;
        if (marked) {
          if (goalId) {
            await pool.query(
              `INSERT INTO udv_user_marked_days (user_id, day_key, goal_id, marked) VALUES ($1, $2, $3, true)
               ON CONFLICT ON CONSTRAINT udv_user_marked_days_unique DO UPDATE SET marked = true`,
              [userId, day_key, goalId]
            );
          } else {
            await pool.query(
              `INSERT INTO udv_user_marked_days (user_id, day_key, goal_id, marked) VALUES ($1, $2, NULL, true)
               ON CONFLICT (user_id, day_key) WHERE goal_id IS NULL DO UPDATE SET marked = true`,
              [userId, day_key]
            );
          }
        } else {
          if (goalId) {
            await pool.query('DELETE FROM udv_user_marked_days WHERE user_id = $1 AND day_key = $2 AND goal_id = $3', [userId, day_key, goalId]);
          } else {
            await pool.query('DELETE FROM udv_user_marked_days WHERE user_id = $1 AND day_key = $2 AND goal_id IS NULL', [userId, day_key]);
          }
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
    res.status(500).json({ error: 'Server error' });
  }
}
