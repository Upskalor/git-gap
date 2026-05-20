import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import axios from 'axios'
import { 
  ArrowLeft, ShieldAlert, Sparkles, MessageSquare, Send, 
  Loader2, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Code
} from 'lucide-react'

interface Finding {
  category: string
  severity: string
  description: string
  location: string | null
  file?: string
  line?: number
}

interface AnalysisData {
  id: string
  status: string
  findings: Finding[] | null
  mentorship: string | null
  error_message: string | null
  repository?: {
    name: string
    full_name: string
  }
}

interface Message {
  sender: 'user' | 'mentor'
  text: string
}

export default function Analysis() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Q&A Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'mentor', text: 'Hi! I am your AI Code Mentor. Feel free to ask me anything about the analysis findings, how to fix these issues, or how to align your code with your learning goals!' }
  ])
  const [inputText, setInputText] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAnalysis()
    let pollInterval: NodeJS.Timeout

    if (analysis && (analysis.status === 'pending' || analysis.status === 'running')) {
      pollInterval = setInterval(() => {
        fetchAnalysis()
      }, 3000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [analysisId, analysis?.status])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const fetchAnalysis = async () => {
    try {
      const response = await axios.get(`/api/analysis/${analysisId}`)
      setAnalysis(response.data)
      
      // If completed and mentorship exists but we haven't fetched it yet, pull general mentorship
      if (response.data.status === 'completed' && !response.data.mentorship) {
        generateInitialMentorship()
      }
    } catch (err) {
      console.error('Failed to fetch analysis', err)
    } finally {
      setLoading(false)
    }
  }

  const generateInitialMentorship = async () => {
    try {
      const response = await axios.post(`/api/analysis/${analysisId}/mentorship`, {})
      setAnalysis(prev => prev ? { ...prev, mentorship: response.data.content } : null)
    } catch (err) {
      console.error('Failed to generate general mentorship', err)
    }
  }

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sendingQuestion) return

    const question = inputText
    setInputText('')
    setChatMessages(prev => [...prev, { sender: 'user', text: question }])
    setSendingQuestion(true)

    try {
      const response = await axios.post(`/api/analysis/${analysisId}/mentorship`, {
        question: question
      })
      setChatMessages(prev => [...prev, { sender: 'mentor', text: response.data.content }])
    } catch (err) {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'mentor', text: 'Sorry, I encountered an error while processing your question. Please try again.' }
      ])
    } finally {
      setSendingQuestion(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-400 text-sm font-medium">Loading analysis report...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-bold">Analysis Not Found</h3>
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const isPending = analysis.status === 'pending' || analysis.status === 'running'
  const isFailed = analysis.status === 'failed'
  const isCompleted = analysis.status === 'completed'

  // Severity grouping
  const findings = analysis.findings || []
  const critical = findings.filter(f => f.severity.toLowerCase() === 'critical')
  const high = findings.filter(f => f.severity.toLowerCase() === 'high')
  const medium = findings.filter(f => f.severity.toLowerCase() === 'medium')
  const low = findings.filter(f => f.severity.toLowerCase() === 'low')

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Analysis Report</span>
              <span className="text-slate-500 font-medium">/</span>
              <span className="text-blue-400 font-semibold truncate max-w-[200px] md:max-w-none">
                {analysis.repository?.name || 'Repository'}
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              RUN ID: {analysis.id}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
          isCompleted 
            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20'
            : isPending
            ? 'bg-blue-950/30 text-blue-400 border border-blue-500/20 animate-pulse'
            : 'bg-red-950/30 text-red-400 border border-red-500/20'
        }`}>
          {analysis.status}
        </span>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Scrollable Analysis content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 lg:max-w-[calc(100%-400px)] xl:max-w-[calc(100%-450px)]">
          {/* Running/Pending State */}
          {isPending && (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Analyzing Repository...</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Our system is downloading your repository file structure, resolving imports, running pattern-matching checks, and consulting the AI Mentor.
                </p>
              </div>
              <p className="text-xs text-slate-500 italic font-medium">
                This page will refresh automatically once completed.
              </p>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="glass-card p-8 border-red-500/20 text-center flex flex-col items-center justify-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
              <h3 className="text-2xl font-bold text-white">Analysis Failed</h3>
              <p className="text-red-300 text-sm max-w-lg bg-red-950/20 border border-red-500/20 p-4 rounded-xl font-mono text-left">
                {analysis.error_message || 'An unknown error occurred during code ingestion.'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <>
              {/* Mentorship Report Markdown Block */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">AI Mentor Critique</h2>
                </div>

                {analysis.mentorship ? (
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed prose-headings:text-white prose-a:text-blue-400 prose-code:text-emerald-400 prose-code:bg-slate-900/60 prose-code:p-1 prose-code:rounded prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis.mentorship}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-slate-400 text-sm">Drafting mentor response...</p>
                  </div>
                )}
              </div>

              {/* Automated Findings Breakdown */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
                  <div className="p-2 bg-slate-800 rounded-xl text-slate-300">
                    <Code className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Automated Code Detections</h2>
                </div>

                {findings.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-white">Clean Bill of Health!</h4>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
                      No automated security flaws or quality issues detected in this snapshot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Findings stats */}
                    <div className="flex flex-wrap gap-4 text-xs font-bold">
                      {critical.length > 0 && (
                        <span className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg">
                          🚨 {critical.length} Critical
                        </span>
                      )}
                      {high.length > 0 && (
                        <span className="px-3 py-1.5 bg-orange-950/40 border border-orange-500/30 text-orange-400 rounded-lg">
                          ⚠️ {high.length} High
                        </span>
                      )}
                      {medium.length > 0 && (
                        <span className="px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 text-amber-400 rounded-lg">
                          ⚡ {medium.length} Medium
                        </span>
                      )}
                      {low.length > 0 && (
                        <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                          💡 {low.length} Low
                        </span>
                      )}
                    </div>

                    {/* Detailed Cards */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {findings.map((item, idx) => {
                        const sev = item.severity.toLowerCase()
                        const badgeColor = 
                          sev === 'critical' ? 'bg-red-950/40 text-red-400 border-red-500/30' :
                          sev === 'high' ? 'bg-orange-950/40 text-orange-400 border-orange-500/30' :
                          sev === 'medium' ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                          
                        return (
                          <div 
                            key={idx}
                            className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all duration-200 hover:border-slate-800"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                                  {item.severity}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  {item.category}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-200 text-sm">
                                {item.description}
                              </h4>
                              {item.location && (
                                <p className="text-[11px] font-mono text-emerald-400/90 break-all bg-slate-950/40 px-2.5 py-1 rounded inline-block">
                                  📍 {item.location}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Fixed Chat Sidebar */}
        <div className="w-full lg:w-[400px] xl:w-[450px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-[#0c1221] flex flex-col h-[500px] lg:h-auto overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/40">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Interactive Q&A Mentor</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Ask about fixes, optimizations, or your goals
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[9px] font-semibold text-slate-500 uppercase">
                  {msg.sender === 'user' ? 'You' : 'AI Mentor'}
                </span>
                <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-medium ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-850 text-slate-200 border border-slate-800 rounded-tl-none prose prose-invert prose-xs'
                }`}>
                  {msg.sender === 'mentor' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {sendingQuestion && (
              <div className="flex flex-col items-start space-y-1">
                <span className="text-[9px] font-semibold text-slate-500 uppercase">AI Mentor</span>
                <div className="p-3 bg-slate-850 text-slate-400 border border-slate-850 rounded-2xl rounded-tl-none flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="text-[11px] font-semibold">Formulating suggestions...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form 
            onSubmit={handleSendQuestion}
            className="p-4 border-t border-slate-800 bg-[#090e1b] flex items-center space-x-2"
          >
            <input
              type="text"
              disabled={isPending || isFailed || sendingQuestion}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700/80 focus:border-blue-500/80 text-xs px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-500 font-medium text-slate-200"
              placeholder={isPending ? 'Waiting for analysis completion...' : 'Ask your mentor a question...'}
            />
            <button
              type="submit"
              disabled={isPending || isFailed || !inputText.trim() || sendingQuestion}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md shadow-blue-600/10 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
