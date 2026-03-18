import React, { useState, useEffect } from 'react';
import { LogOut, Edit2, Trash2, Plus, Sun, Moon, Bell, BellOff } from 'lucide-react';
import GoalEditor from './GoalEditor';

const API = '/api';

export default function ProfileTab({ userName, photoUrl, goals, authFetch, onGoalsChange, onLogout }) {
  const [editingGoal, setEditingGoal] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // Theme
  const [lightMode, setLightMode] = useState(() => localStorage.getItem('udv-theme') === 'light');

  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('udv-light');
      localStorage.setItem('udv-theme', 'light');
    } else {
      document.documentElement.classList.remove('udv-light');
      localStorage.setItem('udv-theme', 'dark');
    }
  }, [lightMode]);

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('udv-notif') === 'on');
  const [notifTime, setNotifTime] = useState(() => localStorage.getItem('udv-notif-time') || '20:00');

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem('udv-notif', 'off');
      return;
    }
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotifEnabled(true);
        localStorage.setItem('udv-notif', 'on');
      }
    }
  };

  const handleTimeChange = (e) => {
    setNotifTime(e.target.value);
    localStorage.setItem('udv-notif-time', e.target.value);
  };

  // Schedule local notification check
  useEffect(() => {
    if (!notifEnabled) return;
    const check = () => {
      const now = new Date();
      const [h, m] = notifTime.split(':').map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Un Día a la Vez', {
            body: '¿Ya completaste tu día hoy? ✨',
            icon: '/icon-192.svg',
            tag: 'daily-reminder',
          });
        }
      }
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [notifEnabled, notifTime]);

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

      {/* Settings */}
      <div className="mb-8">
        <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#6a5a40] font-sans mb-4">
          Ajustes
        </h3>

        {/* Theme toggle */}
        <div
          className="p-3 rounded-xl mb-2 flex items-center justify-between"
          style={{ background: '#131109', border: '1px solid #252318' }}
        >
          <div className="flex items-center gap-3">
            {lightMode ? <Sun size={18} className="text-[#d4af37]" /> : <Moon size={18} className="text-[#6a5a40]" />}
            <span className="text-sm text-[#e0d8c8] font-sans">{lightMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </div>
          <button
            onClick={() => setLightMode(!lightMode)}
            className="w-11 h-6 rounded-full relative transition-all duration-300"
            style={{ background: lightMode ? '#d4af37' : '#252318' }}
          >
            <div
              className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300"
              style={{
                left: lightMode ? '22px' : '2px',
                background: lightMode ? '#131109' : '#6a5a40',
              }}
            />
          </button>
        </div>

        {/* Notification toggle */}
        <div
          className="p-3 rounded-xl mb-2"
          style={{ background: '#131109', border: '1px solid #252318' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifEnabled ? <Bell size={18} className="text-[#d4af37]" /> : <BellOff size={18} className="text-[#6a5a40]" />}
              <span className="text-sm text-[#e0d8c8] font-sans">Recordatorio diario</span>
            </div>
            <button
              onClick={toggleNotifications}
              className="w-11 h-6 rounded-full relative transition-all duration-300"
              style={{ background: notifEnabled ? '#d4af37' : '#252318' }}
            >
              <div
                className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300"
                style={{
                  left: notifEnabled ? '22px' : '2px',
                  background: notifEnabled ? '#131109' : '#6a5a40',
                }}
              />
            </button>
          </div>
          {notifEnabled && (
            <div className="mt-3 flex items-center gap-2 ml-8">
              <span className="text-[10px] text-[#6a5a40] font-sans">Hora:</span>
              <input
                type="time"
                value={notifTime}
                onChange={handleTimeChange}
                className="bg-[#1a1812] border border-[#252318] rounded-lg px-2 py-1 text-sm text-[#d4af37] font-sans outline-none"
                style={{ caretColor: '#d4af37', colorScheme: 'dark' }}
              />
            </div>
          )}
        </div>
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
