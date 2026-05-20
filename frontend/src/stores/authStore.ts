import { create } from 'zustand'
import axios from 'axios'

interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  goals: string | null
  is_active: boolean
  created_at: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, username: string, password: string, fullName: string, goals: string) => Promise<boolean>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  updateProfile: (fullName: string, email: string, goals: string) => Promise<boolean>
  setToken: (token: string, refreshToken: string) => void
  clearError: () => void
}

// Axios defaults
axios.defaults.baseURL = ''
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  setToken: (token: string, refreshToken: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    set({ token, refreshToken, isAuthenticated: true })
  },

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { access_token, refresh_token } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('refreshToken', refresh_token)
      
      set({ 
        token: access_token, 
        refreshToken: refresh_token, 
        isAuthenticated: true 
      })
      
      await get().fetchCurrentUser()
      set({ isLoading: false })
      return true
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Login failed'
      set({ error: errMsg, isLoading: false })
      return false
    }
  },

  register: async (email, username, password, fullName, goals) => {
    set({ isLoading: true, error: null })
    try {
      await axios.post('/api/auth/register', {
        email,
        username,
        password,
        full_name: fullName,
        goals
      })
      set({ isLoading: false })
      return true
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed'
      set({ error: errMsg, isLoading: false })
      return false
    }
  },

  updateProfile: async (fullName, email, goals) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.put('/api/auth/profile', {
        full_name: fullName,
        email,
        goals
      })
      set({ user: response.data, isLoading: false })
      return true
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update profile'
      set({ error: errMsg, isLoading: false })
      return false
    }
  },

  fetchCurrentUser: async () => {
    if (!get().token) return
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get('/api/auth/me')
      set({ user: response.data, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout()
      }
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    set({ 
      token: null, 
      refreshToken: null, 
      user: null, 
      isAuthenticated: false,
      error: null 
    })
  }
}))
