import React, { useState } from 'react';
import { LogOut, Edit2, Trash2, Plus } from 'lucide-react';
import GoalEditor from './GoalEditor';

const API = '/api';

export default function ProfileTab({ userName, photoUrl, goals, authFetch, onGoalsChange, onLogout }) {
  const [editingGoal, setEditingGoal] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSaveGoal = async (goalData) => {
    if (goalData.id) {
      await authFetch(`${API}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
    } else {
      await authFetch(`${API}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
    }
    setShowEditor(false);
    setEditingGoal(null);
    onGoalsChange();
  };

  const handleDeleteGoal = async (goalId) => {
    await authFetch(`${API}/goals`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goalId }),
    });
    onGoalsChange();
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6" style={{ animation: 'fadeSlide 0.4s ease both' }}>
      {/* User info */}
      <div className="flex flex-col items-center mb-8">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-20 h-20 rounded-full border-2 border-[#3a3420] object-cover mb-3" />
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-[#3a3420] bg-[#1a1812] flex items-center justify-center mb-3">
            <span className="text-2xl text-[#6a5a40] font-sans font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h2 className="text-lg text-[#d4af37] font-semibold">{userName}</h2>
      </div>

      {/* Goals management */}
      <div className="mb-8">
        <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#6a5a40] font-sans mb-4">
          Tus Metas
        </h3>

        {/* Default goal */}
        <div
          className="p-3 rounded-xl mb-2 flex items-center justify-between"
          style={{ background: '#131109', border: '1px solid #3a3420' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📖</span>
            <span className="text-sm text-[#e0d8c8] font-sans">Principal</span>
          </div>
          <span className="text-[9px] text-[#5a5040] font-sans uppercase tracking-wider">por defecto</span>
        </div>

        {goals.map((goal, idx) => (
          <div
            key={goal.id}
            className="p-3 rounded-xl mb-2 flex items-center justify-between"
            style={{
              background: '#131109',
              border: '1px solid #252318',
              animation: `fadeSlide 0.3s ease ${idx * 0.05}s both`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{goal.emoji}</span>
              <span className="text-sm text-[#e0d8c8] font-sans">{goal.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingGoal(goal); setShowEditor(true); }}
                className="text-[#6a5a40] hover:text-[#d4af37] transition-colors p-1"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-[#6a5a40] hover:text-[#ff6b6b] transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add goal button - below the list */}
        <button
          onClick={() => { setEditingGoal(null); setShowEditor(true); }}
          className="w-full mt-3 py-3 rounded-xl text-sm font-sans font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            background: 'transparent',
            border: '1.5px dashed #3a3420',
            color: '#6a5a40',
          }}
        >
          <Plus size={16} />
          Nueva Meta
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl text-sm font-sans font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
        style={{ background: '#1a1812', border: '1px solid #3a3420', color: '#6a5a40' }}
      >
        <LogOut size={16} />
        Cerrar Sesion
      </button>

      {showEditor && (
        <GoalEditor
          goal={editingGoal}
          onSave={handleSaveGoal}
          onClose={() => { setShowEditor(false); setEditingGoal(null); }}
        />
      )}

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
