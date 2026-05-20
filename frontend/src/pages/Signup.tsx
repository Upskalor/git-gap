import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { User, Mail, KeyRound, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [goals, setGoals] = useState('')
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    clearError()
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !username || !password || !fullName) return
    const success = await register(email, username, password, fullName, goals)
    if (success) {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-gradient px-4 py-12 relative overflow-hidden">
      {/* Background radial blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="glass-card max-w-lg w-full p-8 rounded-2xl relative z-10 transition-all duration-300 hover:border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-400 mt-2 font-medium">
            Join DualLoop for personalized AI code reviews
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 flex items-start space-x-3 text-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                id="email"
                type="email"
                required
                className="input-field pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                id="password"
                type="password"
                required
                className="input-field pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="goals">
              What are your Learning & Development goals? (Optional)
            </label>
            <textarea
              id="goals"
              className="input-field min-h-[90px] py-3 resize-y"
              placeholder="e.g. Learn security best practices, transition from JS to TS, optimize Python database queries..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
            <p className="text-slate-500 text-xs mt-1 font-medium">
              We'll pass these goals to your AI Mentor so all code suggestions align with what you want to learn.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
