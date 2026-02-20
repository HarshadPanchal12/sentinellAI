import { useState, useEffect } from 'react'
import { AlertTriangle, MapPin, Radio, Target } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import RiskHeatmap from '@/components/dashboard/RiskHeatmap'
import AlertsList from '@/components/dashboard/AlertsList'
import PipelineStatus from '@/components/dashboard/PipelineStatus'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        activeAlerts: 0,
        regionsMonitored: 0,
        signalsToday: 0,
        aiAccuracy: 0,
    })

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await api.getStats()
                setStats(data)
            } catch (e) {
                console.error('Failed to load dashboard stats', e)
            }
        }
        loadStats()
        const interval = setInterval(loadStats, 15000)
        return () => clearInterval(interval)
    }, [])

    const roleGreeting: Record<string, string> = {
        admin: 'System Administrator',
        doctor: 'Medical Officer',
        official: 'Health Official',
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">War Room</h1>
                <p className="page-subtitle">
                    Welcome, {user?.username} — {roleGreeting[user?.role || ''] || 'Operator'} • Real-time disease surveillance
                </p>
            </div>

            <div className="stats-grid">
                <StatCard
                    icon={<AlertTriangle size={22} />}
                    label="Active Alerts"
                    value={stats.activeAlerts}
                    trend={{ value: 40, isUp: true }}
                    color="red"
                />
                <StatCard
                    icon={<MapPin size={22} />}
                    label="Regions Monitored"
                    value={stats.regionsMonitored}
                    color="cyan"
                />
                <StatCard
                    icon={<Radio size={22} />}
                    label="Signals Collected"
                    value={stats.signalsToday}
                    trend={{ value: 23, isUp: true }}
                    color="violet"
                />
                <StatCard
                    icon={<Target size={22} />}
                    label="AI Accuracy"
                    value={`${Number(stats.aiAccuracy || 0).toFixed(1)}%`}
                    trend={{ value: 1.2, isUp: false }}
                    color="green"
                />
            </div>

            <div className="grid-3" style={{ marginBottom: 20 }}>
                <RiskHeatmap />
                <AlertsList />
            </div>

            <PipelineStatus />
        </div>
    )
}
