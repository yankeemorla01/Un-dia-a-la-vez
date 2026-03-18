import { getPool, initDB } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { invite_code, display_name, photo_url } = req.body;
    if (!invite_code || !invite_code.trim()) {
      return res.status(400).json({ error: 'Invite code is required' });
    }
    if (!display_name || !display_name.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const { rows } = await pool.query(
      'SELECT id, name FROM udv_competitions WHERE invite_code = $1',
      [invite_code.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const competition = rows[0];

    // Check if already a member
    const { rows: existing } = await pool.query(
      'SELECT 1 FROM udv_competition_members WHERE competition_id = $1 AND user_id = $2',
      [competition.id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already a member of this competition' });
    }

    await pool.query(
      'INSERT INTO udv_competition_members (competition_id, user_id, display_name, photo_url) VALUES ($1, $2, $3, $4)',
      [competition.id, userId, display_name.trim(), photo_url || null]
    );

    return res.json({ ok: true, competition_id: competition.id, competition_name: competition.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
