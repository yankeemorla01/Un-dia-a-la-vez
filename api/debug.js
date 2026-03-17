export default async function handler(req, res) {
  try {
    const { getPool, initDB } = await import('./_db.js');
    await initDB();
    const pool = getPool();
    const { rows } = await pool.query('SELECT 1 as test');
    res.json({ ok: true, db: rows[0], env: !!process.env.MONGODB_URI });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0, 5) });
  }
}
