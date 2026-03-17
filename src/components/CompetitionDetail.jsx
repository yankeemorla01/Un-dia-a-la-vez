import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Trophy } from 'lucide-react';

const API = '/api';

export default function CompetitionDetail({ competitionId, authFetch, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch(`${API}/leaderboard?id=${competitionId}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [competitionId, authFetch]);

  // Refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      authFetch(`${API}/leaderboard?id=${competitionId}`)
        .then(r => r.json())
        .then(d => { if (d.leaderboard) setData(d); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [competitionId, authFetch]);

  const copyCode = () => {
    if (data?.competition?.invite_code) {
      navigator.clipboard.writeText(data.competition.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#d4af37] text-lg animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!data || !data.leaderboard) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#6a5a40] font-sans">Error cargando competencia</p>
        <button onClick={onBack} className="mt-4 text-[#d4af37] text-sm font-sans underline">Volver</button>
      </div>
    );
  }

  const { competition, leaderboard } = data;
  const maxDays = Math.max(...leaderboard.map(m => m.days_completed), 1);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6" style={{ animation: 'fadeSlide 0.4s ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#6a5a40] hover:text-[#d4af37] transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg text-[#d4af37] font-semibold">{competition.name}</h1>
          <p className="text-[10px] text-[#5a5040] font-sans">
            Desde {competition.start_date}{competition.end_date ? ` hasta ${competition.end_date}` : ''}
          </p>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all"
          style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#8a7a50' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {competition.invite_code}
        </button>
      </div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-2">
        {leaderboard.map((member, idx) => {
          const pct = maxDays > 0 ? (member.days_completed / member.total_days) * 100 : 0;
          const isLeader = idx === 0 && member.days_completed > 0;
          const positionEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

          return (
            <div
              key={member.user_id}
              className="p-3 rounded-xl relative overflow-hidden"
              style={{
                background: member.is_me ? '#1a1812' : '#131109',
                border: `1px solid ${member.is_me ? '#3a3420' : '#252318'}`,
                animation: `leaderboard-row 0.4s ease ${idx * 0.05}s both`,
              }}
            >
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <span className="text-lg w-8 text-center">{positionEmoji}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-sans ${member.is_me ? 'text-[#d4af37] font-bold' : 'text-[#e0d8c8]'}`}>
                    {member.display_name}
                    {member.is_me && <span className="text-[9px] text-[#8a7a50] ml-1">(tú)</span>}
                  </span>
                </div>
                <span className="text-sm font-sans font-bold text-[#d4af37]">
                  {member.days_completed}
                  <span className="text-[10px] text-[#6a5a40] font-normal"> / {member.total_days}d</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#1e1c18] rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: isLeader
                      ? 'linear-gradient(90deg, #8a6a10, #d4af37, #f0d060)'
                      : 'linear-gradient(90deg, #8a6a10, #d4af37)',
                    boxShadow: isLeader ? '0 0 12px rgba(212,175,55,0.6)' : '0 0 6px rgba(212,175,55,0.3)',
                    animation: isLeader ? 'leader-glow 2s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: '#3a3420' }} />
          <p className="text-sm text-[#6a5a40] font-sans">Sin participantes aún</p>
        </div>
      )}

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes leaderboard-row { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes leader-glow { 0%, 100% { box-shadow: 0 0 8px rgba(212,175,55,0.4); } 50% { box-shadow: 0 0 18px rgba(212,175,55,0.8); } }
      `}</style>
    </div>
  );
}
