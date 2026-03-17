import { useState, useCallback, useEffect } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { useAuthFetch } from './useAuthFetch'
import { useUserPhoto } from './useUserPhoto'
import EveryDayCalendar from './components/EveryDayCalendar'
import DailyReading from './components/DailyReading'
import LoginPage from './components/LoginPage'
import BottomNav from './components/BottomNav'
import GoalSelector from './components/GoalSelector'
import GoalEditor from './components/GoalEditor'
import CompetitionList from './components/CompetitionList'
import CompetitionDetail from './components/CompetitionDetail'
import ProfileTab from './components/ProfileTab'

const API = '/api'

function App() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress, instance, accounts } = useMsal()
  const authFetch = useAuthFetch()
  const photoUrl = useUserPhoto()
  const userName = accounts[0]?.name || ''

  const [currentTab, setCurrentTab] = useState('calendar')
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [goals, setGoals] = useState([])
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState(null)

  const loadGoals = useCallback(() => {
    authFetch(`${API}/goals`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setGoals(data)
      })
      .catch(() => {})
  }, [authFetch])

  useEffect(() => {
    if (isAuthenticated) loadGoals()
  }, [isAuthenticated, loadGoals])

  const handleLogout = async () => {
    const account = accounts[0]
    await instance.logoutPopup({ account })
    window.location.href = window.location.origin
  }

  const handleCreateGoal = async (goalData) => {
    await authFetch(`${API}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData),
    })
    setShowGoalEditor(false)
    loadGoals()
  }

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0c0a' }}>
        <div className="text-[#d4af37] text-xl animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: '#0d0c0a' }}>
      {currentTab === 'calendar' && (
        <div key={activeGoalId || 'default'} style={{ animation: 'tab-fade 0.25s ease both' }}>
          <GoalSelector
            goals={goals}
            activeGoalId={activeGoalId}
            onSelectGoal={setActiveGoalId}
            onAddGoal={() => setShowGoalEditor(true)}
          />
          <EveryDayCalendar goalId={activeGoalId} />
          <DailyReading />
        </div>
      )}

      {currentTab === 'competitions' && (
        <div style={{ animation: 'tab-fade 0.25s ease both' }}>
          {selectedCompetition ? (
            <CompetitionDetail
              competitionId={selectedCompetition}
              authFetch={authFetch}
              onBack={() => setSelectedCompetition(null)}
            />
          ) : (
            <CompetitionList
              authFetch={authFetch}
              onSelectCompetition={setSelectedCompetition}
              userName={userName}
              photoUrl={photoUrl}
              goals={goals}
            />
          )}
        </div>
      )}

      {currentTab === 'profile' && (
        <div style={{ animation: 'tab-fade 0.25s ease both' }}>
          <ProfileTab
            userName={userName}
            photoUrl={photoUrl}
            goals={goals}
            authFetch={authFetch}
            onGoalsChange={loadGoals}
            onLogout={handleLogout}
          />
        </div>
      )}

      <BottomNav currentTab={currentTab} onChangeTab={(tab) => {
        setCurrentTab(tab)
        if (tab !== 'competitions') setSelectedCompetition(null)
      }} />

      {showGoalEditor && (
        <GoalEditor
          onSave={handleCreateGoal}
          onClose={() => setShowGoalEditor(false)}
        />
      )}

      <style>{`
        @keyframes tab-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

export default App
