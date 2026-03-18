import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Edit2, Calendar, LayoutGrid, List, LogOut, Share2 } from "lucide-react";
import { useMsal } from '@azure/msal-react';
import { useAuthFetch } from '../useAuthFetch';
import { useUserPhoto } from '../useUserPhoto';

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEK_DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const FULL_WEEK_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getDaysInMonth(month, year) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(month, year) { return new Date(year, month, 1).getDay(); }

const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

const REWARDS = [
  { streak: 1, emoji: "🌱", label: "¡Primer paso!" },
  { streak: 3, emoji: "🔥", label: "¡3 días seguidos!" },
  { streak: 7, emoji: "⭐", label: "¡Una semana!" },
  { streak: 14, emoji: "🏆", label: "¡Dos semanas!" },
  { streak: 30, emoji: "🌟", label: "¡Un mes!" },
  { streak: 60, emoji: "💎", label: "¡Dos meses!" },
  { streak: 100, emoji: "🚀", label: "¡100 días!" },
  { streak: 180, emoji: "🌈", label: "¡Medio año!" },
  { streak: 365, emoji: "👑", label: "¡Un año entero!" },
];

// Reuse a single AudioContext to avoid leak
let _audioCtx = null;
function getAudioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AC();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

const playChime = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

const playUnmarkSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

function Particle({ x, y, emoji, id, onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 1200);
    return () => clearTimeout(t);
  }, [id, onDone]);

  const angle = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 80;
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist - 40;

  return (
    <div style={{
      position: "fixed", left: x, top: y, pointerEvents: "none", zIndex: 9999,
      fontSize: "1.5rem", animation: "particle-fly 1.2s ease-out forwards",
      "--tx": `${tx}px`, "--ty": `${ty}px`,
    }}>
      {emoji}
    </div>
  );
}

const API = "/api";

