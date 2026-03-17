import { getPool, initDB, bumpVersion } from './_db.js';
import { getUserId } from './_auth.js';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req, res) {
  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // GET - List competitions the user is part of
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.invite_code, c.start_date, c.end_date, c.created_by, c.created_at,
                cm.display_name as my_display_name,
                (SELECT COUNT(*) FROM udv_competition_members WHERE competition_id = c.id) as member_count
         FROM udv_competitions c
         JOIN udv_competition_members cm ON cm.competition_id = c.id AND cm.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );
      return res.json(rows);
    }

    // POST - Create a new competition
    if (req.method === 'POST') {
      const { name, display_name, start_date, end_date } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!display_name || !display_name.trim()) {
        return res.status(400).json({ error: 'Display name is required' });
      }

      const inviteCode = generateInviteCode();
      const startDate = start_date || new Date().toISOString().split('T')[0];

      const { rows } = await pool.query(
        `INSERT INTO udv_competitions (name, created_by, invite_code, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, invite_code, start_date, end_date, created_at`,
        [name.trim(), userId, inviteCode, startDate, end_date || null]
      );

      // Creator joins automatically
      await pool.query(
        'INSERT INTO udv_competition_members (competition_id, user_id, display_name) VALUES ($1, $2, $3)',
        [rows[0].id, userId, display_name.trim()]
      );

      return res.json({ ...rows[0], member_count: 1 });
    }

    // DELETE - Delete a competition (only creator)
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Competition id is required' });
      }

      const { rows } = await pool.query(
        'SELECT created_by FROM udv_competitions WHERE id = $1',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Competition not found' });
      }
      if (rows[0].created_by !== userId) {
        return res.status(403).json({ error: 'Only the creator can delete a competition' });
      }

      await pool.query('DELETE FROM udv_competition_members WHERE competition_id = $1', [id]);
      await pool.query('DELETE FROM udv_competitions WHERE id = $1', [id]);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
