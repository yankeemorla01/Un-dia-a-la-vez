import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, ChevronLeft, ChevronRight, X, Calendar, BookMarked, Loader2, Volume2, Square, Loader } from "lucide-react";
import dailyReadings from "../data/dailyReadings.json";
import bibleSchedule from "../data/bibleReadingSchedule.json";
import bibleBooks from "../data/bibleBooks.json";
import ttsStyles from "../data/ttsStyles.json";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const FULL_WEEK_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Full book names to slugs for weekly reading
const FULL_BOOK_SLUGS = {
  "Salmos": "salmos",
  "Proverbios": "proverbios",
  "Eclesiastés": "eclesiastes",
  "Cantar de los Cantares": "cantar-de-los-cantares",
  "Isaías": "isaias",
  "Jeremías": "jeremias",
  "Lamentaciones": "lamentaciones",
  "Ezequiel": "ezequiel",
};

// Normalize jw.org slugs to local JSON keys (remove accents, lowercase)
function normalizeSlug(slug) {
  return slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/^el-/, '');
}

// Cache for loaded Bible data
let bibleDataCache = null;
async function loadBibleData() {
  if (bibleDataCache) return bibleDataCache;
  const res = await fetch('/biblia_nwt_estudio_es.json');
  bibleDataCache = await res.json();
  return bibleDataCache;
}

function getDateKey(date) {
  return `2026-${date.getMonth()}-${date.getDate()}`;
}

