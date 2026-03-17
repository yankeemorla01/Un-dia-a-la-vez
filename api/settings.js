import { getPool, initDB, bumpVersion } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (req.method === 'GET') {
      if (userId) {
        const { rows } = await pool.query('SELECT goal, view_mode FROM udv_user_settings WHERE user_id = $1', [userId]);
        return res.json(rows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' });
      }
      const { rows } = await pool.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
      return res.json(rows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' });
    }

    if (req.method === 'PUT') {
      const { goal, view_mode } = req.body;

      if (userId) {
        await pool.query(
          `INSERT INTO udv_user_settings (user_id, goal, view_mode) VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET
             goal = COALESCE($2, udv_user_settings.goal),
             view_mode = COALESCE($3, udv_user_settings.view_mode)`,
          [userId, goal || null, view_mode || null]
        );
        await bumpVersion(userId);
      } else {
        const fields = [];
        const values = [];
        let i = 1;
        if (goal !== undefined) { fields.push(`goal = $${i++}`); values.push(goal); }
        if (view_mode !== undefined) { fields.push(`view_mode = $${i++}`); values.push(view_mode); }
        if (fields.length > 0) {
          await pool.query(`UPDATE udv_settings SET ${fields.join(', ')} WHERE id = 1`, values);
          await bumpVersion();
        }
      }
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
