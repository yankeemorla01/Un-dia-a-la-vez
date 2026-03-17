import React from 'react';
import { Calendar, Trophy, User } from 'lucide-react';

const tabs = [
  { id: 'calendar', icon: Calendar, label: 'Calendario' },
  { id: 'competitions', icon: Trophy, label: 'Competencias' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

export default function BottomNav({ currentTab, onChangeTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#0d0c0a', borderTop: '1px solid #252318' }}>
      <div className="flex justify-around items-center max-w-md mx-auto py-2 relative">
        {tabs.map(tab => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-4 py-1 transition-colors relative"
              style={{ color: active ? '#d4af37' : '#5a5040' }}
            >
              <tab.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-sans tracking-wider uppercase">
                {tab.label}
              </span>
              {active && (
                <div
                  className="absolute -bottom-2 w-5 h-0.5 rounded-full"
                  style={{
                    background: '#d4af37',
                    boxShadow: '0 0 8px rgba(212,175,55,0.6)',
                    animation: 'tab-dot-in 0.3s ease both',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes tab-dot-in {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}
