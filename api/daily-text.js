import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load data once
let dailyReadings = null;
let ttsStyles = null;
let abbrToFull = null;

function loadData() {
  if (!dailyReadings) {
    dailyReadings = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'dailyReadings.json'), 'utf-8'));
    ttsStyles = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'ttsStyles.json'), 'utf-8'));
    abbrToFull = {
      "Gén.": "Génesis", "Éx.": "Éxodo", "Lev.": "Levítico", "Núm.": "Números",
      "Deut.": "Deuteronomio", "Jos.": "Josué", "Jue.": "Jueces",
      "1 Sam.": "1 Samuel", "2 Sam.": "2 Samuel", "1 Rey.": "1 Reyes", "2 Rey.": "2 Reyes",
      "1 Crón.": "1 Crónicas", "2 Crón.": "2 Crónicas", "Esd.": "Esdras", "Neh.": "Nehemías",
      "Est.": "Ester", "Sal.": "Salmos", "Prov.": "Proverbios", "Ecl.": "Eclesiastés",
      "Cant.": "Cantar de los Cantares", "Is.": "Isaías", "Jer.": "Jeremías",
      "Lam.": "Lamentaciones", "Ezeq.": "Ezequiel", "Dan.": "Daniel", "Os.": "Oseas",
      "Abd.": "Abdías", "Jon.": "Jonás", "Miq.": "Miqueas", "Nah.": "Nahúm",
      "Hab.": "Habacuc", "Sof.": "Sofonías", "Zac.": "Zacarías", "Mal.": "Malaquías",
      "Mat.": "Mateo", "Mar.": "Marcos", "Luc.": "Lucas", "Hech.": "Hechos",
      "Rom.": "Romanos", "1 Cor.": "1 Corintios", "2 Cor.": "2 Corintios",
      "Gál.": "Gálatas", "Efes.": "Efesios", "Filip.": "Filipenses", "Col.": "Colosenses",
      "1 Tes.": "1 Tesalonicenses", "2 Tes.": "2 Tesalonicenses",
      "1 Tim.": "1 Timoteo", "2 Tim.": "2 Timoteo", "Filem.": "Filemón",
      "Heb.": "Hebreos", "Sant.": "Santiago", "1 Ped.": "1 Pedro", "2 Ped.": "2 Pedro",
      "Jud.": "Judas", "Apoc.": "Apocalipsis",
    };
  }
}

function expandAbbreviations(text) {
  let result = text;
  const sorted = Object.entries(abbrToFull).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, full] of sorted) {
    result = result.replaceAll(abbr, full);
  }
  return result;
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function handler(req, res) {
  // Allow CORS for Shortcuts
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    loadData();

    const now = new Date();
    const key = `2026-${now.getMonth()}-${now.getDate()}`;
    const reading = dailyReadings[key];

    if (!reading) {
      return res.status(404).json({ error: 'No hay lectura para hoy' });
    }

    const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
    const styles = ttsStyles[key] || {};

    // ?format=audio — return TTS audio
    if (req.query.format === 'audio') {
      const ttsUrl = process.env.VITE_TTS_API_URL;
      const ttsKey = process.env.VITE_TTS_API_KEY;

      if (!ttsUrl || !ttsKey) {
        return res.status(500).json({ error: 'TTS not configured' });
      }

      const voice = req.query.part === 'commentary'
        ? 'es-MX-JorgeNeural'
        : 'es-MX-DaliaNeural';
      const style = req.query.part === 'commentary'
        ? styles.commentaryStyle
        : styles.textStyle;
      const text = req.query.part === 'commentary'
        ? expandAbbreviations(reading.commentary)
        : expandAbbreviations(reading.text);

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
    }

    // Default: return JSON with text
    res.json({
      date: dateStr,
      key,
      text: reading.text,
      textExpanded: expandAbbreviations(reading.text),
      commentary: reading.commentary,
      commentaryExpanded: expandAbbreviations(reading.commentary),
      source: reading.source,
      styles,
      audioUrls: {
        text: `/api/daily-text?format=audio&part=text`,
        commentary: `/api/daily-text?format=audio&part=commentary`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
