import React, { useState, useEffect, useReducer } from 'react';
import { Plus, LogIn, Trophy, Users, Copy, Check, Trash2 } from 'lucide-react';

const API = '/api';

// --- Create form reducer ---
const createInitial = { name: '', displayName: '', goalId: 'none', error: '', creating: false };
function createReducer(state, action) {
  switch (action.type) {
    case 'SET_NAME':         return { ...state, name: action.value };
    case 'SET_DISPLAY_NAME': return { ...state, displayName: action.value };
    case 'SET_GOAL_ID':      return { ...state, goalId: action.value };
    case 'SET_ERROR':        return { ...state, error: action.value };
    case 'SET_CREATING':     return { ...state, creating: action.value };
    case 'INIT_DISPLAY':     return { ...state, displayName: state.displayName || action.value };
    case 'RESET':            return { ...createInitial, displayName: action.userName || '' };
    default:                 return state;
  }
}

// --- Join form reducer ---
const joinInitial = { code: '', displayName: '', error: '' };
function joinReducer(state, action) {
  switch (action.type) {
    case 'SET_CODE':         return { ...state, code: action.value };
    case 'SET_DISPLAY_NAME': return { ...state, displayName: action.value };
    case 'SET_ERROR':        return { ...state, error: action.value };
    case 'INIT_DISPLAY':     return { ...state, displayName: state.displayName || action.value };
    case 'RESET':            return { ...joinInitial, displayName: action.userName || '' };
    default:                 return state;
  }
}

// --- Sub-components ---

