import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'

const Home = () => {
  const [subreddit, setSubreddit] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (subreddit.trim()) {
      navigate(`/posts/${subreddit}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Sparkles className="w-16 h-16 text-accent-500" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">ModMind</h1>
        <p className="text-xl text-gray-400 mb-8">AI-Powered Reddit Moderation Suite</p>
      </div>

      <div className="bg-dark-800 rounded-2xl p-8 border border-dark-600">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="Enter subreddit name (e.g., programming, technology)"
              className="w-full pl-12 pr-4 py-4 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
          >
            Analyze
          </button>
        </form>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
            <h3 className="text-lg font-semibold text-white mb-2">Fetch Posts</h3>
            <p className="text-gray-400 text-sm">Browse posts from any subreddit with sorting options</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
            <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
            <p className="text-gray-400 text-sm">Get sentiment, toxicity scores, and moderation suggestions</p>
          </div>
          <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
            <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
            <p className="text-gray-400 text-sm">View subreddit metrics and engagement data</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
