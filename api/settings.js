import { getPool, initDB, bumpVersion } from './_db.js';

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT goal, view_mode FROM udv_settings WHERE id = 1');
      return res.json(rows[0] || { goal: 'Mi Meta Diaria', view_mode: 'month' });
    }

    if (req.method === 'PUT') {
      const { goal, view_mode } = req.body;
      const fields = [];
      const values = [];
      let i = 1;

      if (goal !== undefined) { fields.push(`goal = $${i++}`); values.push(goal); }
      if (view_mode !== undefined) { fields.push(`view_mode = $${i++}`); values.push(view_mode); }

      if (fields.length > 0) {
        await pool.query(`UPDATE udv_settings SET ${fields.join(', ')} WHERE id = 1`, values);
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
