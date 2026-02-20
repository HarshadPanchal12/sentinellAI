import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Radio, BarChart3, Bell, Shield, Activity } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import './Sidebar.css'

const allNavItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['admin', 'doctor', 'official', 'public'] },
    { path: '/signals', icon: <Radio size={18} />, label: 'Signal Feed', roles: ['admin', 'doctor', 'official'] },
    { path: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics', roles: ['admin', 'doctor', 'official'] },
    { path: '/alerts', icon: <Bell size={18} />, label: 'Alert Manager', roles: ['admin'] },
]

export default function Sidebar() {
    const { user } = useAuth()
    const [pipelineStatus, setPipelineStatus] = useState<any>(null)

    const navItems = allNavItems.filter(item =>
        item.roles.includes(user?.role || 'public')
    )

    useEffect(() => {
        async function load() {
            try {
                const data = await api.getPipelineStatus()
                setPipelineStatus(data)
            } catch (e) { /* silent */ }
        }
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-mark">
                    <Shield size={22} />
                </div>
                <div className="logo-text">
                    <h2>SentinellAI</h2>
                    <span className="logo-tagline">Disease Intel</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                {user?.role !== 'public' && (
                    <div className="pipeline-mini">
                        <h4><Activity size={14} /> AI Pipeline</h4>
                        {pipelineStatus?.stages?.map((s: any) => (
                            <div key={s.name} className="mini-stage">
                                <span className={`mini-dot ${s.status}`} />
                                <span className="mini-name">{s.name}</span>
                                <span className="mini-count">{s.processedCount}</span>
                            </div>
                        )) || (
                                <div className="mini-stage">
                                    <span className="mini-dot idle" />
                                    <span className="mini-name">Loading...</span>
                                </div>
                            )}
                    </div>
                )}

                <div className="system-health-mini">
                    <span className="health-indicator online" />
                    <span>System Online</span>
                </div>
            </div>
        </aside>
    )
}
