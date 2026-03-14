# Un Dia a la Vez / One Day at a Time / Un Jour a la Fois

---

## Que es esto? / What is this? / Qu'est-ce que c'est?

**ES** - Una app para seguir habitos diarios. Marca cada dia que cumples tu meta y construye rachas. Simple, visual, satisfactorio.

**EN** - A daily habit tracker app. Mark each day you complete your goal and build streaks. Simple, visual, satisfying.

**FR** - Une application de suivi d'habitudes quotidiennes. Marquez chaque jour ou vous atteignez votre objectif et construisez des series. Simple, visuel, satisfaisant.

---

## Como se ve / How it looks / Apercu

```
  ┌─────────────────────────────────┐
  │       Mi Meta Diaria            │  <-- Meta editable / Editable goal
  │       Un dia a la vez           │
  │                                 │
  │   12 Logrados  3 Racha  Medal   │  <-- Estadisticas / Stats
  │   ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░   │  <-- Progreso anual / Year progress
  │                                 │
  │   [ Ano ]  [ Mes ]  [ Semana ]  │  <-- Vistas / Views
  │                                 │
  │    D  L  M  M  J  V  S         │
  │          1  2  3  4  5         │
  │    6  7  8  9  10 11 12        │
  │   13 14 ██ ██ ██ 18 19        │  <-- Dias marcados / Marked days
  │   20 21 ██ ██ ██ 25 26        │
  │   27 28 29 30 31              │
  │                                 │
  │   Medallas: seed fire star ...  │  <-- Recompensas / Rewards
  └─────────────────────────────────┘
```

---

## Funcionalidades / Features / Fonctionnalites

### ES - Espanol

- **Meta personalizable** - Haz clic en el titulo para cambiar tu meta
- **3 vistas** - Ano completo, mes o semana
- **Rachas** - Cuenta dias consecutivos automaticamente
- **9 medallas** - Desde 1 dia hasta 365 dias
- **Efectos visuales** - Particulas y animaciones al marcar un dia
- **Sonidos** - Sonido magico al marcar, sonido suave al desmarcar
- **Persistencia en base de datos** - Tus datos se guardan en PostgreSQL, no se pierden
- **Dia de hoy resaltado** - Siempre sabes que dia es con un borde brillante

### EN - English

- **Customizable goal** - Click the title to change your goal
- **3 views** - Full year, month, or week
- **Streaks** - Automatically counts consecutive days
- **9 medals** - From 1 day to 365 days
- **Visual effects** - Particles and animations when marking a day
- **Sounds** - Magic chime when marking, soft sound when unmarking
- **Database persistence** - Your data is saved in PostgreSQL, never lost
- **Today highlighted** - Always know what day it is with a glowing border

### FR - Francais

- **Objectif personnalisable** - Cliquez sur le titre pour changer votre objectif
- **3 vues** - Annee complete, mois ou semaine
- **Series** - Compte automatiquement les jours consecutifs
- **9 medailles** - De 1 jour a 365 jours
- **Effets visuels** - Particules et animations lors du marquage d'un jour
- **Sons** - Carillon magique au marquage, son doux au demarquage
- **Persistance en base de donnees** - Vos donnees sont sauvegardees dans PostgreSQL
- **Aujourd'hui en surbrillance** - Sachez toujours quel jour il est

---

## Medallas / Medals / Medailles

| Dias / Days / Jours | Medalla | ES | EN | FR |
|---|---|---|---|---|
| 1 | seed | Primer paso | First step | Premier pas |
| 3 | fire | 3 dias seguidos | 3 days straight | 3 jours consecutifs |
| 7 | star | Una semana | One week | Une semaine |
| 14 | trophy | Dos semanas | Two weeks | Deux semaines |
| 30 | glowing star | Un mes | One month | Un mois |
| 60 | gem | Dos meses | Two months | Deux mois |
| 100 | rocket | 100 dias | 100 days | 100 jours |
| 180 | rainbow | Medio ano | Half year | Six mois |
| 365 | crown | Un ano entero | A full year | Une annee entiere |

---

## Como instalar / How to install / Comment installer

### Requisitos / Requirements / Prerequis

- Node.js 18+
- PostgreSQL (una base de datos existente o nueva)

### Pasos / Steps / Etapes

**1. Clonar / Clone / Cloner**

```bash
git clone https://github.com/tu-usuario/un-dia-a-la-vez.git
cd un-dia-a-la-vez
```

**2. Instalar dependencias / Install dependencies / Installer les dependances**

```bash
npm install
```

**3. Configurar base de datos / Configure database / Configurer la base de donnees**

Crear un archivo `.env` en la raiz del proyecto:

```env
DATABASE_URL=postgresql://usuario:contrasena@host:puerto/nombre_db
```

Las tablas se crean automaticamente al iniciar el servidor. No necesitas hacer nada mas.

The tables are created automatically when the server starts. No additional setup needed.

Les tables sont creees automatiquement au demarrage du serveur. Aucune configuration supplementaire.

**4. Iniciar / Start / Demarrer**

