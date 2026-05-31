import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Posts from './pages/Posts'
import Stats from './pages/Stats'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-dark-900">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts/:subreddit" element={<Posts />} />
            <Route path="/stats/:subreddit" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
