import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Users, FileText, TrendingUp, MessageSquare, Loader2 } from 'lucide-react'

const Stats = () => {
  const { subreddit } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [subreddit])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = `https://modmind-gcai-backend.onrender.com/api/stats/${subreddit}`
      console.log('Fetching stats from:', apiUrl)
      const response = await axios.get(apiUrl)
      console.log('Stats response:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError(error.message || 'Failed to fetch statistics')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl font-bold text-white">r/{subreddit} Statistics</h1>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Error: {error}</p>
          <p className="text-gray-400 text-sm">Make sure the backend is running at https://modmind-gcai-backend.onrender.com</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-accent-500" />
              <h3 className="text-gray-400">Subscribers</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.subscriber_count.toLocaleString()}</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-green-500" />
              <h3 className="text-gray-400">Active Users</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.active_users.toLocaleString()}</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
              <h3 className="text-gray-400">Total Posts</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_posts.toLocaleString()}</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <h3 className="text-gray-400">Total Comments</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_comments.toLocaleString()}</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 md:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-yellow-500" />
              <h3 className="text-gray-400">Average Score</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avg_score.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>Unable to load statistics</p>
        </div>
      )}
    </div>
  )
}

export default Stats
