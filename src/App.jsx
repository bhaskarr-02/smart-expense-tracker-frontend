import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import Reports         from './pages/Reports'
import Family          from './pages/Family'
import Goals           from './pages/Goals'
import Budget          from './pages/Budget'
import Recurring       from './pages/Recurring'
import VoiceEntry      from './pages/VoiceEntry'
import LocationTracker from './pages/LocationTracker'
import BillSplitter    from './pages/BillSplitter'
import HealthFinance   from './pages/HealthFinance'
import Profile         from './pages/Profile'
import Navbar          from './components/Navbar'
import Footer          from './components/Footer'

function PrivateRoute({ children }) {
  const userId = localStorage.getItem('userId')
  if (!userId) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  const userId = localStorage.getItem('userId')
  return (
    <Router>
      <Routes>
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/family"    element={<PrivateRoute><Family /></PrivateRoute>} />
        <Route path="/goals"     element={<PrivateRoute><Goals /></PrivateRoute>} />
        <Route path="/budget"    element={<PrivateRoute><Budget /></PrivateRoute>} />
        <Route path="/recurring" element={<PrivateRoute><Recurring /></PrivateRoute>} />
        <Route path="/voice"     element={<PrivateRoute><VoiceEntry /></PrivateRoute>} />
        <Route path="/location"  element={<PrivateRoute><LocationTracker /></PrivateRoute>} />
        <Route path="/split"     element={<PrivateRoute><BillSplitter /></PrivateRoute>} />
        <Route path="/health"    element={<PrivateRoute><HealthFinance /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to={userId ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  )
}
export default App
