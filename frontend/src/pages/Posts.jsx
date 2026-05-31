import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, MessageSquare, TrendingUp, Brain, Loader2 } from 'lucide-react'

const Posts = () => {
  const { subreddit } = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('hot')
  const [analyzingPost, setAnalyzingPost] = useState(null)
  const [analysisResults, setAnalysisResults] = useState({})

  useEffect(() => {
    fetchPosts()
  }, [subreddit, sort])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = `https://modmind-gcai-backend.onrender.com/api/posts/${subreddit}?limit=25&sort=${sort}`
      console.log('Fetching posts from:', apiUrl)
      const response = await axios.get(apiUrl)
      console.log('API Response:', response.data)
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError(error.message || 'Failed to fetch posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const analyzePost = async (post) => {
    try {
      setAnalyzingPost(post.id)
      const apiUrl = 'https://modmind-gcai-backend.onrender.com/api/analyze'
      console.log('Analyzing post:', post.id, 'at:', apiUrl)
      const response = await axios.post(apiUrl, {
        post_id: post.id,
        subreddit: subreddit,
        content: post.selftext || post.title,
        title: post.title
      })
      console.log('Analysis response:', response.data)
      setAnalysisResults(prev => ({
        ...prev,
        [post.id]: response.data
      }))
    } catch (error) {
      console.error('Error analyzing post:', error)
      alert('Failed to analyze post. Make sure the backend is running.')
    } finally {
      setAnalyzingPost(null)
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-400'
      case 'negative': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'approve': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'remove': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'flag': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
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
        <h1 className="text-3xl font-bold text-white">r/{subreddit}</h1>
      </div>

      <div className="flex gap-4 mb-6">
        {['hot', 'new', 'top', 'rising'].map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              sort === s
                ? 'bg-accent-500 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading posts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">Error: {error}</p>
          <p className="text-gray-400 text-sm">Make sure the backend is running at https://modmind-gcai-backend.onrender.com</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-dark-800 rounded-lg p-6 border border-dark-600">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-2">{post.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>u/{post.author}</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {post.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {post.num_comments}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => analyzePost(post)}
                  disabled={analyzingPost === post.id}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-dark-600 disabled:text-gray-500 text-white rounded-lg transition-colors"
                >
                  {analyzingPost === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Analyze</span>
                </button>
              </div>

              {post.selftext && (
                <p className="text-gray-300 mb-4 line-clamp-3">{post.selftext}</p>
              )}

              {analysisResults[post.id] && (
                <div className="mt-4 bg-dark-700 rounded-lg p-4 border border-dark-600">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent-500" />
                    AI Analysis
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Sentiment</p>
                      <p className={`font-semibold ${getSentimentColor(analysisResults[post.id].sentiment)}`}>
                        {analysisResults[post.id].sentiment}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Toxicity</p>
                      <p className="font-semibold text-white">
                        {(analysisResults[post.id].toxicity_score * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Action</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getActionColor(analysisResults[post.id].suggested_action)}`}>
                        {analysisResults[post.id].suggested_action}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Confidence</p>
                      <p className="font-semibold text-white">
                        {(analysisResults[post.id].confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-3">{analysisResults[post.id].reasoning}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Posts
