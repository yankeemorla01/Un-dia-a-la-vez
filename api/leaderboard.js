import { getPool, initDB } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDB();
    const pool = getPool();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const competitionId = req.query.id;
    if (!competitionId) {
      return res.status(400).json({ error: 'Competition id is required' });
    }

    // Verify user is a member
    const { rows: memberCheck } = await pool.query(
      'SELECT 1 FROM udv_competition_members WHERE competition_id = $1 AND user_id = $2',
      [competitionId, userId]
    );
    if (memberCheck.length === 0) {
      return res.status(403).json({ error: 'Not a member of this competition' });
    }

    // Get competition details
    const { rows: compRows } = await pool.query(
      'SELECT id, name, invite_code, start_date, end_date, created_by FROM udv_competitions WHERE id = $1',
      [competitionId]
    );
    if (compRows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    const competition = compRows[0];

    // Get all members with their marked days count within the competition date range
    const { rows: members } = await pool.query(
      `SELECT cm.user_id, cm.display_name, cm.photo_url, cm.joined_at,
              COUNT(md.day_key) as days_completed
       FROM udv_competition_members cm
       LEFT JOIN udv_user_marked_days md
         ON md.user_id = cm.user_id
         AND md.marked = true
         AND md.day_key >= $2
         AND ($3::varchar IS NULL OR md.day_key <= $3)
       WHERE cm.competition_id = $1
       GROUP BY cm.user_id, cm.display_name, cm.photo_url, cm.joined_at
       ORDER BY days_completed DESC, cm.joined_at ASC`,
      [competitionId, competition.start_date, competition.end_date || null]
    );

    // Calculate total possible days
    const startDate = new Date(competition.start_date);
    const endDate = competition.end_date ? new Date(competition.end_date) : new Date();
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    const leaderboard = members.map((m, idx) => ({
      position: idx + 1,
      user_id: m.user_id,
      display_name: m.display_name,
      photo_url: m.photo_url,
      days_completed: parseInt(m.days_completed),
      total_days: totalDays,
      is_me: m.user_id === userId,
    }));

    return res.json({
      competition,
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
