const dailyReadings = require('../src/data/dailyReadings.json');

// Keywords that indicate emotional tone
const CHEERFUL_KEYWORDS = [
  'feliz', 'felices', 'felicidad', 'alegría', 'alegre', 'alegres', 'gozo', 'gozar',
  'disfrutar', 'disfrut', 'bendición', 'bendiciones', 'bendecir', 'agradec',
  'alabar', 'alaba', 'alabanza', 'celebr', 'entusiasm', 'maravill',
  'privilegio', 'honor', 'honra', 'paraíso', 'recompensa', 'regalo',
  'amor', 'amoroso', 'cariño', 'ternura', 'tierno', 'abrazo', 'beso',
  'esperanza', 'promesa', 'victoria', 'triunf', 'éxito', 'logr',
  'hermoso', 'bello', 'bonito', 'precioso', 'magnífico', 'esplendor',
  'cantar', 'canción', 'música', 'fiesta', 'celebración',
  'resurrección', 'resucitar', 'vida eterna', 'vivir para siempre',
  'nuevo mundo', 'futuro maravilloso', 'eternidad',
];

const SAD_KEYWORDS = [
  'sufr', 'sufrimiento', 'dolor', 'doloroso', 'llor', 'lágrima',
  'muert', 'morir', 'murió', 'fallec', 'destrui', 'destrucción',
  'angustia', 'angustiado', 'aflicción', 'afligido', 'tristeza', 'triste',
  'pecado', 'pecador', 'pecar', 'culpa', 'culpable',
  'castigo', 'castigar', 'juicio', 'condenar', 'condenación',
  'enfermedad', 'enfermo', 'herida', 'herido', 'maltrat',
  'injusticia', 'injusto', 'persecución', 'perseguido',
  'soledad', 'solo', 'abandonado', 'abandon',
  'perdón', 'perdonar', 'arrepent', 'error', 'errores',
  'corazón destrozado', 'pena', 'lamento', 'duelo',
  'esclavitud', 'esclavo', 'opresión', 'oprimir',
];

const SOLEMN_KEYWORDS = [
  'gloria', 'glorioso', 'santo', 'santidad', 'sagrado',
  'poder', 'poderoso', 'todopoderoso', 'soberano', 'soberanía',
  'creador', 'creación', 'universo', 'cielo', 'trono',
  'profecía', 'profeta', 'cumplimiento', 'revelación',
  'mandamiento', 'ley', 'obediencia', 'obedecer',
  'juicio', 'juzgar', 'justicia', 'justo',
  'gran tribulación', 'armagedón', 'fin del mundo', 'últimos días',
  'reino de dios', 'reino de los cielos', 'gobernante',
  'sacrificio', 'rescate', 'redención',
];

const ENCOURAGING_KEYWORDS = [
  'ánimo', 'animar', 'aníme', 'consol', 'consuel',
  'fuerza', 'fuerte', 'fortalez', 'valor', 'valiente', 'valentía',
  'confiar', 'confianza', 'segur', 'protección', 'proteger', 'cuidar',
  'ayuda', 'ayudar', 'apoyar', 'apoyo', 'sostener',
  'persever', 'aguant', 'resist', 'superar',
  'paz', 'tranquilidad', 'calma', 'serenidad',
  'paciencia', 'paciente', 'esperar', 'esperanza',
  'fe', 'fiel', 'fidelidad', 'lealtad', 'leal',
];

function countMatches(text, keywords) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    // Count occurrences
    let idx = 0;
    while ((idx = lower.indexOf(kw, idx)) !== -1) {
      count++;
      idx += kw.length;
    }
  }
  return count;
}

function analyzeText(text, commentary) {
  const fullText = `${text} ${commentary}`;

  const scores = {
    cheerful: countMatches(fullText, CHEERFUL_KEYWORDS),
    sad: countMatches(fullText, SAD_KEYWORDS),
    solemn: countMatches(fullText, SOLEMN_KEYWORDS),
    encouraging: countMatches(fullText, ENCOURAGING_KEYWORDS),
  };

  // Determine dominant tone
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const secondary = sorted[1];

  // Map tones to voice styles
  // Dalia (female - text): cheerful, sad, whispering (default: neutral)
  // Jorge (male - commentary): chat, cheerful, excited, sad, whispering (default: neutral)

  let textStyle = null; // null = default/neutral
  let commentaryStyle = null;

  if (dominant[1] === 0) {
    return { textStyle: null, commentaryStyle: 'chat' };
  }

  switch (dominant[0]) {
    case 'cheerful':
      textStyle = 'cheerful';
      commentaryStyle = dominant[1] > 8 ? 'excited' : 'cheerful';
      break;
    case 'sad':
      textStyle = 'sad';
      commentaryStyle = secondary[0] === 'encouraging' ? 'chat' : 'sad';
      break;
    case 'solemn':
      textStyle = null; // neutral/default for solemn biblical text
      commentaryStyle = 'chat';
      break;
    case 'encouraging':
      textStyle = 'cheerful';
      commentaryStyle = 'chat';
      break;
  }

  // Special cases: if text mentions direct speech/quotes, use whispering for intimate moments
  const hasIntimateQuote = /te amo|te quiero|secreto|susurr|silencio|medit|oración.*personal/i.test(fullText);
  if (hasIntimateQuote && dominant[0] !== 'cheerful') {
    textStyle = 'whispering';
  }

  return {
    textStyle,
    commentaryStyle,
    scores,
    dominant: dominant[0],
  };
}

// Process all readings
const ttsStyles = {};
const stats = { cheerful: 0, sad: 0, solemn: 0, encouraging: 0, neutral: 0 };

for (const [key, reading] of Object.entries(dailyReadings)) {
  const analysis = analyzeText(reading.text, reading.commentary);
  ttsStyles[key] = {
    textStyle: analysis.textStyle,
    commentaryStyle: analysis.commentaryStyle,
  };
  stats[analysis.dominant || 'neutral']++;
}

console.log('\n=== TTS Style Analysis Results ===\n');
console.log('Total days analyzed:', Object.keys(ttsStyles).length);
console.log('\nDominant tone distribution:');
for (const [tone, count] of Object.entries(stats)) {
  const bar = '█'.repeat(Math.round(count / 3));
  console.log(`  ${tone.padEnd(13)} ${String(count).padStart(3)} ${bar}`);
}

// Show some examples
console.log('\n=== Sample Assignments ===\n');
const sampleKeys = Object.keys(ttsStyles).slice(0, 10);
for (const key of sampleKeys) {
  const r = dailyReadings[key];
  const s = ttsStyles[key];
  console.log(`${key}: text="${r.text.slice(0, 50)}..."`);
  console.log(`  → Dalia: ${s.textStyle || 'neutral'} | Jorge: ${s.commentaryStyle || 'neutral'}`);
}

// Write output
const fs = require('fs');
const outputPath = require('path').join(__dirname, '..', 'src', 'data', 'ttsStyles.json');
fs.writeFileSync(outputPath, JSON.stringify(ttsStyles, null, 2));
console.log(`\nSaved to ${outputPath}`);
