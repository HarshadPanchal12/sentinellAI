import { useState, useEffect } from 'react'
import { Radio, Twitter, Newspaper, Pill, Globe, TrendingUp, MapPin, Clock } from 'lucide-react'
import { api } from '@/services/api'
import type { HealthSignal } from '@/types'
import './SignalFeed.css'

const sourceIcons: Record<string, React.ReactNode> = {
    twitter: <Twitter size={16} />,
    news: <Newspaper size={16} />,
    pharmacy: <Pill size={16} />,
    reddit: <Globe size={16} />,
    google_trends: <TrendingUp size={16} />,
}

const sourceLabels: Record<string, string> = {
    twitter: 'Twitter/X',
    news: 'News',
    pharmacy: 'Pharmacy',
    reddit: 'Reddit',
    google_trends: 'Google Trends',
}

export default function SignalFeed() {
    const [filter, setFilter] = useState<string>('all')
    const [signals, setSignals] = useState<HealthSignal[]>([])
    const [newSignalFlash, setNewSignalFlash] = useState(false)
    const [loading, setLoading] = useState(true)

    // Fetch signals from backend
    useEffect(() => {
        async function loadSignals() {
            try {
                const data = await api.getSignals();
                setSignals(data);
            } catch (e) {
                console.error("Failed to load signals", e);
            } finally {
                setLoading(false);
            }
        }
        loadSignals();

        // Poll for new signals every 10s
        const interval = setInterval(async () => {
            const data = await api.getSignals();
            setSignals(prev => {
                if (data.length > prev.length) setNewSignalFlash(true);
                return data; // In real app, merge/dedupe
            });
            setTimeout(() => setNewSignalFlash(false), 2000)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const filtered = filter === 'all' ? signals : signals.filter(s => s.sourceType === filter)

    const getConfidenceColor = (score: number) => {
        if (score >= 0.85) return 'var(--status-critical)'
        if (score >= 0.7) return 'var(--status-warning)'
        return 'var(--status-watch)'
    }

    const getSentimentEmoji = (s: string) => {
        if (s === 'negative') return '🔴'
        if (s === 'positive') return '🟢'
        return '🟡'
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Signal Feed</h1>
                <p className="page-subtitle">Real-time ingestion of health signals from public sources</p>
            </div>

            {/* Live indicator */}
            <div className={`signal-live-bar ${newSignalFlash ? 'flash' : ''}`}>
                <span className="live-dot" />
                <span>Live — Ingesting signals from {Object.keys(sourceLabels).length} sources</span>
                <span className="signal-count">{signals.length} signals collected</span>
            </div>

            {/* Filter Bar */}
            <div className="signal-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Sources
                </button>
                {Object.entries(sourceLabels).map(([key, label]) => (
                    <button
                        key={key}
                        className={`filter-btn ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                    >
                        {sourceIcons[key]}
                        {label}
                    </button>
                ))}
            </div>

            {/* Signal Cards */}
            <div className="signal-grid">
                {filtered.map((signal, idx) => (
                    <div
                        key={signal.id}
                        className="signal-card card"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                        <div className="signal-card-header">
                            <span className={`source-badge source-${signal.sourceType}`}>
                                {sourceIcons[signal.sourceType]}
                                {sourceLabels[signal.sourceType]}
                            </span>
                            <span className="signal-sentiment">
                                {getSentimentEmoji(signal.sentiment)} {signal.sentiment}
                            </span>
                        </div>

                        <p className="signal-text">{signal.sourceText}</p>

                        <div className="signal-symptoms">
                            {signal.symptoms.map(s => (
                                <span key={s} className="tag tag-symptom">{s}</span>
                            ))}
                        </div>

                        <div className="signal-meta">
                            <span className="signal-location">
                                <MapPin size={12} /> {signal.location}
                            </span>
                            <span className="signal-time">
                                <Clock size={12} />
                                {new Date(signal.timestamp).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>

                        <div className="signal-confidence">
                            <span className="confidence-label">LLM Confidence</span>
                            <div className="confidence-bar-track">
                                <div
                                    className="confidence-bar-fill"
                                    style={{
                                        width: `${signal.llmConfidence * 100}%`,
                                        background: getConfidenceColor(signal.llmConfidence),
                                    }}
                                />
                            </div>
                            <span
                                className="confidence-value"
                                style={{ color: getConfidenceColor(signal.llmConfidence) }}
                            >
                                {(signal.llmConfidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
