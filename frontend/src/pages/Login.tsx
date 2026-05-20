import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { KeyRound, Mail, AlertTriangle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    clearError()
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    const success = await login(email, password)
    if (success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-gradient px-4 relative overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="glass-card max-w-md w-full p-8 rounded-2xl relative z-10 transition-all duration-300 hover:border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome back
          </h2>
          <p className="text-slate-400 mt-2 font-medium">
            Sign in to start receiving AI code mentorship
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 flex items-start space-x-3 text-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="password">
                Password
              </label>
            </div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-300 transition-colors"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  )
}
