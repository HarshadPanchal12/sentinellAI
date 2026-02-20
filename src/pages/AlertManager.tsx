import { useState } from 'react'
import {
    Bell, Tag, Server, Plus, X, CheckCircle, XCircle,
    AlertTriangle, Eye, Clock, Mail, MessageSquare, Phone, Webhook
} from 'lucide-react'
import {
    alertHistory, scraperKeywords, systemServices, notificationRules
} from '@/data/mockData'
import type { ScraperKeyword, AlertHistoryItem } from '@/types'
import './AlertManager.css'

const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail size={14} />,
    sms: <Phone size={14} />,
    whatsapp: <MessageSquare size={14} />,
    webhook: <Webhook size={14} />,
}

const statusIcons: Record<string, React.ReactNode> = {
    active: <AlertTriangle size={13} />,
    confirmed: <CheckCircle size={13} />,
    dismissed: <XCircle size={13} />,
    expired: <Clock size={13} />,
}

export default function AlertManager() {
    const [keywords, setKeywords] = useState<ScraperKeyword[]>(scraperKeywords)
    const [newKeyword, setNewKeyword] = useState('')
    const [newCategory, setNewCategory] = useState<ScraperKeyword['category']>('symptom')

    const addKeyword = () => {
        if (!newKeyword.trim()) return
        const kw: ScraperKeyword = {
            id: `kw-${Date.now()}`,
            keyword: newKeyword.trim(),
            category: newCategory,
            isActive: true,
        }
        setKeywords(prev => [...prev, kw])
        setNewKeyword('')
    }

    const removeKeyword = (id: string) => {
        setKeywords(prev => prev.filter(k => k.id !== id))
    }

    const toggleKeyword = (id: string) => {
        setKeywords(prev => prev.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k))
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Alert Manager</h1>
                <p className="page-subtitle">Configure scraper keywords, notification rules, and monitor system health</p>
            </div>

            <div className="grid-2">
                {/* Keyword Configuration */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <Tag size={18} />
                            Scraper Keywords
                        </h3>
                        <span className="badge badge-cyan">{keywords.filter(k => k.isActive).length} active</span>
                    </div>

                    <div className="keyword-input-row">
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add new keyword..."
                            className="keyword-input"
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as ScraperKeyword['category'])}
                            className="keyword-select"
                        >
                            <option value="symptom">Symptom</option>
                            <option value="disease">Disease</option>
                            <option value="location">Location</option>
                            <option value="environment">Environment</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={addKeyword}>
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    <div className="keywords-list">
                        {keywords.map(kw => (
                            <div key={kw.id} className={`keyword-tag ${kw.isActive ? '' : 'inactive'}`}>
                                <div
                                    className={`toggle ${kw.isActive ? 'active' : ''}`}
                                    onClick={() => toggleKeyword(kw.id)}
                                    style={{ transform: 'scale(0.7)' }}
                                >
                                    <div className="toggle-knob" />
                                </div>
                                <span className={`tag tag-${kw.category}`}>{kw.category}</span>
                                <span className="keyword-text">{kw.keyword}</span>
                                <button className="keyword-remove" onClick={() => removeKeyword(kw.id)}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notification Rules */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <Bell size={18} />
                            Notification Rules
                        </h3>
                    </div>

                    <div className="notification-rules">
                        {notificationRules.map(rule => (
                            <div key={rule.id} className={`notification-rule ${rule.isActive ? '' : 'inactive'}`}>
                                <div className="rule-header">
                                    <span className="rule-channel">
                                        {channelIcons[rule.channel]}
                                        {rule.channel.charAt(0).toUpperCase() + rule.channel.slice(1)}
                                    </span>
                                    <span className={`badge badge-${rule.threshold}`}>{rule.threshold}</span>
                                </div>
                                <span className="rule-name">{rule.name}</span>
                                <div className="rule-recipients">
                                    {rule.recipients.map((r, i) => (
                                        <span key={i} className="recipient-chip">{r}</span>
                                    ))}
                                </div>
                                <div className={`rule-status ${rule.isActive ? 'active' : ''}`}>
                                    {rule.isActive ? '✓ Active' : '○ Inactive'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alert History Table */}
            <div className="card" style={{ marginTop: 20 }}>
                <div className="section-header">
                    <h3 className="section-title">
                        <Clock size={18} />
                        Alert History
                    </h3>
                    <span className="badge badge-violet">{alertHistory.length} records</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Disease</th>
                                <th>Location</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Anomaly Score</th>
                                <th>Created</th>
                                <th>Resolved</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertHistory.map(alert => (
                                <tr key={alert.id}>
                                    <td style={{ fontWeight: 600 }}>{alert.disease}</td>
                                    <td>{alert.location}</td>
                                    <td><span className={`badge badge-${alert.severity}`}>{alert.severity}</span></td>
                                    <td>
                                        <span className={`alert-hist-status status-${alert.status}`}>
                                            {statusIcons[alert.status]}
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="score-cell" style={{
                                            color: alert.anomalyScore >= 0.8 ? 'var(--status-critical)' :
                                                alert.anomalyScore >= 0.6 ? 'var(--status-warning)' : 'var(--status-watch)'
                                        }}>
                                            {(alert.anomalyScore * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="date-cell">
                                        {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="date-cell">
                                        {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        }) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Health */}
            <div className="card" style={{ marginTop: 20 }}>
                <div className="section-header">
                    <h3 className="section-title">
                        <Server size={18} />
                        System Health
                    </h3>
                </div>

                <div className="system-health-grid">
                    {systemServices.map(service => (
                        <div key={service.name} className={`health-card health-${service.status}`}>
                            <div className="health-header">
                                <span className={`health-dot ${service.status}`} />
                                <span className="health-name">{service.name}</span>
                                <span className={`health-status-label ${service.status}`}>
                                    {service.status}
                                </span>
                            </div>
                            <div className="health-stats">
                                <div className="health-stat">
                                    <span className="health-stat-label">Uptime</span>
                                    <span className="health-stat-value">{service.uptime}%</span>
                                </div>
                                <div className="health-stat">
                                    <span className="health-stat-label">Response</span>
                                    <span className="health-stat-value">{service.responseTime}ms</span>
                                </div>
                            </div>
                            <div className="health-bar-track">
                                <div
                                    className={`health-bar-fill ${service.status}`}
                                    style={{ width: `${service.uptime}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