function CreateCompetitionForm({ form, dispatch, goals, onCancel, onSubmit }) {
  return (
    <div className="mb-6 p-4 rounded-2xl" style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.3s ease both' }}>
      <h3 className="text-sm text-[#d4af37] mb-3 font-semibold">Nueva Competencia</h3>
      <input
        type="text"
        placeholder="Nombre de la competencia"
        value={form.name}
        onChange={e => dispatch({ type: 'SET_NAME', value: e.target.value })}
        className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
        style={{ caretColor: '#d4af37' }}
      />
      <input
        type="text"
        placeholder="Tu nombre para mostrar"
        value={form.displayName}
        onChange={e => dispatch({ type: 'SET_DISPLAY_NAME', value: e.target.value })}
        className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
        style={{ caretColor: '#d4af37' }}
      />

      {/* Goal selector */}
      <span className="text-[10px] uppercase tracking-[0.15em] text-[#6a5a40] font-sans mb-1.5 block">
        Meta a competir
      </span>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => dispatch({ type: 'SET_GOAL_ID', value: 'none' })}
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all"
          style={{
            background: form.goalId === 'none' ? '#d4af37' : '#1a1812',
            color: form.goalId === 'none' ? '#131109' : '#6a5a40',
            border: `1px solid ${form.goalId === 'none' ? '#d4af37' : '#252318'}`,
          }}
        >
          📖 Principal
        </button>
        {goals.map(g => (
          <button
            key={g.id}
            onClick={() => dispatch({ type: 'SET_GOAL_ID', value: g.id })}
            className="px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all"
            style={{
              background: form.goalId === g.id ? '#d4af37' : '#1a1812',
              color: form.goalId === g.id ? '#131109' : '#6a5a40',
              border: `1px solid ${form.goalId === g.id ? '#d4af37' : '#252318'}`,
            }}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {form.error && (
        <div className="text-[#ff6b6b] text-xs font-sans mb-3 text-center">{form.error}</div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]">
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={!form.name.trim() || !form.displayName.trim() || form.creating}
          className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold transition-all"
          style={{
            background: form.name.trim() && form.displayName.trim() && !form.creating ? '#d4af37' : '#252318',
            color: form.name.trim() && form.displayName.trim() && !form.creating ? '#131109' : '#5a5040',
          }}
        >
          {form.creating ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </div>
  );
}

function JoinCompetitionForm({ form, dispatch, onCancel, onSubmit }) {
  return (
    <div className="mb-6 p-4 rounded-2xl" style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.3s ease both' }}>
      <h3 className="text-sm text-[#d4af37] mb-3 font-semibold">Unirse a Competencia</h3>
      <input
        type="text"
        placeholder="Codigo de invitacion"
        value={form.code}
        onChange={e => dispatch({ type: 'SET_CODE', value: e.target.value.toUpperCase() })}
        maxLength={6}
        className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3 tracking-[0.3em] text-center uppercase"
        style={{ caretColor: '#d4af37', letterSpacing: '0.3em' }}
      />
      <input
        type="text"
        placeholder="Tu nombre para mostrar"
        value={form.displayName}
        onChange={e => dispatch({ type: 'SET_DISPLAY_NAME', value: e.target.value })}
        className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-2.5 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] mb-3"
        style={{ caretColor: '#d4af37' }}
      />
      {form.error && (
        <div className="text-[#ff6b6b] text-xs font-sans mb-3 text-center">{form.error}</div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]">
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={!form.code.trim() || !form.displayName.trim()}
          className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold transition-all"
          style={{
            background: form.code.trim() && form.displayName.trim() ? '#d4af37' : '#252318',
            color: form.code.trim() && form.displayName.trim() ? '#131109' : '#5a5040',
          }}
        >
          Unirse
        </button>
      </div>
    </div>
  );
}

function CompetitionCard({ comp, idx, copiedId, onSelect, onCopyCode, onDeleteRequest }) {
  return (
    <div
      key={comp.id}
      role="button"
      tabIndex={0}
      className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative"
      style={{
        background: '#131109',
        border: '1px solid #3a3420',
        animation: `fadeSlide 0.3s ease ${idx * 0.05}s both`,
      }}
      onClick={() => onSelect(comp.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(comp.id); }}
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
              onClick={e => { e.stopPropagation(); onDeleteRequest(comp.id); }}
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
          onClick={e => { e.stopPropagation(); onCopyCode(comp.invite_code, comp.id); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-sans font-bold transition-all"
          style={{ background: '#1a1812', border: '1px solid #252318', color: '#8a7a50' }}
        >
          {copiedId === comp.id ? <Check size={10} /> : <Copy size={10} />}
          {comp.invite_code}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onCancel, onConfirm }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onCancel(); }}
    >
      <div
        role="button"
        tabIndex={0}
        className="w-full max-w-xs rounded-2xl p-5 text-center"
        style={{ background: '#131109', border: '1px solid #3a3420', animation: 'modal-in 0.2s ease both' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => { e.stopPropagation(); }}
      >
        <Trash2 size={32} className="mx-auto mb-3" style={{ color: '#ff6b6b' }} />
        <p className="text-sm text-[#e0d8c8] font-sans mb-4">Eliminar esta competencia?</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-[#6a5a40] bg-[#1a1812] border border-[#252318]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-xs font-sans font-bold text-white"
            style={{ background: '#dc2626' }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main component ---

export default function CompetitionList({ authFetch, onSelectCompetition, userName, photoUrl, goals }) {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [createForm, createDispatch] = useReducer(createReducer, createInitial);
  const [joinForm, joinDispatch] = useReducer(joinReducer, joinInitial);

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
    if (!createForm.name.trim() || !createForm.displayName.trim()) return;
    createDispatch({ type: 'SET_CREATING', value: true });
    createDispatch({ type: 'SET_ERROR', value: '' });
    authFetch(`${API}/competitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name.trim(),
        display_name: createForm.displayName.trim(),
        photo_url: photoUrl || null,
        goal_id: createForm.goalId === 'none' ? null : createForm.goalId,
      }),
    })
      .then(r => r.json().then(data => {
        if (!r.ok) throw new Error(data.error || 'Error al crear');
        return data;
      }))
      .then(() => {
        setShowCreate(false);
        createDispatch({ type: 'RESET', userName });
        loadCompetitions();
      })
      .catch(err => {
        createDispatch({ type: 'SET_ERROR', value: err.message || 'Error al crear competencia' });
      })
      .finally(() => createDispatch({ type: 'SET_CREATING', value: false }));
  };

  const handleJoin = () => {
    if (!joinForm.code.trim() || !joinForm.displayName.trim()) return;
    joinDispatch({ type: 'SET_ERROR', value: '' });
    authFetch(`${API}/competition-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_code: joinForm.code.trim(),
        display_name: joinForm.displayName.trim(),
        photo_url: photoUrl || null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          joinDispatch({ type: 'SET_ERROR', value: data.error });
        } else {
          setShowJoin(false);
          joinDispatch({ type: 'RESET', userName });
          loadCompetitions();
        }
      })
      .catch(() => joinDispatch({ type: 'SET_ERROR', value: 'Error de conexión' }));
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
          onClick={() => {
            setShowCreate(true);
            setShowJoin(false);
            createDispatch({ type: 'INIT_DISPLAY', value: userName });
          }}
          className="flex-1 py-3 rounded-xl text-xs font-sans font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#d4af37' }}
        >
          <Plus size={16} /> Crear
        </button>
        <button
          onClick={() => {
            setShowJoin(true);
            setShowCreate(false);
            joinDispatch({ type: 'INIT_DISPLAY', value: userName });
          }}
          className="flex-1 py-3 rounded-xl text-xs font-sans font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#d4af37' }}
        >
          <LogIn size={16} /> Unirse
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateCompetitionForm
          form={createForm}
          dispatch={createDispatch}
          goals={goals}
          onCancel={() => { setShowCreate(false); createDispatch({ type: 'SET_ERROR', value: '' }); }}
          onSubmit={handleCreate}
        />
      )}

      {/* Join form */}
      {showJoin && (
        <JoinCompetitionForm
          form={joinForm}
          dispatch={joinDispatch}
          onCancel={() => { setShowJoin(false); joinDispatch({ type: 'SET_ERROR', value: '' }); }}
          onSubmit={handleJoin}
        />
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
            <CompetitionCard
              key={comp.id}
              comp={comp}
              idx={idx}
              copiedId={copiedId}
              onSelect={onSelectCompetition}
              onCopyCode={copyCode}
              onDeleteRequest={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <DeleteConfirmationModal
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modal-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
