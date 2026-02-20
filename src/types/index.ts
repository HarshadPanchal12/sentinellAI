export interface HealthSignal {
    id: string | number;
    sourceText: string;
    sourceUrl: string;
    sourceType: 'twitter' | 'news' | 'pharmacy' | 'reddit' | 'google_trends';
    location: string;
    region: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    llmConfidence: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    symptoms: string[];
    processed: boolean;
}

export interface SymptomCluster {
    id: string;
    signalId: string;
    symptomType: string;
    count: number;
    sentimentScore: number;
    processedAt: string;
}

export interface OutbreakAlert {
    id: string | number;
    anomalyScore: number;
    predictedDisease: string;
    severity: 'critical' | 'warning' | 'watch';
    location: string;
    region: string;
    latitude: number;
    longitude: number;
    weatherContext: WeatherContext;
    isConfirmed: boolean | null;
    confirmedBy: string | null;
    createdAt: string;
    description: string;
}

export interface WeatherContext {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    condition: string;
}

export interface PipelineStage {
    name: string;
    status: 'running' | 'completed' | 'idle' | 'error';
    lastRun: string;
    processedCount: number;
    icon: string;
}

export interface TrendDataPoint {
    date: string;
    fever: number;
    cough: number;
    headache: number;
    bodyPain: number;
    temperature: number;
    humidity: number;
    rainfall: number;
    anomalyScore: number;
}

export interface RegionalRisk {
    city: string;
    state: string;
    riskScore: number;
    activeAlerts: number;
    signalsToday: number;
    primaryThreat: string;
    latitude: number;
    longitude: number;
}

export interface AlertHistoryItem {
    id: string;
    disease: string;
    location: string;
    severity: 'critical' | 'warning' | 'watch';
    status: 'active' | 'confirmed' | 'dismissed' | 'expired';
    createdAt: string;
    resolvedAt: string | null;
    anomalyScore: number;
}

export interface ScraperKeyword {
    id: string;
    keyword: string;
    category: 'symptom' | 'disease' | 'location' | 'environment';
    isActive: boolean;
}

export interface SystemService {
    name: string;
    status: 'online' | 'degraded' | 'offline';
    uptime: number;
    lastCheck: string;
    responseTime: number;
}

export interface NotificationRule {
    id: string;
    name: string;
    channel: 'email' | 'sms' | 'whatsapp' | 'webhook';
    threshold: 'critical' | 'warning' | 'watch';
    isActive: boolean;
    recipients: string[];
}
