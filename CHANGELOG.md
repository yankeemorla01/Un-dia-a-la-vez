# Changelog

Todos los cambios notables de este proyecto se documentan aqui.

---

## [1.3.1] - 2026-03-17

### Agregado
- **Migracion automatica de datos legacy** — El primer usuario que inicia sesion recibe los datos existentes automaticamente
- **Foto de perfil Microsoft** — Se muestra la foto de la cuenta Microsoft del usuario en la barra superior
- `src/useUserPhoto.js` — Hook para obtener foto de perfil desde Microsoft Graph API

### Modificados
- `api/_db.js` — Nueva funcion `migrateLegacyData()` que copia datos de tablas legacy a tablas per-user
- `api/sync.js` — Llama migracion automatica en primer sync autenticado

---

## [1.3.0] - 2026-03-17

### Agregado
- **Autenticacion con Microsoft** — Inicio de sesion gratuito con cuentas Microsoft (Outlook, Hotmail, etc.)
- **Datos por usuario** — Cada persona tiene su propio calendario, meta, progreso y medallas
- **Pantalla de login** — Pagina de inicio de sesion con boton de Microsoft
- **Cerrar sesion** — Boton discreto en la barra superior
- **Tablas multi-usuario** — `udv_user_settings`, `udv_user_marked_days`, `udv_user_sync`
- **Verificacion de tokens** — Backend verifica tokens JWT de Microsoft con JWKS

### Archivos nuevos
- `src/authConfig.js` — Configuracion MSAL
- `src/useAuthFetch.js` — Hook para fetch autenticado
- `src/components/LoginPage.jsx` — Pantalla de login
- `api/_auth.js` — Verificacion de tokens Microsoft

### Modificados
- `src/main.jsx` — Envuelve la app con MsalProvider
- `src/App.jsx` — Muestra login o app segun autenticacion
- `src/components/EveryDayCalendar.jsx` — Usa authFetch, muestra nombre de usuario y boton de logout
- `api/_db.js` — Tablas multi-usuario, bumpVersion por usuario
- `api/marked.js` — Datos por usuario autenticado
- `api/settings.js` — Configuracion por usuario autenticado
- `api/sync.js` — Sincronizacion por usuario autenticado

---

## [1.2.0] - 2026-03-15

### Agregado
- **Shortcut "Lector TTS"** — Shortcut de iPhone para leer cualquier texto con voces de IA
  - 6 voces disponibles (espanol, ingles, portugues, frances)
  - 10 estilos emocionales
  - Usa Dictionary + Choose from List (compatible con todas las versiones de iOS)
- **Endpoint `/api/tts`** — API para TTS personalizable (POST con text, voice, style)
- **Endpoint `/api/shortcut-tts`** — Descarga del Shortcut "Lector TTS"

### Archivos nuevos
- `api/tts.js` — Endpoint TTS personalizable
- `api/shortcut-tts.js` — Sirve el shortcut firmado
- `scripts/build-shortcut-tts.cjs` — Generador del shortcut
- `public/lector-tts.shortcut` — Shortcut sin firmar
- `public/lector-tts-signed.shortcut` — Shortcut firmado

### Modificados
- `vercel.json` — Rutas para `/api/tts` y `/api/shortcut-tts`

---

## [1.1.0] - 2026-03-14

### Agregado
- **Shortcut "Texto del Dia"** — Shortcut de iPhone que lee el texto diario
  - Reproduce texto biblico (voz femenina) y comentario (voz masculina)
  - Marca el dia como completado automaticamente
  - Muestra notificacion y fuente al final
- **Endpoint `/api/daily-text`** — Texto del dia en JSON y audio TTS
- **Endpoint `/api/shortcut`** — Descarga del Shortcut firmado
- **Endpoint `/api/texto-diario`** — Pagina web standalone para movil
- **Proteccion de API keys** — Variables TTS del servidor sin prefijo VITE_
- **README completo** — Documentacion open source sin credenciales

### Archivos nuevos
- `api/daily-text.js` — API del texto del dia
- `api/shortcut.js` — Sirve el shortcut firmado
- `api/texto-diario.js` — Pagina web standalone
- `scripts/build-shortcut.cjs` — Generador del shortcut

---

## [1.0.0] - 2026-03-13

### Agregado
- **Calendario de habitos** — Vista de ano, mes y semana
- **Meta personalizable** — Click en el titulo para editar
- **Rachas** — Contador de dias consecutivos
- **9 medallas** — Desde 1 dia hasta 365 dias
- **Efectos visuales** — Particulas y animaciones al marcar dias
- **Sonidos** — Chime al marcar, sonido al desmarcar
- **Texto del dia** — 365 textos biblicos con comentarios
- **Lectura biblica semanal** — Programa completo con navegacion
- **Referencias interactivas** — Popup con versiculos al tocar citas
- **TTS con IA** — Dos voces (femenina y masculina) con estilos emocionales
- **Pre-carga paralela** — Audio descargado en paralelo para transicion fluida
- **Expansion de abreviaturas** — Luc. → Lucas, Mat. → Mateo, etc.
- **Analisis emocional** — 365 textos clasificados por tono
- **Base de datos** — PostgreSQL con sincronizacion en tiempo real
- **Deploy** — Vercel con serverless functions
