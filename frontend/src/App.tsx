import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import GitHubCallback from './pages/GitHubCallback'

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analysis/:analysisId" 
          element={
            <ProtectedRoute>
              <Analysis />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/github/callback" 
          element={
            <ProtectedRoute>
              <GitHubCallback />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auth/github/callback" 
          element={
            <ProtectedRoute>
              <GitHubCallback />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
