import React, { useState, useEffect, createContext, useContext } from 'react'
import Home from './pages/Home.jsx'
import SearchResults from './pages/SearchResults.jsx'
import TripDetail from './pages/TripDetail.jsx'
import DriverPanel from './pages/DriverPanel.jsx'
import { supabase } from './lib/supabase.js'
import { getTelegramUser } from './lib/telegram.js'

export const AppContext = createContext(null)

export default function App() {
  const [screen, setScreen] = useState('home')
  const [searchParams, setSearchParams] = useState(null)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [history, setHistory] = useState(['home'])

  useEffect(() => { initUser() }, [])

  async function initUser() {
    const tgUser = getTelegramUser()
    const { data } = await supabase
      .from('users')
      .upsert({
        telegram_id: tgUser.id,
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
        username: tgUser.username || ''
      }, { onConflict: 'telegram_id' })
      .select()
      .single()
    if (data) setCurrentUser(data)
  }

  function navigate(to, params = {}) {
    setHistory(prev => [...prev, to])
    if (params.trip) setSelectedTrip(params.trip)
    if (params.search) setSearchParams(params.search)
    setScreen(to)
    window.scrollTo(0, 0)
  }

  function goBack() {
    const newHistory = [...history]
    newHistory.pop()
    const prev = newHistory[newHistory.length - 1] || 'home'
    setHistory(newHistory)
    setScreen(prev)
    window.scrollTo(0, 0)
  }

  return (
    <AppContext.Provider value={{ currentUser, navigate, goBack }}>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #080E1A 0%, #0C1525 100%)' }}>
        {screen === 'home'        && <Home />}
        {screen === 'results'     && <SearchResults params={searchParams} />}
        {screen === 'trip-detail' && <TripDetail trip={selectedTrip} />}
        {screen === 'driver'      && <DriverPanel />}
      </div>
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
