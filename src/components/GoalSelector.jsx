import React from 'react';
import { Plus } from 'lucide-react';

export default function GoalSelector({ goals, activeGoalId, onSelectGoal, onAddGoal }) {
  return (
    <div className="w-full max-w-2xl mb-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 px-4 py-1 min-w-min">
        {/* Default goal (legacy / no goal_id) */}
        <button
          onClick={() => onSelectGoal(null)}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-sans font-bold tracking-wider transition-all duration-200 whitespace-nowrap"
          style={{
            background: activeGoalId === null ? '#d4af37' : 'transparent',
            color: activeGoalId === null ? '#131109' : '#d4af37',
            border: `1.5px solid ${activeGoalId === null ? '#d4af37' : '#3a3420'}`,
            boxShadow: activeGoalId === null ? '0 0 12px rgba(212,175,55,0.3)' : 'none',
            animation: 'goal-pill-in 0.3s ease both',
          }}
        >
          📖 Principal
        </button>

        {goals.map((goal, idx) => {
          const active = activeGoalId === goal.id;
          return (
            <button
              key={goal.id}
              onClick={() => onSelectGoal(goal.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-sans font-bold tracking-wider transition-all duration-200 whitespace-nowrap"
              style={{
                background: active ? '#d4af37' : 'transparent',
                color: active ? '#131109' : '#d4af37',
                border: `1.5px solid ${active ? '#d4af37' : '#3a3420'}`,
                boxShadow: active ? '0 0 12px rgba(212,175,55,0.3)' : 'none',
                animation: `goal-pill-in 0.3s ease ${idx * 0.05}s both`,
              }}
            >
              {goal.emoji} {goal.name}
            </button>
          );
        })}

        <button
          onClick={onAddGoal}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            border: '1.5px dashed #3a3420',
            color: '#6a5a40',
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      <style>{`
        @keyframes goal-pill-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
