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
      'SELECT id, name, invite_code, goal_id, start_date, end_date, created_by FROM udv_competitions WHERE id = $1',
      [competitionId]
    );
    if (compRows.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    const competition = compRows[0];

    const goalFilter = competition.goal_id
      ? 'AND d.goal_id = $2'
      : 'AND d.goal_id IS NULL';
    const goalParams = competition.goal_id ? [competitionId, competition.goal_id] : [competitionId];

    // Single query: get members with their marked days in one shot
    const { rows: members } = await pool.query(
      `SELECT cm.user_id, cm.display_name, cm.photo_url, cm.joined_at,
              COALESCE(array_agg(d.day_key) FILTER (WHERE d.day_key IS NOT NULL), '{}') as day_keys
       FROM udv_competition_members cm
       LEFT JOIN udv_user_marked_days d
         ON d.user_id = cm.user_id AND d.marked = true ${goalFilter}
       WHERE cm.competition_id = $1
       GROUP BY cm.user_id, cm.display_name, cm.photo_url, cm.joined_at`,
      goalParams
    );

    // Calculate days_completed + streak per member from aggregated data
    for (const m of members) {
      const daySet = new Set(Array.isArray(m.day_keys) ? m.day_keys : []);
      m.days_completed = daySet.size;
      delete m.day_keys;

      let streak = 0;
      const d = new Date();
      let key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!daySet.has(key)) {
        d.setDate(d.getDate() - 1);
        key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!daySet.has(key)) { m.streak = 0; continue; }
      }
      while (daySet.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      m.streak = streak;
    }

    // Sort by days_completed DESC, then by join date ASC
    members.sort((a, b) => b.days_completed - a.days_completed || new Date(a.joined_at) - new Date(b.joined_at));

    // Total possible days = days elapsed this year so far
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const totalDays = Math.max(1, Math.ceil((now - yearStart) / (1000 * 60 * 60 * 24)) + 1);

    const leaderboard = members.map((m, idx) => ({
      position: idx + 1,
      user_id: m.user_id,
      display_name: m.display_name,
      photo_url: m.photo_url,
      days_completed: m.days_completed,
      total_days: totalDays,
      streak: m.streak || 0,
      is_me: m.user_id === userId,
    }));

    return res.json({
      competition,
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
