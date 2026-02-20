import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import './StatCard.css'

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    trend?: { value: number; isUp: boolean };
    color: 'cyan' | 'violet' | 'red' | 'green' | 'amber';
}

export default function StatCard({ icon, label, value, trend, color }: StatCardProps) {
    return (
        <div className={`stat-card stat-card-${color}`}>
            <div className="stat-icon-wrap">
                {icon}
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value}</span>
                {trend && (
                    <span className={`stat-trend ${trend.isUp ? 'up' : 'down'}`}>
                        {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend.value}%
                    </span>
                )}
            </div>
        </div>
    )
}
