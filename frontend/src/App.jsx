import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import StoryView from './components/StoryView'
import './App.css'
import './index.css'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false

    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      try {
        return JSON.parse(saved)
      } catch {
        return false
      }
    }

    // first load: fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }

    return false
  })

  // keep <html> class + localStorage in sync
  useEffect(() => {
    if (typeof window === 'undefined') return

    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Landing darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
        <Route
          path="/stories/:id"
          element={<StoryView darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
      </Routes>
    </Router>
  )
}

export default App
