import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const username = localStorage.getItem('username') || 'User'
  const { dark, toggleTheme } = useTheme()
  const a = (p) => location.pathname === p ? 'nav-active' : ''

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo-box">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="10" fill="url(#lg1)"/>
            <path d="M16 7 L16 25 M10 12 L16 7 L22 12 M10 20 L16 25 L22 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8"/>
                <stop offset="100%" stopColor="#6366F1"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="navbar-title-block">
          <span className="navbar-title-main">SMART EXPENSE</span>
          <span className="navbar-title-sub">TRACKER</span>
        </div>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={`nav-link ${a('/dashboard')}`}>🏠 Home</Link>
        <Link to="/reports"   className={`nav-link ${a('/reports')}`}>📊 Reports</Link>
        <Link to="/family"    className={`nav-link ${a('/family')}`}>👨‍👩‍👧 Family</Link>
        <Link to="/goals"     className={`nav-link ${a('/goals')}`}>🎯 Goals</Link>
        <Link to="/budget"    className={`nav-link ${a('/budget')}`}>🔔 Budget</Link>
        <Link to="/recurring" className={`nav-link ${a('/recurring')}`}>📅 Recurring</Link>

        <div className="nav-more-wrap">
          <button className={`nav-link nav-more-btn ${['/voice','/location','/split','/health'].includes(location.pathname)?'nav-active':''}`}>
            ✨ More ▾
          </button>
          <div className="nav-dropdown">
            <Link to="/voice"    className={`nav-drop-item ${a('/voice')}`}>🗣️ Voice Entry</Link>
            <Link to="/location" className={`nav-drop-item ${a('/location')}`}>📍 Location Tags</Link>
            <Link to="/split"    className={`nav-drop-item ${a('/split')}`}>🧾 Bill Splitter</Link>
            <Link to="/health"   className={`nav-drop-item ${a('/health')}`}>💊 Health Finance</Link>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Dark Mode">
          {dark ? '☀️' : '🌙'}
        </button>
        {/* Clickable profile avatar */}
        <Link to="/profile" className="nav-profile-wrap" title="My Profile">
          <div className="nav-avatar">{username.charAt(0).toUpperCase()}</div>
          <span className="nav-username">{username}</span>
        </Link>
        <button className="nav-logout" onClick={() => { localStorage.clear(); navigate('/login') }}>🚪 Logout</button>
      </div>
    </nav>
  )
}
