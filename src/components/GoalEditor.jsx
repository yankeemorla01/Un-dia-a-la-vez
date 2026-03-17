import React, { useState } from 'react';
import { X } from 'lucide-react';

const EMOJI_OPTIONS = ['📖', '🙏', '💪', '🏃', '📝', '🎯', '❤️', '🧠', '🌱', '⭐', '🔥', '💎', '📚', '🎵', '💡', '🌍'];

export default function GoalEditor({ goal, onSave, onClose }) {
  const [name, setName] = useState(goal?.name || '');
  const [emoji, setEmoji] = useState(goal?.emoji || '📖');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, id: goal?.id });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', animation: 'modal-bg-in 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{
          background: '#131109',
          border: '1px solid #3a3420',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          animation: 'modal-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6a5a40] hover:text-[#d4af37] transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg text-[#d4af37] font-semibold mb-6">
          {goal ? 'Editar Meta' : 'Nueva Meta'}
        </h2>

        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-[0.2em] text-[#6a5a40] font-sans mb-2 block">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Ej: Estudio personal"
            autoFocus
            className="w-full bg-[#1a1812] border border-[#252318] rounded-xl px-4 py-3 text-[#e0d8c8] text-sm font-sans outline-none focus:border-[#d4af37] transition-colors"
            style={{ caretColor: '#d4af37' }}
          />
        </div>

        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-[0.2em] text-[#6a5a40] font-sans mb-2 block">
            Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all"
                style={{
                  background: emoji === e ? '#d4af37' : '#1a1812',
                  border: `1px solid ${emoji === e ? '#d4af37' : '#252318'}`,
                  transform: emoji === e ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3 rounded-xl text-sm font-sans font-bold tracking-wider uppercase transition-all"
          style={{
            background: name.trim() ? '#d4af37' : '#252318',
            color: name.trim() ? '#131109' : '#5a5040',
            boxShadow: name.trim() ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
          }}
        >
          {goal ? 'Guardar' : 'Crear Meta'}
        </button>
      </div>

      <style>{`
        @keyframes modal-bg-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-in { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
