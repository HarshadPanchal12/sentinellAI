import { HealthSignal, OutbreakAlert } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function getToken(): string | null {
    return localStorage.getItem('sentinell_token')
}

function authHeaders(): Record<string, string> {
    const token = getToken()
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
}

function toCamel(o: any): any {
    if (o === null || o === undefined) return o
    if (Array.isArray(o)) return o.map(toCamel)
    if (typeof o === 'object') {
        const n: Record<string, any> = {}
        Object.keys(o).forEach(k => {
            const ck = k.replace(/_([a-z])/g, g => g[1].toUpperCase())
            n[ck] = toCamel(o[k])
        })
        return n
    }
    return o
}

async function request(path: string, opts: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: { ...authHeaders(), ...(opts.headers || {}) },
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
    }
    const data = await res.json()
    return toCamel(data)
}

export const api = {
    // Dashboard
    getStats: () => request('/dashboard/stats/'),

    // Signals
    getSignals: (sourceType?: string): Promise<HealthSignal[]> =>
        request(`/signals/${sourceType && sourceType !== 'all' ? `?source_type=${sourceType}` : ''}`),

    // Alerts
    getAlerts: (): Promise<OutbreakAlert[]> => request('/alerts/'),
    confirmAlert: (id: number) => request(`/alerts/${id}/confirm/`, { method: 'POST' }),
    dismissAlert: (id: number) => request(`/alerts/${id}/dismiss/`, { method: 'POST' }),

    // Search
    search: (query: string) => request(`/search/?q=${encodeURIComponent(query)}`),

    // Regional Risks
    getRegionalRisks: () => request('/regional-risks/'),

    // Pipeline
    getPipelineStatus: () => request('/pipeline/status/'),

    // Ingest new signal
    ingestSignal: (text: string, sourceType: string, location: string) =>
        request('/ingest/', {
            method: 'POST',
            body: JSON.stringify({ text, source_type: sourceType, location }),
        }),

    // Users
    getMe: () => request('/users/me/'),
}
