import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import StoryView from './components/StoryView'
import './App.css'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stories/:id" element={<StoryView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App