export default function EveryDayCalendar({ goalId = null }) {
  const [marked, setMarked] = useState({});
  const [goal, setGoal] = useState("Mi Meta Diaria");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [activeDate, setActiveDate] = useState(today);
  const [viewMode, setViewMode] = useState("month");
  const [particles, setParticles] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const { instance, accounts } = useMsal();
  const authFetch = useAuthFetch();
  const photoUrl = useUserPhoto();
  const userName = accounts[0]?.name || '';

  const versionRef = useRef(0);

  // Build query params for goal filtering
  const goalParam = goalId ? `&goal_id=${goalId}` : '';

  // Cargar datos de la base de datos al iniciar
  useEffect(() => {
    setLoading(true);
    authFetch(`${API}/sync?v=0${goalParam}`).then(r => r.json()).then(data => {
      if (data.changed) {
        setMarked(data.marked);
        if (data.settings.goal) setGoal(data.settings.goal);
        if (data.settings.view_mode) setViewMode(data.settings.view_mode);
        versionRef.current = data.version;
      }
      setLoading(false);
    }).catch(err => {
      console.error("Error cargando datos:", err);
      setLoading(false);
    });
  }, [authFetch, goalParam]);

  // Polling: pregunta cada 3 segundos si hay cambios nuevos
  useEffect(() => {
    const interval = setInterval(() => {
      authFetch(`${API}/sync?v=${versionRef.current}${goalParam}`)
        .then(r => r.json())
        .then(data => {
          if (data.changed) {
            setMarked(data.marked);
            if (data.settings?.goal) setGoal(data.settings.goal);
            if (data.settings?.view_mode) setViewMode(data.settings.view_mode);
            versionRef.current = data.version;
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [authFetch, goalParam]);

  const computeStreak = useCallback((m) => {
    let s = 0;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (!m[k]) {
      d.setDate(d.getDate() - 1);
      k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m[k]) return 0;
    }

    while (true) {
      k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m[k]) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, []);

  const totalMarked = Object.values(marked).filter(Boolean).length;
  const streak = computeStreak(marked);
  const reward = REWARDS.slice().reverse().find(r => streak >= r.streak) || null;
  const pct = Math.round((totalMarked / 365) * 100);

  // Weekly chart data (last 7 days)
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      days.push({ label: dayNames[d.getDay()], done: !!marked[key], isToday: i === 0 });
    }
    return days;
  }, [marked]);

  // Confetti state
  const [confetti, setConfetti] = useState([]);

  // Share progress
  const shareProgress = async () => {
    const text = `🏆 Un Día a la Vez\n\n✅ ${totalMarked} días logrados\n🔥 Racha de ${streak} días\n${reward ? `${reward.emoji} ${reward.label}` : ''}\n\n¡Un día a la vez!`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi Progreso', text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setToast({ emoji: '📋', label: '¡Copiado al portapapeles!', streak: 0 });
      } catch {
        setToast({ emoji: '📋', label: 'No se pudo copiar', streak: 0 });
      }
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Guardar meta en la base de datos
  const saveGoal = (newGoal) => {
    setGoal(newGoal);
    authFetch(`${API}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: newGoal }),
    }).catch(err => console.error("Error guardando meta:", err));
  };

  // Guardar vista en la base de datos
  const saveViewMode = (mode) => {
    setViewMode(mode);
    authFetch(`${API}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_mode: mode }),
    }).catch(err => console.error("Error guardando vista:", err));
  };

  const handleClickDay = (dateObj, e) => {
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setMarked(prev => {
      const willMark = !prev[key];
      const next = { ...prev, [key]: willMark };
      if (!willMark) delete next[key];

      // Guardar en la base de datos
      authFetch(`${API}/marked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_key: key, marked: willMark, goal_id: goalId || undefined }),
      }).catch(err => console.error("Error guardando día:", err));

      if (willMark) {
        playChime();
        const emojis = ["✨", "⭐", "🌟", "💫", "✦", "🔥"];
        setParticles(p => [...p, ...Array.from({ length: 6 }, (_, i) => ({
          id: Date.now() + i,
          x: cx,
          y: cy,
          emoji: emojis[i % emojis.length]
        }))]);

        const ns = computeStreak(next);
        const match = REWARDS.find(r => r.streak === ns);
        if (match) {
          setToast({ ...match, streak: ns });
          // Launch confetti
          const pieces = Array.from({ length: 40 }, (_, i) => ({
            id: Date.now() + i + 100,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            color: ['#d4af37', '#f0d060', '#ff8c20', '#e0c050', '#8a6a10'][i % 5],
            size: 4 + Math.random() * 6,
            drift: -50 + Math.random() * 100,
          }));
          setConfetti(pieces);
          setTimeout(() => { setToast(null); setConfetti([]); }, 3500);
        }
      } else {
        playUnmarkSound();
      }
      return next;
    });
  };

  const removeParticle = useCallback((id) => setParticles(p => p.filter(x => x.id !== id)), []);

  const navPrev = () => {
    setActiveDate(prev => {
      if (viewMode === "year") return new Date(prev.getFullYear() - 1, prev.getMonth(), prev.getDate());
      if (viewMode === "month") return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (viewMode === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      return prev;
    });
  };

  const navNext = () => {
    setActiveDate(prev => {
      if (viewMode === "year") return new Date(prev.getFullYear() + 1, prev.getMonth(), prev.getDate());
      if (viewMode === "month") return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (viewMode === "week") return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      return prev;
    });
  };

  const getNavTitle = () => {
    if (viewMode === "year") return activeDate.getFullYear();
    if (viewMode === "month") return `${MONTH_NAMES[activeDate.getMonth()]} ${activeDate.getFullYear()}`;
    if (viewMode === "week") {
      const startOfWeek = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - activeDate.getDay());
      const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
      const startMonth = MONTH_NAMES[startOfWeek.getMonth()].substring(0, 3);
      const endMonth = MONTH_NAMES[endOfWeek.getMonth()].substring(0, 3);
      if (startMonth === endMonth) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startMonth} ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth}`;
      }
    }
  };

  const renderDayCell = (dateObj) => {
    const day = dateObj.getDate();
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
    const isMarked = !!marked[key];
    const isToday = key === todayKey;

    return (
      <div
        key={key}
        onClick={(e) => handleClickDay(dateObj, e)}
        className="aspect-square rounded-lg flex items-center justify-center relative day-cell"
        style={{
          background: isMarked ? "#c8a430" : isToday ? "rgba(212,175,55,0.15)" : "#181610",
          border: isToday ? "2px solid #ff8c20" : isMarked ? "1px solid #e0c050" : "1px solid #252318",
          boxShadow: isToday ? "0 0 12px 2px rgba(255,140,32,0.4)" : isMarked ? "0 0 10px 1px rgba(212,175,55,0.3)" : "none",
          animation: isToday && !isMarked ? "today-pulse 2.5s ease-in-out infinite" : isMarked ? "glow-pulse 3s ease-in-out infinite" : "none",
          zIndex: isToday ? 10 : 1,
        }}
      >
        <span className={`text-[11px] md:text-xs font-sans ${isMarked ? "text-[#3a2800] font-bold" : isToday ? "text-[#ff8c20] font-bold" : "text-[#5a5040]"}`}>
          {day}
        </span>
      </div>
    );
  };

  const renderMonthGrid = (year, monthIndex) => {
    const daysInMonth = getDaysInMonth(monthIndex, year);
    const firstDay = getFirstDayOfMonth(monthIndex, year);

    return (
      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          return renderDayCell(new Date(year, monthIndex, i + 1));
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0c0a" }}>
        <div className="text-[#d4af37] text-xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative overflow-x-hidden"
      style={{ color: "#e0d8c8", fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      <style>{`
        @keyframes particle-fly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(0.2);opacity:0} }
        @keyframes toast-in { 0%{transform:translateX(-50%) translateY(20px);opacity:0} 10%{transform:translateX(-50%) translateY(0);opacity:1} 90%{transform:translateX(-50%) translateY(0);opacity:1} 100%{transform:translateX(-50%) translateY(-10px);opacity:0} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 6px 1px rgba(212,175,55,0.45)} 50%{box-shadow:0 0 14px 4px rgba(212,175,55,0.8)} }
        @keyframes today-pulse { 0%,100%{box-shadow:0 0 8px 1px rgba(255,140,32,0.4)} 50%{box-shadow:0 0 16px 4px rgba(255,140,32,0.8)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes confetti-fall { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) translateX(var(--drift)) rotate(720deg);opacity:0} }
        .day-cell { transition: transform 0.1s ease, background 0.3s ease; cursor: pointer; }
        .day-cell:active { transform: scale(0.85); }
        .day-cell:hover { opacity: 0.8; }
        input[type="text"]::-webkit-input-placeholder { color: #6a5a40; opacity: 0.5; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at top, rgba(212,175,55,0.05) 0%, transparent 70%, rgba(0,0,0,0.8) 100%)" }} />

      <div className="w-full max-w-6xl px-4 py-8 z-10 flex flex-col items-center animate-[fadeSlide_0.6s_ease_both]">

        {/* Barra superior con usuario y logout */}
        <div className="w-full max-w-2xl flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-6 h-6 rounded-full border border-[#3a3420] object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full border border-[#3a3420] bg-[#1a1812] flex items-center justify-center">
                <span className="text-[10px] text-[#6a5a40] font-sans font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[10px] text-[#6a5a40] font-sans truncate max-w-[180px]">
              {userName}
            </span>
          </div>
          <button
            onClick={async () => {
              const account = accounts[0];
              await instance.logoutPopup({ account });
              window.location.href = window.location.origin;
            }}
            className="flex items-center gap-1.5 text-[10px] text-[#6a5a40] hover:text-[#d4af37] font-sans transition-colors"
          >
            <LogOut size={12} />
            Cerrar sesion
          </button>
        </div>

        {/* Cabecera y Meta */}
        <div className="text-center w-full max-w-2xl mb-8">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#6a5a40] mb-2 font-sans">
            Reto Personal · {activeDate.getFullYear()}
          </div>

          <div className="relative flex justify-center items-center group">
            {isEditingGoal ? (
              <input
                autoFocus
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onBlur={() => { setIsEditingGoal(false); saveGoal(goal); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditingGoal(false); saveGoal(goal); } }}
                className="bg-transparent text-center text-[#d4af37] text-2xl md:text-3xl font-normal outline-none border-b border-[#d4af37] pb-1 w-full"
                placeholder="Escribe tu meta..."
              />
            ) : (
              <h1
                onClick={() => setIsEditingGoal(true)}
                className="text-2xl md:text-3xl font-normal text-[#d4af37] tracking-wide m-0 cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {goal || "Escribe tu meta..."}
                <Edit2 size={16} className="text-[#6a5a40] opacity-50 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#6a5a40] mt-3 font-sans">
            Un día a la vez
          </div>

          <div
            onClick={() => setActiveDate(today)}
            className="mt-4 inline-block bg-[#1a1812] px-5 py-2 rounded-full border border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer hover:bg-[#25221a] transition-colors"
          >
            <span className="text-sm md:text-base font-sans tracking-wide text-[#ff8c20] font-bold">
              Hoy es: {FULL_WEEK_DAYS[today.getDay()]}, {today.getDate()} de {MONTH_NAMES[today.getMonth()]}
            </span>
          </div>
        </div>

        {/* Estadísticas Top */}
        <div className="flex w-full max-w-2xl justify-between px-4 mb-8 animate-[fadeSlide_0.6s_ease_0.1s_both]">
          <div className="text-center">
            <div className="text-2xl md:text-3xl leading-none text-[#d4af37]">{totalMarked}</div>
            <div className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-[#6a5a40] mt-1 font-sans">Logrados</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl md:text-3xl leading-none ${streak > 0 ? "text-[#ff8c20]" : "text-[#d4af37]"}`}>
              {streak > 0 ? `${streak}🔥` : "0"}
            </div>
            <div className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-[#6a5a40] mt-1 font-sans">Racha actual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl leading-none text-[#d4af37]">{reward ? reward.emoji : "—"}</div>
            <div className="text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-[#6a5a40] mt-1 font-sans">Medalla</div>
          </div>
        </div>

        {/* Progreso del Año */}
        <div className="w-full max-w-2xl h-1 bg-[#1e1c18] rounded-full mb-6 overflow-hidden animate-[fadeSlide_0.6s_ease_0.2s_both]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #8a6a10, #d4af37)",
              boxShadow: "0 0 8px rgba(212,175,55,0.4)"
            }}
          />
        </div>

        {/* Últimos 7 días + Compartir */}
        <div className="w-full max-w-2xl mb-8 animate-[fadeSlide_0.6s_ease_0.22s_both]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[9px] tracking-[0.2em] uppercase text-[#6a5a40] font-sans">Últimos 7 días</span>
            <button
              onClick={shareProgress}
              className="flex items-center gap-1.5 text-[10px] text-[#6a5a40] hover:text-[#d4af37] font-sans transition-colors"
            >
              <Share2 size={12} />
              Compartir
            </button>
          </div>
          <div className="flex gap-1.5 justify-between">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-lg transition-all duration-500"
                  style={{
                    height: d.done ? '32px' : '8px',
                    background: d.done
                      ? 'linear-gradient(180deg, #d4af37, #8a6a10)'
                      : '#1e1c18',
                    boxShadow: d.done ? '0 0 8px rgba(212,175,55,0.3)' : 'none',
                    border: d.isToday ? '1px solid #ff8c20' : d.done ? '1px solid #c8a430' : '1px solid #252318',
                    marginTop: d.done ? '0' : '24px',
                  }}
                />
                <span className={`text-[9px] font-sans ${d.isToday ? 'text-[#ff8c20] font-bold' : 'text-[#5a5040]'}`}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selector de Vistas */}
        <div className="flex bg-[#11100c] border border-[#252318] rounded-2xl p-1 mb-8 w-full max-w-md mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-[fadeSlide_0.6s_ease_0.25s_both]">
          {[
            { id: "year", icon: LayoutGrid, label: "Año" },
            { id: "month", icon: Calendar, label: "Mes" },
            { id: "week", icon: List, label: "Semana" },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => saveViewMode(mode.id)}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold font-sans rounded-xl flex items-center justify-center gap-2 transition-all ${viewMode === mode.id ? 'bg-[#d4af37] text-[#131109] shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'text-[#8a7a50] hover:text-[#d4af37]'}`}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Calendario */}
        <div className="w-full flex flex-col items-center animate-[fadeSlide_0.6s_ease_0.3s_both]">

          {/* Navegación */}
          <div className="flex justify-between items-center w-full max-w-md mb-6 px-4">
            <button onClick={navPrev} className="p-2 text-[#8a7a50] hover:text-[#d4af37] transition-colors rounded-full hover:bg-[#1a1812]">
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-lg md:text-xl uppercase tracking-widest text-[#d4af37] text-center font-bold">
              {getNavTitle()}
            </h2>
            <button onClick={navNext} className="p-2 text-[#8a7a50] hover:text-[#d4af37] transition-colors rounded-full hover:bg-[#1a1812]">
              <ChevronRight size={28} />
            </button>
          </div>

          {/* VISTA AÑO */}
          {viewMode === "year" && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {Array.from({ length: 12 }).map((_, mIndex) => (
                <div key={mIndex} className="bg-[#11100c] rounded-2xl p-4 md:p-5 border border-[#252318] shadow-2xl">
                  <h3 className="text-center text-sm md:text-base uppercase tracking-widest text-[#d4af37] mb-4">
                    {MONTH_NAMES[mIndex]}
                  </h3>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEK_DAYS.map((day, i) => (
                      <div key={i} className="text-center text-[9px] md:text-[10px] font-sans tracking-widest text-[#5a5040]">{day}</div>
                    ))}
                  </div>
                  {renderMonthGrid(activeDate.getFullYear(), mIndex)}
                </div>
              ))}
            </div>
          )}

          {/* VISTA MES */}
          {viewMode === "month" && (
            <div className="w-full max-w-md bg-[#11100c] rounded-2xl p-4 md:p-6 border border-[#252318] shadow-2xl">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEK_DAYS.map((day, i) => (
                  <div key={i} className="text-center text-[10px] md:text-[12px] font-sans tracking-widest text-[#5a5040]">{day}</div>
                ))}
              </div>
              {renderMonthGrid(activeDate.getFullYear(), activeDate.getMonth())}
            </div>
          )}

          {/* VISTA SEMANA */}
          {viewMode === "week" && (
            <div className="w-full max-w-md bg-[#11100c] rounded-2xl p-4 md:p-6 border border-[#252318] shadow-2xl">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEK_DAYS.map((day, i) => (
                  <div key={i} className="text-center text-[10px] md:text-[12px] font-sans tracking-widest text-[#5a5040]">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const startOfWeek = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - activeDate.getDay());
                  const dayDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
                  return renderDayCell(dayDate);
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mt-8 animate-[fadeSlide_0.6s_ease_0.4s_both]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#c8a430] border border-[#e0c050]" />
            <span className="text-[10px] uppercase tracking-wider text-[#6a5a40] font-sans">Logrado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#181610] border border-[#252318]" />
            <span className="text-[10px] uppercase tracking-wider text-[#6a5a40] font-sans">Faltante</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[rgba(212,175,55,0.15)] border-2 border-[#ff8c20] shadow-[0_0_8px_rgba(255,140,32,0.4)]" />
            <span className="text-[10px] uppercase tracking-wider text-[#ff8c20] font-sans font-bold">Hoy</span>
          </div>
        </div>

        {/* Recompensas */}
        <div className="w-full max-w-2xl mt-12 animate-[fadeSlide_0.6s_ease_0.5s_both]">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#6a5a40] mb-4 text-center font-sans border-b border-[#252318] pb-2">
            Tus Medallas
          </h3>
          <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
            {REWARDS.map(r => {
              const unlocked = streak >= r.streak;
              return (
                <div
                  key={r.streak}
                  className="flex flex-col items-center p-2 rounded-xl transition-all duration-500"
                  style={{
                    background: unlocked ? "#1a1812" : "transparent",
                    border: `1px solid ${unlocked ? "#3a3420" : "transparent"}`,
                    opacity: unlocked ? 1 : 0.2,
                    filter: unlocked ? "none" : "grayscale(100%)"
                  }}
                >
                  <span className="text-2xl mb-1">{r.emoji}</span>
                  <span className="text-[9px] font-sans text-[#a09070] tracking-wider">{r.streak}d</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {particles.map(p => <Particle key={p.id} {...p} onDone={removeParticle} />)}

      {/* Confetti */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="fixed pointer-events-none z-[1001]"
          style={{
            left: `${c.x}%`,
            top: '-10px',
            width: `${c.size}px`,
            height: `${c.size}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            background: c.color,
            animation: `confetti-fall 3s ease-out ${c.delay}s forwards`,
            '--drift': `${c.drift}px`,
          }}
        />
      ))}

      {toast && (
        <div className="fixed bottom-20 left-1/2 w-max max-w-[90vw] bg-[#131109] border border-[#d4af37] rounded-2xl p-4 flex items-center gap-4 shadow-[0_10px_40px_rgba(212,175,55,0.2)] z-[1000]"
          style={{ animation: "toast-in 3.5s ease forwards" }}>
          <span className="text-4xl animate-bounce">{toast.emoji}</span>
          <div>
            <div className="text-lg text-[#d4af37] font-semibold">{toast.label}</div>
            <div className="text-[10px] text-[#8a7a50] tracking-widest uppercase mt-1 font-sans">
              ¡Racha de {toast.streak} días!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
