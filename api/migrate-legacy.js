import { getPool, initDB, migrateLegacyData } from './_db.js';
import { getUserId } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDB();
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const migrated = await migrateLegacyData(userId);

    if (migrated) {
      res.json({ ok: true, message: 'Legacy data migrated to your account' });
    } else {
      res.json({ ok: true, message: 'Already migrated or no legacy data' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
