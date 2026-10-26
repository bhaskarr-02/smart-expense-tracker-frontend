import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#0F1F3D"/>
        </svg>
      </div>
      <div className="footer-inner">
        <div className="footer-brand-col">
          <div className="footer-brand">
            <span className="footer-logo">💰</span>
            <div>
              <p className="footer-app-name">SMART EXPENSE TRACKER</p>
              <p className="footer-tagline">Track every rupee. Reach every goal.</p>
            </div>
          </div>
          <div className="footer-app-illustration">
            <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=320&h=180&fit=crop&auto=format"
              alt="Finance" className="footer-illus-img" />
            <div className="footer-illus-overlay"><span>📊 Track · Save · Grow</span></div>
          </div>
        </div>
        <div className="footer-section">
          <p className="footer-heading">Quick Links</p>
          <div className="footer-links">
            <Link to="/dashboard" className="footer-link">🏠 Dashboard</Link>
            <Link to="/reports"   className="footer-link">📊 Reports</Link>
            <Link to="/family"    className="footer-link">👨‍👩‍👧 Family Wallet</Link>
            <Link to="/goals"     className="footer-link">🎯 Savings Goals</Link>
            <Link to="/budget"    className="footer-link">🔔 Budget Alerts</Link>
            <Link to="/recurring" className="footer-link">📅 Recurring</Link>
          </div>
        </div>
        <div className="footer-section">
          <p className="footer-heading">Features</p>
          <div className="footer-links">
            <span className="footer-feat">🗣️ Voice Entry</span>
            <span className="footer-feat">📍 Location Tags</span>
            <span className="footer-feat">🧾 Bill Splitter</span>
            <span className="footer-feat">💊 Health Finance</span>
            <span className="footer-feat">🌍 Multi-Currency</span>
            <span className="footer-feat">🏆 Badges & Rewards</span>
          </div>
        </div>
      </div>
      <div className="footer-img-strip">
        <div className="footer-img-strip-inner">
          {[
            { img:'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=120&fit=crop&auto=format', label:'💰 Budgeting' },
            { img:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=120&fit=crop&auto=format', label:'📈 Investments' },
            { img:'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=200&h=120&fit=crop&auto=format', label:'🎯 Savings Goals' },
            { img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=120&fit=crop&auto=format', label:'🏆 Achievements' },
            { img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=120&fit=crop&auto=format', label:'📊 Analytics' },
          ].map(({ img, label }) => (
            <div className="footer-img-card" key={label}>
              <img src={img} alt={label} className="footer-img-card-img" />
              <div className="footer-img-card-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {year} Smart Expense Tracker. All rights reserved.</p>
      </div>
    </footer>
  )
}
