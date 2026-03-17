import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import EveryDayCalendar from './components/EveryDayCalendar'
import DailyReading from './components/DailyReading'
import LoginPage from './components/LoginPage'

function App() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()

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
    <>
      <EveryDayCalendar />
      <DailyReading />
    </>
  )
}

export default App
