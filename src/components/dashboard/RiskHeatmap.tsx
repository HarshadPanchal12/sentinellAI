import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { api } from '@/services/api'
import 'leaflet/dist/leaflet.css'
import './RiskHeatmap.css'

interface RegionalRisk {
    city: string
    state: string
    riskScore: number
    activeAlerts: number
    signalsToday: number
    primaryThreat: string
    latitude: number
    longitude: number
}

function getRiskColor(score: number): string {
    if (score >= 0.8) return '#ef4444'
    if (score >= 0.6) return '#f59e0b'
    if (score >= 0.4) return '#3b82f6'
    return '#22c55e'
}

export default function RiskHeatmap() {
    const [regions, setRegions] = useState<RegionalRisk[]>([])

    useEffect(() => {
        async function load() {
            try {
                const data = await api.getRegionalRisks()
                setRegions(data)
            } catch (e) {
                console.error('Failed to load regional risks', e)
            }
        }
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="card heatmap-card" style={{ gridColumn: 'span 2' }}>
            <div className="section-header">
                <h3 className="section-title">Regional Risk Heatmap — India</h3>
                <div className="heatmap-legend">
                    <span className="legend-item"><span className="dot" style={{ background: '#ef4444' }} /> Critical</span>
                    <span className="legend-item"><span className="dot" style={{ background: '#f59e0b' }} /> Warning</span>
                    <span className="legend-item"><span className="dot" style={{ background: '#3b82f6' }} /> Watch</span>
                    <span className="legend-item"><span className="dot" style={{ background: '#22c55e' }} /> Normal</span>
                </div>
            </div>

            <MapContainer
                center={[22.5, 78.9]}
                zoom={5}
                className="heatmap-container"
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {regions.map(r => (
                    <CircleMarker
                        key={r.city}
                        center={[r.latitude, r.longitude]}
                        radius={Math.max(r.riskScore * 20, 8)}
                        pathOptions={{
                            fillColor: getRiskColor(r.riskScore),
                            fillOpacity: 0.7,
                            color: getRiskColor(r.riskScore),
                            weight: 2,
                        }}
                    >
                        <Popup>
                            <div className="popup-content">
                                <h4>{r.city}, {r.state}</h4>
                                <p><strong>Risk:</strong> {(r.riskScore * 100).toFixed(0)}%</p>
                                <p><strong>Active Alerts:</strong> {r.activeAlerts}</p>
                                <p><strong>Signals:</strong> {r.signalsToday}</p>
                                <p><strong>Primary Threat:</strong> {r.primaryThreat}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    )
}
