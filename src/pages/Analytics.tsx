import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts'
import { BarChart3, TrendingUp, Activity, ThermometerSun } from 'lucide-react'
import { trendData, regionalRisks } from '@/data/mockData'
import './Analytics.css'

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="tooltip-row">
                        {p.name}: <strong>{p.value}</strong>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Correlation data
const correlationData = [
    { symptom: 'Fever', humidity: 0.85, temperature: 0.72, rainfall: 0.91 },
    { symptom: 'Cough', humidity: 0.45, temperature: 0.38, rainfall: 0.22 },
    { symptom: 'Headache', humidity: 0.32, temperature: 0.55, rainfall: 0.28 },
    { symptom: 'Body Pain', humidity: 0.68, temperature: 0.45, rainfall: 0.61 },
    { symptom: 'Diarrhea', humidity: 0.78, temperature: 0.65, rainfall: 0.88 },
]

function getCellColor(value: number): string {
    if (value >= 0.8) return 'rgba(239, 68, 68, 0.7)'
    if (value >= 0.6) return 'rgba(245, 158, 11, 0.6)'
    if (value >= 0.4) return 'rgba(59, 130, 246, 0.5)'
    return 'rgba(100, 116, 139, 0.3)'
}

export default function Analytics() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Deep Analytics</h1>
                <p className="page-subtitle">Trend analysis • Anomaly detection • Environment correlation</p>
            </div>

            {/* Symptom Trend Chart */}
            <div className="card analytics-chart-card">
                <div className="section-header">
                    <h3 className="section-title">
                        <TrendingUp size={18} />
                        Symptom Trends (30 Days)
                    </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="fever" stroke="#ef4444" strokeWidth={2} dot={false} name="Fever" />
                        <Line type="monotone" dataKey="cough" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cough" />
                        <Line type="monotone" dataKey="headache" stroke="#3b82f6" strokeWidth={2} dot={false} name="Headache" />
                        <Line type="monotone" dataKey="bodyPain" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Body Pain" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid-2" style={{ marginTop: 20 }}>
                {/* Anomaly Score Chart */}
                <div className="card analytics-chart-card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <Activity size={18} />
                            Anomaly Score Trend
                        </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 1]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="anomalyScore"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                fill="url(#anomalyGrad)"
                                name="Anomaly Score"
                            />
                            {/* Threshold line */}
                            <Line
                                type="monotone"
                                dataKey={() => 0.7}
                                stroke="#ef4444"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Threshold"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Environment Overlay */}
                <div className="card analytics-chart-card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <ThermometerSun size={18} />
                            Environmental Factors
                        </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
                            <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} name="Humidity (%)" />
                            <Line type="monotone" dataKey="rainfall" stroke="#06b6d4" strokeWidth={2} dot={false} name="Rainfall (mm)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 20 }}>
                {/* Correlation Matrix */}
                <div className="card analytics-chart-card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <BarChart3 size={18} />
                            Symptom–Environment Correlation
                        </h3>
                    </div>
                    <div className="correlation-matrix">
                        <div className="matrix-header">
                            <div className="matrix-cell matrix-label" />
                            <div className="matrix-cell matrix-col-label">Humidity</div>
                            <div className="matrix-cell matrix-col-label">Temperature</div>
                            <div className="matrix-cell matrix-col-label">Rainfall</div>
                        </div>
                        {correlationData.map(row => (
                            <div key={row.symptom} className="matrix-row">
                                <div className="matrix-cell matrix-row-label">{row.symptom}</div>
                                <div className="matrix-cell" style={{ background: getCellColor(row.humidity) }}>
                                    {row.humidity.toFixed(2)}
                                </div>
                                <div className="matrix-cell" style={{ background: getCellColor(row.temperature) }}>
                                    {row.temperature.toFixed(2)}
                                </div>
                                <div className="matrix-cell" style={{ background: getCellColor(row.rainfall) }}>
                                    {row.rainfall.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regional Comparison */}
                <div className="card analytics-chart-card">
                    <div className="section-header">
                        <h3 className="section-title">
                            <BarChart3 size={18} />
                            Regional Risk Comparison
                        </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={regionalRisks} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis type="number" domain={[0, 1]} stroke="var(--text-muted)" fontSize={11} />
                            <YAxis type="category" dataKey="city" stroke="var(--text-muted)" fontSize={11} width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="riskScore"
                                name="Risk Score"
                                radius={[0, 4, 4, 0]}
                                fill="#06b6d4"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
