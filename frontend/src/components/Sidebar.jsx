import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, BarChart3, Brain } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-600 p-6">
      <div className="flex items-center gap-3 mb-10">
        <Brain className="w-8 h-8 text-accent-500" />
        <h1 className="text-2xl font-bold text-white">ModMind</h1>
      </div>

      <nav className="space-y-2">
        <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/') ? 'bg-accent-500 text-white' : 'text-gray-300 hover:bg-dark-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/posts/example"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/posts/') ? 'bg-accent-500 text-white' : 'text-gray-300 hover:bg-dark-700'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Posts</span>
        </Link>

        <Link
          to="/stats/example"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive('/stats/') ? 'bg-accent-500 text-white' : 'text-gray-300 hover:bg-dark-700'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Statistics</span>
        </Link>
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-dark-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">AI-Powered Reddit Moderation</p>
          <p className="text-xs text-gray-500">Analyze posts with Gemini AI</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
