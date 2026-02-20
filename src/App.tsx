import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import SignalFeed from './pages/SignalFeed'
import Analytics from './pages/Analytics'
import AlertManager from './pages/AlertManager'
import LoginPage from './pages/LoginPage'

function ProtectedLayout() {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg-primary)', color: 'var(--accent-cyan)',
                fontSize: '1.1rem', fontWeight: 600,
            }}>
                Loading SentinellAI...
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <TopBar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/signals" element={<SignalFeed />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/alerts" element={<AlertManager />} />
                </Routes>
            </main>
        </div>
    )
}

function AppRoutes() {
    const { isAuthenticated } = useAuth()

    return (
        <Routes>
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />
            <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
    )
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    )
}

export default App
