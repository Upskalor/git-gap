import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import axios from 'axios'
import { 
  Github, GitBranch, ShieldAlert, Award, FileCode, CheckCircle, 
  Play, Plus, Save, LogOut, Loader2, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react'

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  url: string
  stars: number
  language: string | null
}

interface Analysis {
  id: string
  repository_id: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const { user, logout, updateProfile, fetchCurrentUser } = useAuthStore()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    total_repositories: 0,
    total_analyses: 0,
    critical_issues: 0,
    avg_analysis_time: 0
  })
  
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([])
  const [repos, setRepos] = useState<Repository[]>([])
  const [isGitHubConnected, setIsGitHubConnected] = useState(false)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [goals, setGoals] = useState(user?.goals || '')
  const [updatingGoals, setUpdatingGoals] = useState(false)
  const [analyzingRepoId, setAnalyzingRepoId] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (user) {
      setGoals(user.goals || '')
      fetchDashboardData()
      checkGitHubConnection()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setLoadingStats(true)
    try {
      const response = await axios.get('/api/dashboard/')
      setStats(response.data.stats)
      setRecentAnalyses(response.data.recent_analyses || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const checkGitHubConnection = async () => {
    setLoadingRepos(true)
    try {
      const response = await axios.get('/api/github/repositories')
      setRepos(response.data)
      setIsGitHubConnected(true)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsGitHubConnected(false)
      } else {
        console.error('Failed to fetch repositories', err)
      }
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleConnectGitHub = async () => {
    try {
      const state = Math.random().toString(36).substring(7)
      const response = await axios.get(`/api/github/auth/url?state=${state}`)
      window.location.href = response.data.authorization_url
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate GitHub auth URL' })
    }
  }

  const handleUpdateGoals = async () => {
    setUpdatingGoals(true)
    setMessage(null)
    const success = await updateProfile(user?.full_name || '', user?.email || '', goals)
    setUpdatingGoals(false)
    if (success) {
      setMessage({ type: 'success', text: 'Learning goals updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Failed to update learning goals' })
    }
  }

  const handleStartAnalysis = async (repoId: string) => {
    setAnalyzingRepoId(repoId)
    setMessage(null)
    try {
      const response = await axios.post('/api/analysis/', {
        repository_id: repoId,
        analysis_type: 'general'
      })
      setMessage({ type: 'success', text: 'Code analysis started successfully!' })
      fetchDashboardData()
      setTimeout(() => {
        setMessage(null)
        navigate(`/analysis/${response.data.id}`)
      }, 1500)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to start analysis' })
    } finally {
      setAnalyzingRepoId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6]">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              DualLoop
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm font-medium">
              Hello, <span className="text-slate-200 font-bold">{user?.full_name || user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 hover:bg-red-950/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-xl border text-sm flex items-start space-x-3 animate-fade-in ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-950/30 border-red-500/30 text-red-300'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl flex items-center space-x-5">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Repositories</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.total_repositories}
              </h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center space-x-5">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Analyses Run</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.total_analyses}
              </h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center space-x-5">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Completed Runs</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.critical_issues}
              </h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center space-x-5">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Avg Duration</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loadingStats ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  `${stats.avg_analysis_time.toFixed(1)}s`
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Dynamic Goal Editor & GitHub Connection Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Goals Editor */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Learning & Development Goals</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Tell us what you want to achieve! Our AI Mentor reviews every analysis finding against these goals, explaining how to optimize or secure your code specifically to support what you want to learn.
              </p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="input-field min-h-[140px] py-3 resize-y font-medium text-slate-200"
                placeholder="e.g. I want to learn secure API design, database performance optimization, and transition from raw SQL to SQLAlchemy securely..."
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpdateGoals}
                disabled={updatingGoals}
                className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/10 flex items-center space-x-2 transition-all duration-200 hover:scale-[1.02]"
              >
                {updatingGoals ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>Save Goals</span>
              </button>
            </div>
          </div>

          {/* GitHub Connection */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border-dashed border-slate-700">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-xl text-slate-300">
                  <Github className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">GitHub Integration</h2>
              </div>
              
              <div className="space-y-4">
                {isGitHubConnected ? (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center space-x-3 text-emerald-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Account Linked</p>
                      <p className="text-xs text-emerald-400/80 mt-0.5">DualLoop has access to your repository list.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3 text-slate-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="font-semibold text-sm">Not Connected</p>
                      <p className="text-xs text-slate-400 mt-0.5">Link GitHub to fetch your repositories and run AI critiques.</p>
                    </div>
                  </div>
                )}
                <p className="text-slate-400 text-xs">
                  Connecting your account allows DualLoop to seamlessly query your public and private repositories, download file contents dynamically, and feed them into the AI analyzer.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {isGitHubConnected ? (
                <button
                  onClick={checkGitHubConnection}
                  disabled={loadingRepos}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingRepos ? 'animate-spin' : ''}`} />
                  <span>Sync Repositories</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectGitHub}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-[#0B0F19] font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-white/5"
                >
                  <Github className="w-5 h-5" />
                  <span>Connect GitHub</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Repositories & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Repositories List */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Select Repository to Analyze</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full">
                {repos.length} Available
              </span>
            </div>

            {loadingRepos ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-slate-400 text-sm font-medium">Fetching repos from GitHub...</p>
              </div>
            ) : !isGitHubConnected ? (
              <div className="text-center py-16 px-4">
                <Github className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No GitHub Account Connected</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                  Please link your GitHub account using the card on the right to browse and select repositories.
                </p>
                <button
                  onClick={handleConnectGitHub}
                  className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-all duration-200"
                >
                  Connect GitHub
                </button>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 font-medium">No repositories found in your GitHub account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {repos.map((repo) => (
                  <div 
                    key={repo.id} 
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-100 hover:text-blue-400 transition-colors break-all">
                          {repo.name}
                        </h4>
                        {repo.language && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full uppercase">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {repo.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold">
                        ⭐ {repo.stars} stars
                      </span>
                      <button
                        onClick={() => handleStartAnalysis(repo.id)}
                        disabled={analyzingRepoId === repo.id}
                        className="py-1.5 px-3 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded-lg transition-all duration-200 flex items-center space-x-1"
                      >
                        {analyzingRepoId === repo.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>Analyze</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Analyses Activity */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <span>Recent Activity</span>
            </h2>

            {recentAnalyses.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 font-medium text-sm">No analysis runs recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {recentAnalyses.map((run) => {
                  const repoName = repos.find(r => r.id === run.repository_id)?.name || 'Repository'
                  return (
                    <div 
                      key={run.id}
                      onClick={() => navigate(`/analysis/${run.id}`)}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-200 flex justify-between items-center hover:scale-[1.01]"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="font-bold text-slate-200 text-sm truncate">{repoName}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          {new Date(run.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        run.status === 'completed' 
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20'
                          : run.status === 'running'
                          ? 'bg-blue-950/30 text-blue-400 border border-blue-500/20 animate-pulse'
                          : run.status === 'failed'
                          ? 'bg-red-950/30 text-red-400 border border-red-500/20'
                          : 'bg-slate-850 text-slate-400 border border-slate-700/20'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
