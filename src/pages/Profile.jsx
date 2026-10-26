import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSummary, getTransactions } from '../services/ApiService'

export default function Profile() {
  const navigate  = useNavigate()
  const userId    = localStorage.getItem('userId')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [email,    setEmail]    = useState(localStorage.getItem('email')    || '')
  const [phone,    setPhone]    = useState(localStorage.getItem('phone')    || '')
  const [summary,  setSummary]  = useState({ income:0, expense:0, balance:0 })
  const [txCount,  setTxCount]  = useState(0)
  const [badges,   setBadges]   = useState([])
  const [editMode, setEditMode] = useState(false)
  const [msg,      setMsg]      = useState('')
  const [joined,   setJoined]   = useState(localStorage.getItem('joinedDate') || new Date().toLocaleDateString('en-IN'))

  useEffect(() => {
    if (!localStorage.getItem('joinedDate')) {
      const d = new Date().toLocaleDateString('en-IN')
      localStorage.setItem('joinedDate', d)
      setJoined(d)
    }
    Promise.all([getSummary(userId), getTransactions(userId)]).then(([sr, tr]) => {
      setSummary(sr.data)
      setTxCount(tr.data.length)
    }).catch(console.error)
    const b = JSON.parse(localStorage.getItem('badges') || '[]')
    setBadges(b)
  }, [userId])

  const fmt = (v) => Number(v||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
  const bal = Number(summary.balance||0)

  const saveProfile = () => {
    localStorage.setItem('username', username)
    localStorage.setItem('email',    email)
    localStorage.setItem('phone',    phone)
    setEditMode(false)
    setMsg('✅ Profile updated successfully!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const BADGE_INFO = {
    saver:    { icon:'🥇', name:'Super Saver',     desc:'Balance is positive' },
    logger:   { icon:'🔥', name:'Daily Tracker',   desc:'Added 5+ transactions' },
    income:   { icon:'💎', name:'Income Master',   desc:'Income above ₹10,000' },
    balanced: { icon:'⚖️', name:'Balanced Budget', desc:'Expense < 80% of income' },
    rich:     { icon:'🏆', name:'Wealth Builder',  desc:'Balance above ₹50,000' },
  }

  const initials = username.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U'

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 My Profile</h1>
          <p className="page-sub">Manage your account and view your stats</p>
        </div>
      </div>

      {msg && <div className="alert alert-ok" style={{marginBottom:'18px'}}>{msg}</div>}

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-big">{initials}</div>
          <div>
            <p className="profile-name">{username}</p>
            <p className="profile-joined">Member since {joined}</p>
            <p className="profile-id">User ID: #{userId}</p>
          </div>
        </div>

        {/* Edit / Save */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'20px'}}>
          {editMode
            ? <><button className="btn-primary" style={{maxWidth:'120px',marginRight:'10px'}} onClick={saveProfile}>💾 Save</button>
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Cancel</button></>
            : <button className="btn-primary" style={{maxWidth:'140px'}} onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
          }
        </div>

        <div className="add-grid">
          <div className="field">
            <label>Full Name</label>
            {editMode
              ? <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
              : <p className="profile-field-val">{username || '—'}</p>}
          </div>
          <div className="field">
            <label>Email Address</label>
            {editMode
              ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"/>
              : <p className="profile-field-val">{email || '—'}</p>}
          </div>
          <div className="field">
            <label>Phone Number</label>
            {editMode
              ? <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9xxxxxxxxx"/>
              : <p className="profile-field-val">{phone || '—'}</p>}
          </div>
          <div className="field">
            <label>Account Status</label>
            <p className="profile-field-val" style={{color:'#276749',fontWeight:700}}>✅ Active</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="summary-row" style={{marginTop:'24px'}}>
        <div className="s-card s-income">
          <span className="s-icon">📈</span>
          <div><p className="s-label">Total Income</p><p className="s-value clr-green">₹{fmt(summary.income)}</p></div>
        </div>
        <div className="s-card s-expense">
          <span className="s-icon">📉</span>
          <div><p className="s-label">Total Expense</p><p className="s-value clr-red">₹{fmt(summary.expense)}</p></div>
        </div>
        <div className={`s-card ${bal>=0?'s-bal-pos':'s-bal-neg'}`}>
          <span className="s-icon">{bal>=0?'💰':'⚠️'}</span>
          <div><p className="s-label">Net Balance</p>
            <p className={`s-value ${bal>=0?'clr-blue':'clr-orange'}`}>₹{fmt(bal)}</p></div>
        </div>
        <div className="s-card s-income">
          <span className="s-icon">📋</span>
          <div><p className="s-label">Transactions</p><p className="s-value clr-blue">{txCount}</p></div>
        </div>
      </div>

      {/* Badges */}
      <div className="chart-card" style={{marginTop:'24px'}}>
        <h3 className="chart-title">🏆 My Badges ({badges.length}/5)</h3>
        {badges.length === 0
          ? <p className="no-data">No badges yet — add more transactions to earn them!</p>
          : (
            <div className="badges-list" style={{flexWrap:'wrap',gap:'12px'}}>
              {badges.map(id => {
                const b = BADGE_INFO[id]
                if (!b) return null
                return (
                  <div className="badge-item" key={id} title={b.desc} style={{padding:'12px 18px'}}>
                    <span className="badge-icon" style={{fontSize:'28px'}}>{b.icon}</span>
                    <div>
                      <span className="badge-name">{b.name}</span>
                      <p style={{fontSize:'11px',color:'var(--text-muted)',margin:0}}>{b.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
        {/* Locked badges */}
        {badges.length < 5 && (
          <div style={{marginTop:'16px'}}>
            <p style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'10px'}}>🔒 Locked badges:</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {Object.entries(BADGE_INFO).filter(([id]) => !badges.includes(id)).map(([id,b]) => (
                <div key={id} className="badge-item" style={{opacity:.4,padding:'10px 14px'}}>
                  <span className="badge-icon">{b.icon}</span>
                  <div>
                    <span className="badge-name">{b.name}</span>
                    <p style={{fontSize:'11px',color:'var(--text-muted)',margin:0}}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="chart-card" style={{marginTop:'24px',borderLeft:'4px solid #FC8181'}}>
        <h3 className="chart-title" style={{color:'#C53030'}}>⚠️ Account Actions</h3>
        <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
          <button className="nav-logout" style={{padding:'10px 22px',borderRadius:'10px',fontSize:'14px',fontWeight:700}}
            onClick={handleLogout}>
            🚪 Logout
          </button>
          <button className="btn-cancel" style={{padding:'10px 22px',fontSize:'14px'}}
            onClick={() => { if(window.confirm('Clear all local data?')) { localStorage.clear(); navigate('/login') } }}>
            🗑️ Clear Local Data
          </button>
        </div>
      </div>
    </div>
  )
}
