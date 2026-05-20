import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Github, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function GitHubCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setStatus('error')
      setErrorMessage('OAuth callback parameters missing')
      return
    }

    const connectGitHub = async () => {
      try {
        await axios.post(`/api/github/auth/callback?code=${code}&state=${state}`)
        setStatus('success')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.response?.data?.detail || 'Failed to connect your GitHub account')
      }
    }

    connectGitHub()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-gradient px-4">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-full border border-slate-700 animate-spin">
              <Github className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Connecting GitHub...</h2>
            <p className="text-slate-400 text-sm">
              Linking your repositories. This will only take a moment.
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-scale-up">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-full">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Linked Successfully!</h2>
            <p className="text-emerald-300/80 text-sm font-medium">
              Your GitHub account has been connected.
            </p>
            <p className="text-slate-400 text-xs">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-scale-up">
            <div className="inline-flex items-center justify-center p-4 bg-red-950/30 border border-red-500/30 rounded-full">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
            <p className="text-red-300 text-sm font-medium">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
