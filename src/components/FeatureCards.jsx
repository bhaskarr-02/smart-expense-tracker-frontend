import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { route:'/reports',  img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format', icon:'📊', title:'Reports & Analytics',   desc:'Bar, Pie, Line, Area charts — full visual breakdown.',          color:'#1E4D8C' },
  { route:'/family',   img:'https://images.unsplash.com/photo-1511895426328-dc8714191011?w=400&h=200&fit=crop&auto=format', icon:'👨‍👩‍👧', title:'Family Wallet',     desc:'Father, Mother, Children — separate + overall tracking.',       color:'#276749' },
  { route:'/goals',    img:'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop&auto=format', icon:'🎯', title:'Savings Goals',         desc:'Set targets, track progress, monthly saving calculator.',       color:'#553C9A' },
  { route:'/budget',   img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop&auto=format', icon:'🔔', title:'Budget Alerts',          desc:'Set monthly limits. Red warning before you overspend.',         color:'#C05621' },
  { route:'/recurring',img:'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=400&h=200&fit=crop&auto=format', icon:'📅', title:'Recurring Transactions',desc:'Auto-log salary, rent, EMI, subscriptions — one click.',        color:'#2C7A7B' },
  { route:'/voice',    img:'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=200&fit=crop&auto=format', icon:'🗣️', title:'Voice Command Entry', desc:'Speak your expense — logs it automatically. Zero typing!',      color:'#1A365D' },
  { route:'/location', img:'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=200&fit=crop&auto=format', icon:'📍', title:'Location-Based Tags',    desc:'GPS detects where you are and auto-suggests category.',         color:'#22543D' },
  { route:'/split',    img:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop&auto=format', icon:'🧾', title:'Bill Splitter',        desc:'Split bills with friends. Track who owes you, mark paid.',      color:'#744210' },
  { route:'/health',   img:'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=200&fit=crop&auto=format', icon:'💊', title:'Health-Finance Tracker',desc:'Classifies spending as healthy or unhealthy. Score tracker.',   color:'#276749' },
]

export default function FeatureCards() {
  const navigate = useNavigate()
  return (
    <div className="feat-section">
      <div className="feat-section-header">
        <h2 className="feat-section-title">✨ All Features</h2>
        <p className="feat-section-sub">9 powerful features to manage your finances smartly!</p>
      </div>
      <div className="feat-grid">
        {FEATURES.map(f => (
          <div className="feat-card" key={f.title} onClick={() => navigate(f.route)}>
            <div className="feat-img-wrap">
              <img src={f.img} alt={f.title} className="feat-img" />
              <div className="feat-img-overlay" style={{ background:`${f.color}99` }}>
                <span className="feat-big-icon">{f.icon}</span>
              </div>
            </div>
            <div className="feat-body">
              <p className="feat-title" style={{ color:f.color }}>{f.icon} {f.title}</p>
              <p className="feat-desc">{f.desc}</p>
              <button className="feat-btn" style={{ background:f.color }}>Explore →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
