import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  try {
    const shortcutData = readFileSync(join(__dirname, '..', 'public', 'lector-tts-signed.shortcut'));

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="Lector TTS.shortcut"');
    res.setHeader('Content-Length', shortcutData.length);
    res.send(shortcutData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error serving shortcut');
  }
}
