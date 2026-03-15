# Un Dia a la Vez

Una aplicacion web para construir habitos espirituales diarios. Incluye un calendario interactivo de habitos, lectura biblica diaria con texto y comentario, y lectura en voz alta con inteligencia artificial.

Disponible en **espanol**.

---

## Funcionalidades

### Calendario de habitos

- **Meta personalizable** — Haz clic en el titulo para cambiar tu meta
- **3 vistas** — Ano completo, mes o semana
- **Rachas** — Cuenta dias consecutivos automaticamente
- **9 medallas** — Desde 1 dia hasta 365 dias (semilla, fuego, estrella, trofeo...)
- **Efectos visuales** — Particulas y animaciones al marcar un dia
- **Sonidos** — Sonido al marcar y desmarcar dias
- **Persistencia** — Tus datos se guardan en base de datos

### Texto del dia (Examinemos las Escrituras)

- **365 textos diarios** — Un texto biblico y comentario para cada dia del ano
- **Lectura biblica semanal** — Programa completo de lectura con navegacion por capitulos
- **Referencias interactivas** — Toca cualquier cita biblica (ej. Luc. 13:6) para ver el versiculo en un popup
- **Navegacion por fechas** — Avanza o retrocede entre dias, toca la fecha para volver a hoy

### Lectura en voz alta con IA

- **Dos voces** — Voz femenina para el texto del dia, voz masculina para el comentario
- **Estilos emocionales inteligentes** — Cada dia tiene un analisis de tono (alegre, reflexivo, motivacional, solemne) que ajusta automaticamente el estilo de la voz
- **Nombres completos** — Las abreviaturas biblicas se expanden automaticamente (Luc. → Lucas, Mat. → Mateo, etc.)
- **Reproduccion fluida** — Ambos audios se descargan en paralelo para que la transicion entre voces sea instantanea
- **Controles simples** — Un boton para reproducir/detener, se detiene automaticamente al cambiar de dia

---

## Como se ve

```
  ┌─────────────────────────────────┐
  │       Mi Meta Diaria            │  ← Meta editable
  │       Un dia a la vez           │
  │                                 │
  │   12 Logrados  3 Racha  Medal   │  ← Estadisticas
  │   ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░   │  ← Progreso anual
  │                                 │
  │   [ Ano ]  [ Mes ]  [ Semana ]  │  ← Vistas
  │                                 │
  │    D  L  M  M  J  V  S         │
  │          1  2  3  4  5         │
  │    6  7  8  9  10 11 12        │
  │   13 14 ██ ██ ██ 18 19        │  ← Dias marcados
  │   20 21 ██ ██ ██ 25 26        │
  │   27 28 29 30 31              │
  │                                 │
  │   Medallas: 🌱 🔥 ⭐ ...       │  ← Recompensas
  │                                 │
  │          [ Texto del dia 📖 ]   │  ← Lectura diaria
  └─────────────────────────────────┘
```

---

## Medallas

| Dias | Medalla | Descripcion |
|------|---------|-------------|
| 1    | Semilla | Primer paso |
| 3    | Fuego   | 3 dias seguidos |
| 7    | Estrella | Una semana |
| 14   | Trofeo  | Dos semanas |
| 30   | Brillo  | Un mes |
| 60   | Gema    | Dos meses |
| 100  | Cohete  | 100 dias |
| 180  | Arcoiris | Medio ano |
| 365  | Corona  | Un ano entero |

---

## Instalacion

### Requisitos

- Node.js 18+
- PostgreSQL

### 1. Clonar el repositorio

```bash
git clone https://github.com/yankeemorla01/Un-dia-a-la-vez.git
cd Un-dia-a-la-vez
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
# Base de datos PostgreSQL
MONGODB_URI=postgresql://usuario:contrasena@host:puerto/nombre_db

# Text-to-Speech — Server-side (para el API /api/daily-text)
TTS_API_URL=tu_url_de_api_tts
TTS_API_KEY=tu_api_key_tts

# Text-to-Speech — Frontend (para el boton de audio en la web)
VITE_TTS_API_URL=tu_url_de_api_tts
VITE_TTS_API_KEY=tu_api_key_tts
```

