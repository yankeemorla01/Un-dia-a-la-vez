export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ttsUrl = process.env.TTS_API_URL;
    const ttsKey = process.env.TTS_API_KEY;

    if (!ttsUrl || !ttsKey) {
      return res.status(500).json({ error: 'TTS not configured' });
    }

    const { text, voice, style } = req.body;

    if (!text || !voice) {
      return res.status(400).json({ error: 'Missing text or voice' });
    }

    const body = { text, voice };
    if (style) body.style = style;

    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ttsKey,
      },
      body: JSON.stringify(body),
    });

    if (!ttsRes.ok) {
      return res.status(502).json({ error: 'TTS service error' });
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    res.setHeader('Content-Type', ttsRes.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
