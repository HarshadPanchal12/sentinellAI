import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Shield, LogIn, UserPlus, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import './LoginPage.css'

export default function LoginPage() {
    const { login, register } = useAuth()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('official')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPw, setShowPw] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        let success: boolean
        if (mode === 'login') {
            success = await login(username, password)
        } else {
            if (!email) { setError('Email is required'); setLoading(false); return }
            success = await register(username, email, password, role)
        }

        if (!success) {
            setError(mode === 'login' ? 'Invalid credentials. Try admin / admin123' : 'Registration failed. Username may already exist.')
        }
        setLoading(false)
    }

    return (
        <div className="login-page">
            <div className="login-bg-grid" />

            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-icon">
                        <Shield size={32} />
                    </div>
                    <h1>SentinellAI</h1>
                    <p className="login-subtitle">Pre-emptive Disease Warning System</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={`tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); setError('') }}
                    >
                        <LogIn size={14} /> Sign In
                    </button>
                    <button
                        className={`tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); setError('') }}
                    >
                        <UserPlus size={14} /> Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            autoFocus
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@organization.in"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-field">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Role</label>
                            <div className="role-selector">
                                {[
                                    { value: 'doctor', label: '🩺 Doctor', desc: 'Clinical verification' },
                                    { value: 'official', label: '🏛️ Health Official', desc: 'Policy & alerts' },
                                    { value: 'admin', label: '⚙️ Admin', desc: 'System management' },
                                ].map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        className={`role-btn ${role === r.value ? 'active' : ''}`}
                                        onClick={() => setRole(r.value)}
                                    >
                                        <span className="role-label">{r.label}</span>
                                        <span className="role-desc">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="login-error">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="login-demo-hint">
                    <p>Demo accounts:</p>
                    <div className="demo-accounts">
                        <code>admin / admin123</code>
                        <code>dr_sharma / doc123</code>
                        <code>moh_official / off123</code>
                    </div>
                </div>
            </div>
        </div>
    )
}
