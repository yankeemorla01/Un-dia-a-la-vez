import React, { useState, useEffect } from 'react';
import { Plus, LogIn, Trophy, Users, Copy, Check, Trash2 } from 'lucide-react';

const API = '/api';

export default function CompetitionList({ authFetch, onSelectCompetition, userName, photoUrl, goals }) {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState(userName || '');
  const [createGoalId, setCreateGoalId] = useState('none');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState(userName || '');
  const [joinError, setJoinError] = useState('');

  const loadCompetitions = () => {
    authFetch(`${API}/competitions`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCompetitions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadCompetitions(); }, [authFetch]);

  const handleCreate = () => {
    if (!createName.trim() || !createDisplayName.trim()) return;
    authFetch(`${API}/competitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createName.trim(),
        display_name: createDisplayName.trim(),
        photo_url: photoUrl || null,
        goal_id: createGoalId === 'none' ? null : createGoalId,
      }),
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        setShowCreate(false);
        setCreateName('');
        setCreateDisplayName(userName || '');
        setCreateGoalId('none');
        loadCompetitions();
      })
      .catch(() => {});
  };

  const handleJoin = () => {
    if (!joinCode.trim() || !joinDisplayName.trim()) return;
    setJoinError('');
    authFetch(`${API}/competition-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_code: joinCode.trim(),
        display_name: joinDisplayName.trim(),
        photo_url: photoUrl || null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setJoinError(data.error);
        } else {
          setShowJoin(false);
          setJoinCode('');
          setJoinDisplayName(userName || '');
          loadCompetitions();
        }
      })
      .catch(() => setJoinError('Error de conexión'));
  };

  const handleDelete = (id) => {
    authFetch(`${API}/competitions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(() => {
        setConfirmDelete(null);
        loadCompetitions();
      })
      .catch(() => setConfirmDelete(null));
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#d4af37] text-lg animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6" style={{ animation: 'fadeSlide 0.4s ease both' }}>
      <h1 className="text-xl text-[#d4af37] font-semibold mb-6 text-center tracking-wider">
        Competencias
      </h1>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          className="flex-1 py-3 rounded-xl text-xs font-sans font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#d4af37' }}
        >
          <Plus size={16} /> Crear
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          className="flex-1 py-3 rounded-xl text-xs font-sans font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#d4af37' }}
        >
          <LogIn size={16} /> Unirse
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.3s ease both' }}>
          <h3 className="text-sm text-[#d4af37] mb-3 font-semibold">Nueva Competencia</h3>
          <input
            type="text"
            placeholder="Nombre de la competencia"
            value={createName}
            onChange={e => setCreateName(e.target.value)}
            className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
            style={{ caretColor: '#d4af37' }}
          />
          <input
            type="text"
            placeholder="Tu nombre para mostrar"
            value={createDisplayName}
            onChange={e => setCreateDisplayName(e.target.value)}
            className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
            style={{ caretColor: '#d4af37' }}
          />

          {/* Goal selector */}
          <label className="text-[10px] uppercase tracking-[0.15em] text-[#6a5a40] font-sans mb-1.5 block">
            Meta a competir
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setCreateGoalId('none')}
              className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all"
              style={{
                background: createGoalId === 'none' ? '#d4af37' : '#1a1812',
                color: createGoalId === 'none' ? '#131109' : '#6a5a40',
                border: `1px solid ${createGoalId === 'none' ? '#d4af37' : '#252318'}`,
              }}
            >
              📖 Principal
            </button>
            {goals.map(g => (
              <button
                key={g.id}
                onClick={() => setCreateGoalId(g.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all"
                style={{
                  background: createGoalId === g.id ? '#d4af37' : '#1a1812',
                  color: createGoalId === g.id ? '#131109' : '#6a5a40',
                  border: `1px solid ${createGoalId === g.id ? '#d4af37' : '#252318'}`,
                }}
              >
                {g.emoji} {g.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!createName.trim() || !createDisplayName.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold transition-all"
              style={{
                background: createName.trim() && createDisplayName.trim() ? '#d4af37' : '#252318',
                color: createName.trim() && createDisplayName.trim() ? '#131109' : '#5a5040',
              }}
            >
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.3s ease both' }}>
          <h3 className="text-sm text-[#d4af37] mb-3 font-semibold">Unirse a Competencia</h3>
          <input
            type="text"
            placeholder="Codigo de invitacion"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3 tracking-[0.3em] text-center uppercase"
            style={{ caretColor: '#d4af37', letterSpacing: '0.3em' }}
          />
          <input
            type="text"
            placeholder="Tu nombre para mostrar"
            value={joinDisplayName}
            onChange={e => setJoinDisplayName(e.target.value)}
            className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
            style={{ caretColor: '#d4af37' }}
          />
          {joinError && (
            <div className="text-[#ff6b6b] text-xs font-sans mb-3 text-center">{joinError}</div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowJoin(false); setJoinError(''); }} className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]">
              Cancelar
            </button>
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || !joinDisplayName.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold transition-all"
              style={{
                background: joinCode.trim() && joinDisplayName.trim() ? '#d4af37' : '#252318',
                color: joinCode.trim() && joinDisplayName.trim() ? '#131109' : '#5a5040',
              }}
            >
              Unirse
            </button>
          </div>
        </div>
      )}

      {/* Competition cards */}
      {competitions.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: '#3a3420' }} />
          <p className="text-sm text-[#6a5a40] font-sans">No tienes competencias aun</p>
          <p className="text-xs text-[#5a5040] font-sans mt-1">Crea una o unete con un codigo</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {competitions.map((comp, idx) => (
            <div
              key={comp.id}
              className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative"
              style={{
                background: '#131109',
                border: '1px solid #3a3420',
                animation: `fadeSlide 0.3s ease ${idx * 0.05}s both`,
              }}
              onClick={() => onSelectCompetition(comp.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm text-[#d4af37] font-semibold">{comp.name}</h3>
                  {(comp.goal_name || comp.goal_emoji) && (
                    <span className="text-[10px] text-[#8a7a50] font-sans">
                      {comp.goal_emoji} {comp.goal_name}
                    </span>
                  )}
                  {!comp.goal_id && (
                    <span className="text-[10px] text-[#5a5040] font-sans">📖 Principal</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[#6a5a40]">
                    <Users size={12} />
                    <span className="text-[10px] font-sans">{comp.member_count}</span>
                  </div>
                  {comp.is_creator && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(comp.id); }}
                      className="text-[#5a5040] hover:text-[#ff6b6b] transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#5a5040] font-sans">
                  Desde {comp.start_date}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); copyCode(comp.invite_code, comp.id); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-sans font-bold transition-all"
                  style={{ background: '#1a1812', border: '1px solid #252318', color: '#8a7a50' }}
                >
                  {copiedId === comp.id ? <Check size={10} /> : <Copy size={10} />}
                  {comp.invite_code}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-5 text-center"
            style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.2s ease both' }}
            onClick={e => e.stopPropagation()}
          >
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: '#ff6b6b' }} />
            <p className="text-sm text-[#e0d8c8] font-sans mb-4">Eliminar esta competencia?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-white"
                style={{ background: '#dc2626' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
