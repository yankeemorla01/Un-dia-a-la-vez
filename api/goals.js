import { getPool, initDB, bumpVersion } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // GET - List user's goals
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT id, name, emoji, sort_order, is_active, created_at FROM udv_user_goals WHERE user_id = $1 ORDER BY sort_order, created_at',
        [userId]
      );
      return res.json(rows);
    }

    // POST - Create a new goal
    if (req.method === 'POST') {
      const { name, emoji } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*) as cnt FROM udv_user_goals WHERE user_id = $1',
        [userId]
      );
      const sortOrder = parseInt(countRows[0].cnt);

      const { rows } = await pool.query(
        'INSERT INTO udv_user_goals (user_id, name, emoji, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, name, emoji, sort_order, is_active, created_at',
        [userId, name.trim(), emoji || '📖', sortOrder]
      );
      await bumpVersion(userId);
      return res.json(rows[0]);
    }

    // PUT - Update a goal
    if (req.method === 'PUT') {
      const { id, name, emoji, is_active } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Goal id is required' });
      }

      const fields = [];
      const values = [id, userId];
      let i = 3;

      if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name.trim()); }
      if (emoji !== undefined) { fields.push(`emoji = $${i++}`); values.push(emoji); }
      if (is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(is_active); }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { rowCount } = await pool.query(
        `UPDATE udv_user_goals SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2`,
        values
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      await bumpVersion(userId);
      return res.json({ ok: true });
    }

    // DELETE - Delete a goal and its marked days
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Goal id is required' });
      }

      await pool.query(
        'DELETE FROM udv_user_marked_days WHERE user_id = $1 AND goal_id = $2',
        [userId, id]
      );
      const { rowCount } = await pool.query(
        'DELETE FROM udv_user_goals WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      await bumpVersion(userId);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
