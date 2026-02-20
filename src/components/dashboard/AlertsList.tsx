import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, CloudRain, Thermometer, MapPin, Shield } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import type { OutbreakAlert } from '@/types'
import './AlertsList.css'

export default function AlertsList() {
    const { user } = useAuth()
    const [alerts, setAlerts] = useState<OutbreakAlert[]>([])
    const [loading, setLoading] = useState(true)

    const canVerify = user?.role === 'doctor' || user?.role === 'admin'

    const loadAlerts = async () => {
        try {
            const data = await api.getAlerts()
            setAlerts(data)
        } catch (e) {
            console.error("Failed to load alerts", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAlerts()
        const interval = setInterval(loadAlerts, 15000)
        return () => clearInterval(interval)
    }, [])

    const handleAction = async (id: number, action: 'confirm' | 'dismiss') => {
        try {
            setAlerts(prev => prev.map(a =>
                a.id === id ? { ...a, isConfirmed: action === 'confirm' } : a
            ))

            if (action === 'confirm') await api.confirmAlert(id)
            else await api.dismissAlert(id)

            loadAlerts()
        } catch (e: any) {
            console.error(`Failed to ${action} alert`, e)
            loadAlerts() // Revert optimistic update
        }
    }

    if (loading && alerts.length === 0) {
        return <div className="card alerts-card">Loading alerts...</div>
    }

    return (
        <div className="card alerts-card">
            <div className="section-header">
                <h3 className="section-title">
                    <AlertTriangle size={18} className="text-red" />
                    Active Outbreak Alerts
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {canVerify && (
                        <span className="badge badge-cyan" title="You can verify alerts">
                            <Shield size={10} /> HITL
                        </span>
                    )}
                    <span className="badge badge-red">{alerts.length} Active</span>
                </div>
            </div>

            <div className="alerts-scroll">
                {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                        <div className="alert-main">
                            <div className="alert-header">
                                <span className={`badge badge-${alert.severity}`}>
                                    {alert.severity}
                                </span>
                                <h4 className="alert-title">{alert.predictedDisease} in {alert.location}</h4>
                                <span className="alert-score">
                                    {(alert.anomalyScore * 100).toFixed(0)}%
                                </span>
                            </div>

                            <p className="alert-desc">{alert.description}</p>

                            <div className="alert-meta">
                                <span className="meta-item">
                                    <MapPin size={12} /> {alert.region}
                                </span>
                                {alert.weatherContext && (
                                    <>
                                        <span className="meta-item" title="Temp">
                                            <Thermometer size={12} /> {alert.weatherContext.temperature}°C
                                        </span>
                                        <span className="meta-item" title="Rain">
                                            <CloudRain size={12} /> {alert.weatherContext.rainfall}mm
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* HITL Actions — Role Based */}
                        <div className="alert-actions">
                            {alert.isConfirmed === true ? (
                                <div className="action-done confirmed">
                                    <CheckCircle size={16} />
                                    <span>Confirmed</span>
                                </div>
                            ) : alert.isConfirmed === false ? (
                                <div className="action-done dismissed">
                                    <XCircle size={16} />
                                    <span>Dismissed</span>
                                    <small>(noise → model retrained)</small>
                                </div>
                            ) : canVerify ? (
                                <>
                                    <button
                                        className="btn-action confirm"
                                        onClick={() => handleAction(alert.id as number, 'confirm')}
                                        title="Confirm: This is a real outbreak — model confidence increases"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        className="btn-action dismiss"
                                        onClick={() => handleAction(alert.id as number, 'dismiss')}
                                        title="Dismiss: False positive — noise keywords learned, model retrained"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </>
                            ) : (
                                <div className="action-done pending">
                                    <span>Awaiting verification</span>
                                    <small>(Doctors/Admins only)</small>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
