import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let dailyReadings = null;
let ttsStyles = null;

function loadData() {
  if (!dailyReadings) {
    dailyReadings = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'dailyReadings.json'), 'utf-8'));
    ttsStyles = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'ttsStyles.json'), 'utf-8'));
  }
}

const ABBR_TO_FULL = {
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

function expandAbbreviations(text) {
  let result = text;
  const sorted = Object.entries(ABBR_TO_FULL).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, full] of sorted) {
    result = result.replaceAll(abbr, full);
  }
  return result;
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  try {
    loadData();

    const now = new Date();
    const key = `2026-${now.getMonth()}-${now.getDate()}`;
    const reading = dailyReadings[key];
    const styles = ttsStyles[key] || {};
    const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

    const textExpanded = reading ? expandAbbreviations(reading.text) : '';
    const commentaryExpanded = reading ? expandAbbreviations(reading.commentary) : '';

    const baseUrl = `https://${req.headers.host}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Texto del Día">
  <meta name="theme-color" content="#0d0c0a">
  <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%230d0c0a' width='100' height='100' rx='20'/><text y='68' x='50' text-anchor='middle' font-size='50'>📖</text></svg>">
  <title>Texto del Día</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #0d0c0a;
      color: #e8dcc0;
      min-height: 100vh;
      min-height: 100dvh;
      padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 24px 20px;
      padding-top: max(24px, env(safe-area-inset-top));
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .header-label {
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 9px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #6a5a40;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-date {
      font-size: 20px;
      color: #d4af37;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent);
      margin: 20px 0;
    }
    .text-card {
      background: linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03));
      border: 1px solid rgba(212,175,55,0.15);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section-label {
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #8a7a50;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .text-content {
      font-size: 17px;
      line-height: 1.7;
      font-style: italic;
    }
    .commentary {
      font-size: 15px;
      line-height: 1.7;
      color: #b8a880;
    }
    .source {
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 11px;
      color: #5a5040;
      font-style: italic;
      padding-top: 16px;
      border-top: 1px solid #252318;
      margin-top: 20px;
    }
    .audio-controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 24px 0;
    }
    .audio-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border-radius: 16px;
      border: none;
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    .audio-btn:active { transform: scale(0.95); }
    .btn-play {
      background: #d4af37;
      color: #131109;
      box-shadow: 0 4px 15px rgba(212,175,55,0.3);
      flex: 1;
    }
    .btn-stop {
      background: #1a1812;
      color: #d4af37;
      border: 1px solid rgba(212,175,55,0.3);
      flex: 1;
    }
    .btn-play:disabled {
      opacity: 0.6;
    }
    .status {
      text-align: center;
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 11px;
      color: #6a5a40;
      margin-top: 8px;
      min-height: 16px;
    }
    .install-banner {
      margin-top: 32px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(212,175,55,0.06);
      border: 1px solid rgba(212,175,55,0.1);
      text-align: center;
    }
    .install-banner p {
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 12px;
      color: #8a7a50;
      line-height: 1.6;
    }
    .install-banner .icon {
      font-size: 20px;
      display: block;
      margin-bottom: 8px;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #131109;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    /* Hide install banner if in standalone mode */
    @media (display-mode: standalone) {
      .install-banner { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-label">Examinemos las Escrituras</div>
      <div class="header-date">${dateStr}</div>
    </div>

    <div class="divider"></div>

    ${reading ? `
    <div class="audio-controls">
      <button class="audio-btn btn-play" id="playBtn" onclick="playAudio()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        Escuchar
      </button>
    </div>
    <div class="status" id="status"></div>

    <div class="text-card">
      <div class="section-label">Texto del día</div>
      <p class="text-content">${reading.text}</p>
    </div>

    <div>
      <div class="section-label">Comentario</div>
      <p class="commentary">${reading.commentary}</p>
    </div>

    ${reading.source ? `
    <div class="source">${reading.source}</div>
    ` : ''}
    ` : `
    <div style="text-align:center;padding:40px 0;">
      <p style="color:#6a5a40;font-size:15px;">No hay lectura disponible para hoy.</p>
    </div>
    `}

    <div class="install-banner" id="installBanner">
      <span class="icon">📖</span>
      <p>
        Toca <svg style="display:inline;vertical-align:middle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        y luego <strong style="color:#d4af37">"Agregar a pantalla de inicio"</strong>
        para tener el texto del día como app en tu iPhone.
      </p>
    </div>
  </div>

  <script>
    const BASE = "${baseUrl}";
    let audio1 = null;
    let audio2 = null;
    let isPlaying = false;

    function setStatus(msg) {
      document.getElementById('status').textContent = msg;
    }

    function setButton(mode) {
      const btn = document.getElementById('playBtn');
      if (mode === 'loading') {
        btn.innerHTML = '<span class="spinner"></span> Cargando...';
        btn.disabled = true;
        btn.className = 'audio-btn btn-play';
      } else if (mode === 'playing') {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Detener';
        btn.disabled = false;
        btn.className = 'audio-btn btn-stop';
        btn.onclick = stopAudio;
      } else {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> Escuchar';
        btn.disabled = false;
        btn.className = 'audio-btn btn-play';
        btn.onclick = playAudio;
      }
    }

    async function playAudio() {
      isPlaying = true;
      setButton('loading');
      setStatus('Preparando audio...');

      try {
        // Fetch both in parallel
        const [res1, res2] = await Promise.all([
          fetch(BASE + '/api/daily-text?format=audio&part=text'),
          fetch(BASE + '/api/daily-text?format=audio&part=commentary'),
        ]);

        if (!isPlaying) return;

        const [blob1, blob2] = await Promise.all([res1.blob(), res2.blob()]);
        if (!isPlaying) return;

        const url1 = URL.createObjectURL(blob1);
        const url2 = URL.createObjectURL(blob2);

        audio1 = new Audio(url1);
        audio2 = new Audio(url2);

        setButton('playing');
        setStatus('Reproduciendo texto del día...');

        await new Promise((resolve, reject) => {
          audio1.onended = resolve;
          audio1.onerror = reject;
          audio1.play().catch(reject);
        });

        if (!isPlaying) return;
        setStatus('Reproduciendo comentario...');

        await new Promise((resolve, reject) => {
          audio2.onended = resolve;
          audio2.onerror = reject;
          audio2.play().catch(reject);
        });

        URL.revokeObjectURL(url1);
        URL.revokeObjectURL(url2);
      } catch (e) {
        if (isPlaying) setStatus('Error al reproducir');
      }

      isPlaying = false;
      setButton('idle');
      setStatus('');
    }

    function stopAudio() {
      isPlaying = false;
      if (audio1) { audio1.pause(); audio1 = null; }
      if (audio2) { audio2.pause(); audio2 = null; }
      setButton('idle');
      setStatus('');
    }

    // Hide install banner if already standalone
    if (window.navigator.standalone) {
      document.getElementById('installBanner').style.display = 'none';
    }
  </script>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
}