Necesitas 2 terminales / You need 2 terminals / Vous avez besoin de 2 terminaux:

```bash
# Terminal 1 - Backend API
npm run server

# Terminal 2 - Frontend
npm run dev
```

**5. Abrir / Open / Ouvrir**

Ir a `http://localhost:5173` en tu navegador.

---

## Estructura del proyecto / Project structure / Structure du projet

```
un-dia-a-la-vez/
├── .env                  # Credenciales (NO se sube a git)
├── .gitignore            # Archivos ignorados por git
├── server.js             # API backend (Express + PostgreSQL)
├── index.html            # HTML principal
├── vite.config.js        # Configuracion de Vite + Tailwind
├── package.json          # Dependencias y scripts
└── src/
    ├── main.jsx          # Punto de entrada React
    ├── index.css         # Estilos globales (Tailwind)
    ├── App.jsx           # Componente raiz
    └── components/
        └── EveryDayCalendar.jsx  # Componente principal
```

---

## Base de datos / Database / Base de donnees

Se crean 2 tablas con prefijo `udv_` para no interferir con otras aplicaciones en la misma base de datos:

Only 2 tables are created with `udv_` prefix to avoid conflicts with other apps in the same database:

Seulement 2 tables sont creees avec le prefixe `udv_` pour eviter les conflits:

| Tabla / Table | Descripcion / Description |
|---|---|
| `udv_settings` | Meta y ultima vista seleccionada / Goal and last selected view |
| `udv_marked_days` | Dias marcados / Marked days |

---

## API Endpoints

| Metodo | Ruta | Descripcion / Description |
|---|---|---|
| `GET` | `/api/settings` | Obtener meta y vista / Get goal and view mode |
| `PUT` | `/api/settings` | Guardar meta y/o vista / Save goal and/or view mode |
| `GET` | `/api/marked` | Obtener dias marcados / Get marked days |
| `POST` | `/api/marked` | Marcar o desmarcar un dia / Mark or unmark a day |

---

## Tecnologias / Tech stack / Technologies

- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons
- **Backend**: Express 5, Node.js
- **Base de datos**: PostgreSQL (via `pg`)
- **Build**: Vite 7
- **Audio**: Web Audio API (sin archivos externos / no external files)

---

## Ideas para implementar / Ideas to implement / Idees a implementer

### ES - Espanol

- **Multiples metas** - Seguir mas de un habito a la vez con colores diferentes
- **Modo oscuro/claro** - Alternar entre temas
- **Exportar datos** - Descargar tu progreso como CSV o imagen
- **Notas diarias** - Agregar una nota corta a cada dia marcado
- **Graficas de progreso** - Ver tu consistencia en graficas de barras o lineas
- **Recordatorios** - Notificaciones push para recordarte marcar el dia
- **Modo compartido** - Compartir tu progreso con amigos o en redes sociales
- **Categorias de habitos** - Ejercicio, lectura, meditacion, etc con iconos propios
- **Vista de calor** - Mapa de calor estilo GitHub para visualizar actividad
- **Autenticacion** - Login para que multiples personas usen la misma instancia
- **PWA** - Instalar como app nativa en el telefono
- **Widget** - Mini calendario para incrustar en otras paginas

### EN - English

- **Multiple goals** - Track more than one habit with different colors
- **Dark/Light mode** - Toggle between themes
- **Export data** - Download your progress as CSV or image
- **Daily notes** - Add a short note to each marked day
- **Progress charts** - See your consistency in bar or line charts
- **Reminders** - Push notifications to remind you to mark the day
- **Shared mode** - Share your progress with friends or on social media
- **Habit categories** - Exercise, reading, meditation, etc with custom icons
- **Heat map view** - GitHub-style heat map to visualize activity
- **Authentication** - Login so multiple people can use the same instance
- **PWA** - Install as a native app on your phone
- **Widget** - Mini calendar to embed in other pages

### FR - Francais

- **Objectifs multiples** - Suivre plus d'une habitude avec des couleurs differentes
- **Mode sombre/clair** - Basculer entre les themes
- **Exporter les donnees** - Telecharger votre progres en CSV ou image
- **Notes quotidiennes** - Ajouter une courte note a chaque jour marque
- **Graphiques de progres** - Voir votre regularite en graphiques
- **Rappels** - Notifications push pour vous rappeler de marquer le jour
- **Mode partage** - Partager votre progres avec des amis ou sur les reseaux sociaux
- **Categories d'habitudes** - Exercice, lecture, meditation, etc avec des icones
- **Vue carte de chaleur** - Carte de chaleur style GitHub pour visualiser l'activite
- **Authentification** - Connexion pour que plusieurs personnes utilisent la meme instance
- **PWA** - Installer comme application native sur votre telephone
- **Widget** - Mini calendrier a integrer dans d'autres pages

---

## Licencia / License / Licence

MIT - Usa este proyecto como quieras / Use this project however you want / Utilisez ce projet comme vous le souhaitez.

---

Hecho con dedicacion / Made with dedication / Fait avec dedication.
