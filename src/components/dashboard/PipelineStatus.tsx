import { useState, useEffect } from 'react'
import { Brain, Search, Target, Zap, ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import './PipelineStatus.css'

const stageIcons: Record<string, React.ReactNode> = {
    brain: <Brain size={20} />,
    search: <Search size={20} />,
    target: <Target size={20} />,
}

export default function PipelineStatus() {
    const [pipeline, setPipeline] = useState<any>(null)

    useEffect(() => {
        async function load() {
            try {
                const data = await api.getPipelineStatus()
                setPipeline(data)
            } catch (e) {
                console.error('Failed to load pipeline', e)
            }
        }
        load()
        const interval = setInterval(load, 20000)
        return () => clearInterval(interval)
    }, [])

    if (!pipeline) {
        return <div className="card pipeline-card">Loading AI Pipeline...</div>
    }

    return (
        <div className="card pipeline-card">
            <div className="section-header">
                <h3 className="section-title">
                    <Zap size={18} className="text-cyan" />
                    AI Pipeline Status
                </h3>
                <span className="badge badge-green">Live</span>
            </div>

            <div className="pipeline-flow">
                {pipeline.stages?.map((stage: any, idx: number) => (
                    <div key={stage.name} className="pipeline-stage-wrapper">
                        <div className={`pipeline-stage status-${stage.status}`}>
                            <div className="stage-icon">
                                {stageIcons[stage.icon] || <Brain size={20} />}
                                {stage.status === 'running' && <div className="stage-ring" />}
                            </div>
                            <div className="stage-info">
                                <h4 className="stage-name">{stage.name}</h4>
                                <p className="stage-desc">{stage.description}</p>
                                <div className="stage-stats">
                                    <span className="stat">
                                        <strong>{stage.processedCount}</strong> processed
                                    </span>
                                    <span className={`status-badge status-${stage.status}`}>
                                        {stage.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {idx < (pipeline.stages?.length || 0) - 1 && (
                            <div className="pipeline-arrow">
                                <ArrowRight size={16} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pipeline-summary">
                <div className="summary-stat">
                    <span className="summary-value">{pipeline.summary?.totalProcessed || 0}</span>
                    <span className="summary-label">Signals Processed</span>
                </div>
                <div className="summary-stat">
                    <span className="summary-value">{pipeline.summary?.anomaliesDetected || 0}</span>
                    <span className="summary-label">Anomalies Found</span>
                </div>
                <div className="summary-stat">
                    <span className="summary-value">{pipeline.summary?.alertsGenerated || 0}</span>
                    <span className="summary-label">Alerts Generated</span>
                </div>
                <div className="summary-stat">
                    <span className="summary-value">{pipeline.summary?.accuracy || 0}%</span>
                    <span className="summary-label">Accuracy</span>
                </div>
            </div>
        </div>
    )
}
