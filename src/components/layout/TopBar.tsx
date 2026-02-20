import { useState } from 'react'
import { Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import './TopBar.css'

export default function TopBar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any>(null)
    const [searching, setSearching] = useState(false)

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    })
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    const handleSearch = async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return }
        setSearching(true)
        try {
            const data = await api.search(searchQuery.trim())
            setSearchResults(data)
        } catch (e) {
            console.error('Search failed', e)
        } finally {
            setSearching(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const roleLabel: Record<string, string> = {
        admin: '⚙️ Admin',
        doctor: '🩺 Doctor',
        official: '🏛️ Official',
    }

    return (
        <header className="topbar">
            <div className="topbar-search">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search signals, alerts, regions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery && (
                    <button className="search-go" onClick={handleSearch}>
                        {searching ? '...' : 'Go'}
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults && (
                <div className="search-dropdown">
                    <div className="search-dropdown-header">
                        <span>Results for "{searchQuery}"</span>
                        <button onClick={() => setSearchResults(null)}>✕</button>
                    </div>
                    {searchResults.signals?.length > 0 && (
                        <div className="search-section">
                            <h4>Signals ({searchResults.signals.length})</h4>
                            {searchResults.signals.slice(0, 5).map((s: any) => (
                                <div key={s.id} className="search-item" onClick={() => { navigate('/signals'); setSearchResults(null) }}>
                                    <span className="search-item-type">{s.sourceType}</span>
                                    <span className="search-item-text">{s.sourceText?.substring(0, 80)}...</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchResults.alerts?.length > 0 && (
                        <div className="search-section">
                            <h4>Alerts ({searchResults.alerts.length})</h4>
                            {searchResults.alerts.slice(0, 5).map((a: any) => (
                                <div key={a.id} className="search-item" onClick={() => { navigate('/'); setSearchResults(null) }}>
                                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                                    <span className="search-item-text">{a.predictedDisease} in {a.location}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {(!searchResults.signals?.length && !searchResults.alerts?.length) && (
                        <p className="search-empty">No results found</p>
                    )}
                </div>
            )}

            <div className="topbar-right">
                <div className="topbar-datetime">
                    <span className="topbar-date">{dateStr}</span>
                    <span className="topbar-time">{timeStr}</span>
                </div>

                <button className="topbar-icon-btn" title="Notifications">
                    <Bell size={18} />
                    <span className="notification-dot" />
                </button>

                <div className="topbar-user">
                    <div className="user-info">
                        <span className="user-name">{user?.username || 'User'}</span>
                        <span className="user-role">{roleLabel[user?.role || ''] || user?.role}</span>
                    </div>
                    <button className="topbar-icon-btn logout-btn" title="Logout" onClick={handleLogout}>
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    )
}
