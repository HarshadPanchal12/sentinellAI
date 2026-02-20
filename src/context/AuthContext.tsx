import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
    id: number
    username: string
    email: string
    role: string
    department?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    login: (username: string, password: string) => Promise<boolean>
    register: (username: string, email: string, password: string, role: string) => Promise<boolean>
    logout: () => void
}

const AuthContext = createContext<AuthState>({} as AuthState)

const API = 'http://localhost:8001/api'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem('sentinell_token'))
    const [loading, setLoading] = useState(true)

    // On mount, if token exists, fetch user profile
    useEffect(() => {
        if (token) {
            fetchUser(token)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUser = async (t: string) => {
        try {
            const res = await fetch(`${API}/users/me/`, {
                headers: { Authorization: `Bearer ${t}` },
            })
            if (res.ok) {
                const data = await res.json()
                setUser(data)
                setToken(t)
            } else {
                // Token expired
                localStorage.removeItem('sentinell_token')
                setToken(null)
                setUser(null)
            }
        } catch {
            localStorage.removeItem('sentinell_token')
            setToken(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            if (!res.ok) return false
            const data = await res.json()
            localStorage.setItem('sentinell_token', data.access)
            localStorage.setItem('sentinell_refresh', data.refresh)
            setToken(data.access)
            await fetchUser(data.access)
            return true
        } catch {
            return false
        }
    }

    const register = async (username: string, email: string, password: string, role: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role }),
            })
            if (!res.ok) return false
            // Auto-login after register
            return await login(username, password)
        } catch {
            return false
        }
    }

    const logout = () => {
        localStorage.removeItem('sentinell_token')
        localStorage.removeItem('sentinell_refresh')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user && !!token,
            loading,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