> **Nota sobre TTS:** La lectura en voz alta usa una API de Text-to-Speech compatible con voces neuronales de Microsoft Azure (como `es-MX-DaliaNeural` y `es-MX-JorgeNeural`). Necesitas tu propia API que acepte un POST con `{ text, voice, style }` y devuelva audio. Las variables `TTS_*` (sin VITE_) son solo del servidor y nunca se exponen al navegador. Las variables `VITE_TTS_*` son para el frontend. Si no configuras estas variables, la app funciona sin audio.
>
> Puedes usar servicios como [Azure Speech](https://azure.microsoft.com/en-us/products/ai-services/text-to-speech), [Google Cloud TTS](https://cloud.google.com/text-to-speech), o cualquier API compatible.

### 4. Iniciar la aplicacion

Necesitas 2 terminales:

```bash
# Terminal 1 — Backend
npm run server

# Terminal 2 — Frontend
npm run dev
```

### 5. Abrir

Ve a `http://localhost:5173` en tu navegador.

---

## Estructura del proyecto

```
un-dia-a-la-vez/
├── .env                          # Variables de entorno (NO se sube a git)
├── .gitignore
├── server.js                     # API backend (Express + PostgreSQL)
├── index.html
├── vite.config.js
├── package.json
├── vercel.json                   # Configuracion para deploy en Vercel
│
├── api/                          # Serverless functions (Vercel)
│   ├── _db.js                    # Conexion a base de datos
│   ├── marked.js                 # API dias marcados
│   ├── settings.js               # API configuracion
│   └── sync.js                   # API sincronizacion
│
├── scripts/
│   ├── jwpub_extract.py          # Extractor de datos biblicos
│   └── analyze_tts_styles.cjs    # Analizador de estilos emocionales para TTS
│
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── components/
    │   ├── EveryDayCalendar.jsx   # Calendario de habitos
    │   └── DailyReading.jsx       # Texto del dia + TTS
    └── data/
        ├── dailyReadings.json     # 365 textos diarios con comentarios
        ├── bibleReadingSchedule.json  # Programa de lectura semanal
        ├── bibleBooks.json        # Mapa de abreviaturas biblicas
        └── ttsStyles.json         # Estilos emocionales por dia (generado)
```

---

## Como funciona el TTS inteligente

El sistema de lectura en voz alta no solo lee el texto — adapta la emocion de la voz segun el contenido de cada dia.

### Proceso

1. **Analisis de contenido** — El script `scripts/analyze_tts_styles.cjs` analiza los 365 textos buscando palabras clave emocionales
2. **Clasificacion automatica** — Cada dia se clasifica en uno de estos tonos:
   - **Alegre** (`cheerful`) — textos sobre bendiciones, felicidad, amor, esperanza
   - **Reflexivo** (`sad`) — textos sobre sufrimiento, perdida, arrepentimiento, consuelo
   - **Motivacional** (`encouraging`) — textos sobre fe, fortaleza, perseverancia, confianza
   - **Solemne** (`solemn`) — textos sobre gloria, profecia, juicio, poder divino
3. **Estilos de voz** — Segun el tono, se asignan estilos a cada voz:

| Tono | Voz femenina (texto) | Voz masculina (comentario) |
|------|---------------------|---------------------------|
| Alegre | `cheerful` | `cheerful` o `excited` |
| Reflexivo | `sad` | `sad` o `chat` |
| Motivacional | `cheerful` | `chat` |
| Solemne | neutral | `chat` |

4. **Expansion de abreviaturas** — Antes de enviar al TTS, se expanden las abreviaturas biblicas para que la voz las lea completas (Luc. → Lucas, 1 Cor. → 1 Corintios, etc.)

### Regenerar los estilos

Si modificas los textos diarios, regenera los estilos ejecutando:

```bash
node scripts/analyze_tts_styles.cjs
```

Esto actualiza `src/data/ttsStyles.json` automaticamente.

### Usar tu propia API de TTS

El sistema funciona con cualquier API que:
- Acepte un `POST` con body JSON: `{ "text": "...", "voice": "...", "style": "..." }`
- Devuelva un archivo de audio (MP3, WAV, etc.)
- Soporte voces neuronales con estilos emocionales

Los estilos disponibles dependen de tu proveedor de TTS. Los estilos usados aqui son compatibles con voces neuronales de Microsoft Azure en espanol mexicano.

---

## Shortcut de iPhone

La app incluye un Shortcut de iOS descargable que lee el texto del dia con voces de IA directamente desde tu iPhone.

### Como instalarlo

1. Abre Safari en tu iPhone y ve a `https://tu-app.vercel.app/api/shortcut`
2. El archivo se descarga y se abre en la app Shortcuts
3. Toca **"Agregar Shortcut"**

### Que hace el Shortcut

1. Descarga el texto del dia desde la API
2. Muestra una notificacion con la fecha
3. Reproduce el texto biblico (voz femenina)
4. Reproduce el comentario (voz masculina)
5. Marca el dia como completado en tu calendario
6. Muestra la fuente

### Lectura automatica cada manana

1. Abre la app **Shortcuts** → pestaña **Automatizacion**
2. Toca **+ Nueva Automatizacion** → **Hora del dia**
3. Elige tu hora (ej. 7:00 AM), repetir **Diariamente**
4. Selecciona el shortcut **"Texto del Dia"**
5. Activa **"Ejecutar inmediatamente"**

### Generar tu propio Shortcut

Si haces fork del proyecto, necesitas generar y firmar tu propio shortcut:

```bash
# 1. Edita la URL base en scripts/build-shortcut.cjs
# 2. Genera el archivo .shortcut
node scripts/build-shortcut.cjs

# 3. Firma el shortcut (requiere macOS)
shortcuts sign --mode anyone \
  --input public/texto-del-dia.shortcut \
  --output public/texto-del-dia-signed.shortcut
```

El comando `shortcuts sign` viene preinstalado en macOS. El modo `anyone` permite que cualquiera instale el shortcut.

---

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/settings` | Obtener meta y vista |
| `PUT` | `/api/settings` | Guardar meta y/o vista |
| `GET` | `/api/marked` | Obtener dias marcados |
| `POST` | `/api/marked` | Marcar o desmarcar un dia |
| `GET` | `/api/daily-text` | Texto del dia en JSON |
| `GET` | `/api/daily-text?format=audio&part=text` | Audio TTS del texto |
| `GET` | `/api/daily-text?format=audio&part=commentary` | Audio TTS del comentario |
| `GET` | `/api/shortcut` | Descarga el Shortcut de iOS |
| `GET` | `/api/texto-diario` | Pagina web standalone del texto del dia |

---

## Tecnologias

- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons
- **Backend**: Express 5, Node.js
- **Base de datos**: PostgreSQL
- **Build**: Vite 7
- **TTS**: API de Text-to-Speech con voces neuronales (opcional)
- **Deploy**: Vercel (serverless functions)

---

## Contribuir

Este es un proyecto open source. Puedes:

1. **Hacer fork** del repositorio
2. **Crear tu rama** (`git checkout -b mi-feature`)
3. **Hacer tus cambios** y commit
4. **Enviar un Pull Request**

### Lo que necesitas para contribuir

- El frontend y toda la logica del calendario, lectura biblica y TTS estan en el codigo
- Los datos biblicos (365 textos diarios, programa de lectura, libros) estan en `src/data/`
- Solo necesitas configurar tu propia base de datos PostgreSQL y, opcionalmente, tu propia API de TTS
- No se comparten credenciales ni API keys — cada quien configura las suyas en su `.env`

---

## Licencia

MIT — Usa este proyecto como quieras.

---

Hecho con dedicacion para la comunidad.