function formatDate(date) {
  return `${FULL_WEEK_DAYS[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
}

function getWeeklyReading(date) {
  let current = null;
  for (const entry of bibleSchedule) {
    const entryDate = new Date(2026, entry.month, entry.day);
    if (entryDate <= date) {
      current = entry;
    }
  }
  return current ? current.reading : null;
}

function parseReadingChapters(reading) {
  // Parse "Salmos 127 a 134" -> [{book: "salmos", chapter: 127}, ..., {book: "salmos", chapter: 134}]
  // Parse "Proverbios 3" -> [{book: "proverbios", chapter: 3}]
  // Parse "Eclesiastés 1, 2" -> [{book: "Eclesiástés", chapter: 1}, {book: "Eclesiástés", chapter: 2}]
  for (const [bookName, slug] of Object.entries(FULL_BOOK_SLUGS)) {
    if (reading.startsWith(bookName)) {
      const rest = reading.slice(bookName.length).trim();
      const rangeMatch = rest.match(/(\d+)\s+a\s+(\d+)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        const chapters = [];
        for (let i = start; i <= end; i++) {
          chapters.push({ book: slug, bookName, chapter: i });
        }
        return chapters;
      }
      const commaMatch = rest.match(/(\d+(?:\s*,\s*\d+)*)/);
      if (commaMatch) {
        return commaMatch[1].split(',').map(n => ({
          book: slug,
          bookName,
          chapter: parseInt(n.trim()),
        }));
      }
    }
  }
  return [];
}

// Build regex to match Bible references like "Luc. 7:12" or "1 Cor. 15:45"
function buildRefRegex() {
  const bookPatterns = Object.keys(bibleBooks)
    .sort((a, b) => b.length - a.length)
    .map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`((?:${bookPatterns})\\s+\\d+(?::\\d+[\\d,\\s\\-a-z]*)?)`, 'g');
}

const REF_REGEX = buildRefRegex();

function parseRef(refText) {
  for (const [abbr, info] of Object.entries(bibleBooks)) {
    if (refText.startsWith(abbr)) {
      const rest = refText.slice(abbr.length).trim();
      const chapterMatch = rest.match(/^(\d+)/);
      if (!chapterMatch) return null;
      const chapter = parseInt(chapterMatch[1]);
      const verseMatch = rest.match(/^\d+:(\d+)/);
      const verse = verseMatch ? parseInt(verseMatch[1]) : null;
      return { slug: info.slug, chapter, verse, abbr, num: info.num };
    }
  }
  return null;
}

function RichText({ text, onOpenBible }) {
  const parts = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(REF_REGEX.source, REF_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    const refText = match[1];

    if (lastIndex < match.index) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    const parsed = parseRef(refText);
    if (parsed) {
      parts.push({ type: "ref", content: refText, parsed });
    } else {
      parts.push({ type: "text", content: refText });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === "ref" ? (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              onOpenBible(part.parsed.slug, part.parsed.chapter, part.parsed.verse);
            }}
            className="inline transition-colors cursor-pointer"
            style={{
              color: "#d4af37",
              textDecoration: "underline",
              textDecorationColor: "rgba(212,175,55,0.3)",
              textUnderlineOffset: "2px",
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
            }}
          >
            {part.content}
          </button>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}

// Inline verse popup - shows just the referenced verse(s) as a compact popup
function VersePopup({ book, chapter, verse, onClose }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadBibleData()
      .then(bible => {
        const key = normalizeSlug(book);
        const bookData = bible[key];
        if (!bookData) { setText("Libro no encontrado"); setLoading(false); return; }
        const chapterData = bookData[String(chapter)];
        if (!chapterData) { setText("Capítulo no encontrado"); setLoading(false); return; }

        const bookTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

        if (verse) {
          const found = chapterData.find(v => v[0] === verse);
          setText(found ? found[1] : "Versículo no encontrado");
          setTitle(`${bookTitle} ${chapter}:${verse}`);
        } else {
          // Show all verses of the chapter as paragraphs
          const allText = chapterData.map(v => `${v[0]} ${v[1]}`).join('\n');
          setText(allText);
          setTitle(`${bookTitle} ${chapter}`);
        }
        setLoading(false);
      })
      .catch(() => { setText("Error al cargar"); setLoading(false); });
  }, [book, chapter, verse]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={onClose}
      style={{ animation: "verse-fade-in 0.2s ease-out" }}
    >
      <style>{`
        @keyframes verse-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes verse-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative mx-4 mb-4 sm:mb-0 w-full sm:max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#131109",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.1)",
          animation: "verse-slide-up 0.25s ease-out",
          maxHeight: "60vh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#252318]">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#d4af37]" />
            <span className="text-sm font-serif font-bold text-[#d4af37]">
              {loading ? "Cargando..." : title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#1a1812] transition-colors text-[#6a5a40] hover:text-[#d4af37]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Verse text */}
        <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: "calc(60vh - 52px)", WebkitOverflowScrolling: "touch" }}>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="text-[#d4af37] animate-spin" />
            </div>
          ) : verse ? (
            <p className="text-[#e8dcc0] text-[15px] leading-relaxed font-serif">
              <sup className="text-[10px] font-sans font-bold text-[#d4af37] mr-1">{verse}</sup>
              {text}
            </p>
          ) : (
            <div className="space-y-1.5">
              {text.split('\n').map((line, i) => {
                const numMatch = line.match(/^(\d+)\s(.+)/);
                return numMatch ? (
                  <p key={i} className="text-sm leading-relaxed font-serif text-[#a09070]">
                    <sup className="text-[10px] font-sans font-bold text-[#d4af37] mr-1">{numMatch[1]}</sup>
                    {numMatch[2]}
                  </p>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Map abbreviations to full book names for TTS
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
  "1 Juan": "1 Juan", "2 Juan": "2 Juan", "3 Juan": "3 Juan",
  "Jud.": "Judas", "Apoc.": "Apocalipsis",
};

function expandAbbreviations(text) {
  let result = text;
  // Sort by length descending so "1 Cor." matches before "Cor." etc.
  const sorted = Object.entries(ABBR_TO_FULL).sort((a, b) => b[0].length - a[0].length);
  for (const [abbr, full] of sorted) {
    result = result.replaceAll(abbr, full);
  }
  return result;
}

const VOICE_FEMALE = "es-MX-DaliaNeural";
const VOICE_MALE = "es-MX-JorgeNeural";

function useTTS() {
  const [ttsState, setTtsState] = useState("idle"); // idle | loading | playing
  const audioRef = useRef(null);
  const queueRef = useRef([]);

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setTtsState("idle");
  }, []);

  const fetchAudio = useCallback(async (text, voice, style) => {
    const body = { text, voice };
    if (style) body.style = style;
    const res = await fetch(import.meta.env.VITE_TTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": import.meta.env.VITE_TTS_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("TTS error");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, []);

  const playUrl = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        reject(new Error("Audio playback error"));
      };
      audio.play().catch(reject);
    });
  }, []);

  const play = useCallback(async (segments) => {
    // segments: [{ text, voice, style }, ...]
    stop();
    setTtsState("loading");
    const expanded = segments.map(s => ({
      text: expandAbbreviations(s.text),
      voice: s.voice,
      style: s.style,
    }));
    queueRef.current = expanded;

    try {
      // Pre-fetch all segments in parallel
      const urlPromises = expanded.map(s => fetchAudio(s.text, s.voice, s.style));
      // Wait for at least the first one to start playing immediately
      const firstUrl = await urlPromises[0];
      if (queueRef.current.length === 0) return; // stopped
      setTtsState("playing");
      // Play first while others keep loading
      const playFirst = playUrl(firstUrl);
      // Wait for remaining fetches in background
      const remainingUrls = await Promise.all(urlPromises.slice(1));
      await playFirst;
      // Play the rest sequentially (already pre-fetched)
      for (const url of remainingUrls) {
        if (queueRef.current.length === 0) {
          URL.revokeObjectURL(url);
          break;
        }
        await playUrl(url);
      }
    } catch {
      // stopped or error
    }
    if (queueRef.current.length > 0) {
      queueRef.current = [];
      setTtsState("idle");
    }
  }, [stop, fetchAudio, playUrl]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { ttsState, play, stop };
}

export default function DailyReading() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("texto");
  const [bibleView, setBibleView] = useState(null); // { book, chapter, verse }
  const contentRef = useRef(null);
  const { ttsState, play: ttsPlay, stop: ttsStop } = useTTS();

  const key = getDateKey(currentDate);
  const reading = dailyReadings[key];
  const weeklyReading = getWeeklyReading(currentDate);
  const weeklyChapters = weeklyReading ? parseReadingChapters(weeklyReading) : [];

  const goToDay = (offset) => {
    ttsStop();
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      if (next.getFullYear() !== 2026) return prev;
      return next;
    });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const openBible = useCallback((book, chapter, verse) => {
    setBibleView({ book, chapter, verse });
  }, []);

  const closeBible = useCallback(() => {
    setBibleView(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentDate(new Date());
      setActiveTab("texto");
      setBibleView(null);
    } else {
      ttsStop();
    }
  }, [isOpen, ttsStop]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #1a1812, #252218)",
          borderColor: "#d4af37",
          boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
          color: "#d4af37",
        }}
      >
        <BookOpen size={20} />
        <span className="text-sm font-sans font-bold tracking-wide">Texto del día</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "#0d0c0a",
          border: "1px solid #252318",
          boxShadow: "0 -10px 60px rgba(212,175,55,0.15)",
          animation: "reading-slide-up 0.4s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes reading-slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Verse popup overlay */}
        {bibleView && (
          <VersePopup
            book={bibleView.book}
            chapter={bibleView.chapter}
            verse={bibleView.verse}
            onClose={closeBible}
          />
        )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#d4af37]" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#6a5a40] font-sans font-bold">
                  Examinemos las Escrituras
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#1a1812] transition-colors text-[#6a5a40] hover:text-[#d4af37]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex mx-5 mt-2 mb-3 bg-[#11100c] rounded-xl p-1 border border-[#1e1c18]">
              <button
                onClick={() => { setActiveTab("texto"); if (contentRef.current) contentRef.current.scrollTop = 0; }}
                className={`flex-1 py-2 text-xs font-sans font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "texto"
                    ? "bg-[#d4af37] text-[#131109] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    : "text-[#8a7a50] hover:text-[#d4af37]"
                }`}
              >
                <BookOpen size={14} />
                Texto del día
              </button>
              <button
                onClick={() => { setActiveTab("lectura"); if (contentRef.current) contentRef.current.scrollTop = 0; }}
                className={`flex-1 py-2 text-xs font-sans font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "lectura"
                    ? "bg-[#d4af37] text-[#131109] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    : "text-[#8a7a50] hover:text-[#d4af37]"
                }`}
              >
                <BookMarked size={14} />
                Lectura bíblica
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={() => goToDay(-1)}
                className="p-2 rounded-full hover:bg-[#1a1812] transition-colors text-[#8a7a50] hover:text-[#d4af37]"
              >
                <ChevronLeft size={22} />
              </button>
              <button onClick={goToToday} className="text-center">
                <div className="text-base sm:text-lg text-[#d4af37] font-bold tracking-wide">
                  {formatDate(currentDate)}
                </div>
                {currentDate.toDateString() !== new Date().toDateString() && (
                  <div className="text-[9px] text-[#ff8c20] uppercase tracking-wider font-sans mt-0.5">
                    Toca para ir a hoy
                  </div>
                )}
              </button>
              <button
                onClick={() => goToDay(1)}
                className="p-2 rounded-full hover:bg-[#1a1812] transition-colors text-[#8a7a50] hover:text-[#d4af37]"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ WebkitOverflowScrolling: "touch" }}>

              {/* TAB: Texto del día */}
              {activeTab === "texto" && (
                <>
                  {reading ? (
                    <>
                      <div
                        className="rounded-2xl p-4 sm:p-5"
                        style={{
                          background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))",
                          border: "1px solid rgba(212,175,55,0.15)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] tracking-[0.2em] uppercase text-[#8a7a50] font-sans">
                            Texto del día
                          </div>
                          <button
                            onClick={() => {
                              if (ttsState === "playing" || ttsState === "loading") {
                                ttsStop();
                              } else if (ttsState === "idle" && reading) {
                                const dayStyles = ttsStyles[key] || {};
                                ttsPlay([
                                  { text: reading.text, voice: VOICE_FEMALE, style: dayStyles.textStyle },
                                  { text: reading.commentary, voice: VOICE_MALE, style: dayStyles.commentaryStyle },
                                ]);
                              }
                            }}
                            className="p-1.5 rounded-full transition-all hover:bg-[#1a1812]"
                            title={ttsState === "playing" ? "Detener" : "Escuchar"}
                          >
                            {ttsState === "loading" ? (
                              <Loader size={16} className="text-[#d4af37] animate-spin" />
                            ) : ttsState === "playing" ? (
                              <Square size={16} className="text-[#d4af37]" />
                            ) : (
                              <Volume2 size={16} className="text-[#8a7a50] hover:text-[#d4af37]" />
                            )}
                          </button>
                        </div>
                        <p className="text-[#e8dcc0] text-base sm:text-lg leading-relaxed font-serif italic">
                          <RichText text={reading.text} onOpenBible={openBible} />
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[9px] tracking-[0.2em] uppercase text-[#8a7a50] font-sans">
                          Comentario
                        </div>
                        <p className="text-[#b8a880] text-sm sm:text-[15px] leading-relaxed font-serif">
                          <RichText text={reading.commentary} onOpenBible={openBible} />
                        </p>
                      </div>

                      {reading.source && (
                        <div className="pt-3 border-t border-[#252318]">
                          <p className="text-[11px] text-[#5a5040] font-sans italic">
                            {reading.source}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-[#6a5a40] text-sm font-sans">
                        No hay lectura disponible para este día.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* TAB: Lectura bíblica */}
              {activeTab === "lectura" && (
                <>
                  {weeklyReading ? (
                    <div className="space-y-5">
                      <div
                        className="rounded-2xl p-5 sm:p-6 text-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))",
                          border: "1px solid rgba(212,175,55,0.2)",
                        }}
                      >
                        <div className="text-[9px] tracking-[0.3em] uppercase text-[#8a7a50] font-sans mb-3">
                          Lectura de la semana
                        </div>
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <BookMarked size={24} className="text-[#d4af37]" />
                          <p className="text-[#e8dcc0] text-xl sm:text-2xl font-serif font-bold">
                            {weeklyReading}
                          </p>
                        </div>
                        <div className="text-[10px] text-[#6a5a40] font-sans tracking-wide mb-4">
                          Reunión Vida y Ministerio Cristianos
                        </div>

                        {/* Chapter buttons */}
                        {weeklyChapters.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {weeklyChapters.map((ch, i) => (
                              <button
                                key={i}
                                onClick={() => openBible(ch.book, ch.chapter, null)}
                                className="px-4 py-2 rounded-xl text-sm font-sans font-bold transition-all hover:scale-105 active:scale-95"
                                style={{
                                  background: "#d4af37",
                                  color: "#131109",
                                  boxShadow: "0 4px 15px rgba(212,175,55,0.3)",
                                }}
                              >
                                <BookOpen size={14} className="inline mr-1.5" />
                                {weeklyChapters.length === 1 ? "Leer" : `Cap. ${ch.chapter}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-[9px] tracking-[0.2em] uppercase text-[#8a7a50] font-sans">
                          Programa completo de lectura
                        </div>
                        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                          {bibleSchedule.map((entry, i) => {
                            const entryDate = new Date(2026, entry.month, entry.day);
                            const isCurrent = weeklyReading === entry.reading;
                            const isPast = entryDate < new Date() && !isCurrent;
                            const chapters = parseReadingChapters(entry.reading);
                            const firstChapter = chapters[0];
                            return (
                              <button
                                key={i}
                                onClick={() => firstChapter && openBible(firstChapter.book, firstChapter.chapter, null)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all w-full text-left ${
                                  isCurrent ? "border" : ""
                                } hover:bg-[#1a1812]`}
                                style={{
                                  background: isCurrent ? "rgba(212,175,55,0.1)" : "transparent",
                                  borderColor: isCurrent ? "rgba(212,175,55,0.3)" : "transparent",
                                  opacity: isPast ? 0.4 : 1,
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {isPast && <span className="text-[#6a5a40] text-xs">✓</span>}
                                  {isCurrent && <span className="text-[#d4af37] text-xs">▸</span>}
                                  <span className={`text-xs font-sans ${isCurrent ? "text-[#d4af37] font-bold" : "text-[#8a7a50]"}`}>
                                    {MONTH_NAMES[entry.month]} {entry.day}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-serif ${isCurrent ? "text-[#e8dcc0] font-bold" : "text-[#6a5a40]"}`}>
                                    {entry.reading}
                                  </span>
                                  <BookOpen size={10} className="text-[#5a5040]" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-[#6a5a40] text-sm font-sans">
                        No hay lectura asignada para esta fecha.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#252318]">
              <button
                onClick={() => goToDay(-1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-sans transition-all text-[#8a7a50] hover:text-[#d4af37] hover:bg-[#1a1812]"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <div className="flex items-center gap-1.5 text-[10px] text-[#5a5040] font-sans">
                <Calendar size={12} />
                {currentDate.getDate()}/{currentDate.getMonth() + 1}
              </div>
              <button
                onClick={() => goToDay(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-sans font-bold transition-all text-[#d4af37] hover:bg-[#1a1812]"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
      </div>
    </div>
  );
}
