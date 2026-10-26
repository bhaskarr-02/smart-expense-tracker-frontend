import { useState, useEffect, useCallback } from 'react'
import { getSummary, getTransactions } from '../services/ApiService'
import AddTransaction from '../components/AddTransaction'
import TransactionList from '../components/TransactionList'
import FeatureCards from '../components/FeatureCards'

const BADGES = [
  { id:'saver',    icon:'🥇', name:'Super Saver',     desc:'Balance > 0',              check:(s)     => Number(s.balance) > 0 },
  { id:'logger',   icon:'🔥', name:'Daily Tracker',   desc:'5+ transactions',          check:(s,txs) => txs.length >= 5 },
  { id:'income',   icon:'💎', name:'Income Master',   desc:'Income > ₹10,000',         check:(s)     => Number(s.income) >= 10000 },
  { id:'balanced', icon:'⚖️', name:'Balanced Budget', desc:'Expense < 80% of income', check:(s)     => Number(s.income)>0 && Number(s.expense)/Number(s.income) < 0.8 },
  { id:'rich',     icon:'🏆', name:'Wealth Builder',  desc:'Balance > ₹50,000',        check:(s)     => Number(s.balance) >= 50000 },
]

function isDueToday(nextDate) {
  return nextDate && nextDate <= new Date().toISOString().split('T')[0]
}

export default function Dashboard() {
  const userId   = localStorage.getItem('userId')
  const username = localStorage.getItem('username')
  const [summary,      setSummary]      = useState({ income:0, expense:0, balance:0 })
  const [txs,          setTxs]          = useState([])
  const [refresh,      setRefresh]      = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [earnedBadges, setEarnedBadges] = useState([])
  const [newBadge,     setNewBadge]     = useState(null)
  const [dismissedRecurring, setDismissedRecurring] = useState(() =>
    JSON.parse(sessionStorage.getItem('dismissedRecurring') || '[]'))

  const load = useCallback(async () => {
    try {
      const [sr, tr] = await Promise.all([getSummary(userId), getTransactions(userId)])
      setSummary(sr.data); setTxs(tr.data)
      localStorage.setItem('cachedSummary', JSON.stringify(sr.data))
      localStorage.setItem('cachedTxs', JSON.stringify(tr.data))
      const earned  = BADGES.filter(b => b.check(sr.data, tr.data))
      const prev    = JSON.parse(localStorage.getItem('badges') || '[]')
      const newOnes = earned.filter(b => !prev.includes(b.id))
      if (newOnes.length) { setNewBadge(newOnes[0]); setTimeout(() => setNewBadge(null), 5000) }
      localStorage.setItem('badges', JSON.stringify(earned.map(b => b.id)))
      setEarnedBadges(earned)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [userId, refresh])

  useEffect(() => { load() }, [load])

  const fmt = (v) => Number(v||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
  const bal = Number(summary.balance || 0)
  const inc = Number(summary.income  || 0)
  const exp = Number(summary.expense || 0)

  // Budget alerts
  const budgets      = JSON.parse(localStorage.getItem('budgets') || '{}')
  const currentMonth = new Date().toISOString().substring(0,7)
  const monthTxs     = txs.filter(t => t.type==='EXPENSE' && t.date.startsWith(currentMonth))
  const catSpend     = {}
  monthTxs.forEach(t => { catSpend[t.category] = (catSpend[t.category]||0) + Number(t.amount) })
  const budgetAlerts = Object.entries(budgets).filter(([cat, limit]) => (catSpend[cat]||0) >= limit * 0.8)

  // Recurring due alerts
  const allRecurring = JSON.parse(localStorage.getItem('recurring') || '[]')
  const dueRecurring = allRecurring.filter(i => isDueToday(i.nextDate) && !dismissedRecurring.includes(i.id))

  // Low income warning
  const lowIncome = inc > 0 && bal < exp * 0.1

  const dismissRecurring = (id) => {
    const updated = [...dismissedRecurring, id]
    setDismissedRecurring(updated)
    sessionStorage.setItem('dismissedRecurring', JSON.stringify(updated))
  }

  return (
    <div>
      {/* HERO */}
      <div className="hero-section">
        <div className="hero-bg-img" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-left">
            <p className="hero-greeting">👋 Welcome back,</p>
            <h1 className="hero-name">{username}</h1>
            <p className="hero-subtitle">Your smart financial dashboard — track every rupee, reach every goal.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-icon">📈</span>
                <div><p className="hero-stat-label">Income</p>
                  <p className="hero-stat-val clr-green-light">₹{fmt(summary.income)}</p></div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-icon">📉</span>
                <div><p className="hero-stat-label">Expense</p>
                  <p className="hero-stat-val clr-red-light">₹{fmt(summary.expense)}</p></div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-icon">💰</span>
                <div><p className="hero-stat-label">Balance</p>
                  <p className={`hero-stat-val ${bal>=0?'clr-green-light':'clr-red-light'}`}>₹{fmt(bal)}</p></div>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-card-float">
              <p className="hero-card-label">📅 Today</p>
              <p className="hero-card-date">
                {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </p>
              <div className="hero-card-badges">
                {earnedBadges.length > 0
                  ? earnedBadges.slice(0,3).map(b => (
                      <span key={b.id} className="hero-badge-pill" title={b.desc}>{b.icon} {b.name}</span>))
                  : <span className="hero-badge-pill">🎯 Add transactions to earn badges!</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-wrap">

        {/* Badge popup */}
        {newBadge && (
          <div className="badge-popup">
            <span className="badge-popup-icon">{newBadge.icon}</span>
            <div><p className="badge-popup-title">🎉 New Badge Earned!</p>
              <p className="badge-popup-name">{newBadge.name}</p></div>
          </div>
        )}

        {/* ── ALERT PANEL ─────────────────────────────── */}
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'18px'}}>

          {/* Low income warning */}
          {lowIncome && (
            <div className="dash-alert dash-alert-danger">
              <span className="dash-alert-icon">🚨</span>
              <div>
                <p className="dash-alert-title">Income Too Low!</p>
                <p className="dash-alert-msg">
                  Your balance ₹{fmt(bal)} is critically low. Total income ₹{fmt(inc)} barely covers expenses ₹{fmt(exp)}.
                  You may be unable to add more expenses. Please add income first.
                </p>
              </div>
            </div>
          )}

          {/* Recurring due notifications */}
          {dueRecurring.map(item => (
            <div key={item.id} className="dash-alert dash-alert-recurring">
              <span className="dash-alert-icon">🔔</span>
              <div style={{flex:1}}>
                <p className="dash-alert-title">Recurring Due: {item.name}</p>
                <p className="dash-alert-msg">
                  {item.frequency} {item.type==='INCOME'?'income':'expense'} of ₹{fmt(item.amount)} ({item.category||'—'}) is due today!
                  Go to <a href="/recurring" className="dash-alert-link">Recurring Transactions</a> to add it.
                </p>
              </div>
              <button className="dash-alert-dismiss" onClick={() => dismissRecurring(item.id)} title="Dismiss">✕</button>
            </div>
          ))}

          {/* Budget alerts */}
          {budgetAlerts.map(([cat, limit]) => (
            <div key={cat} className={`dash-alert ${(catSpend[cat]||0)>=limit ? 'dash-alert-danger' : 'dash-alert-warn'}`}>
              <span className="dash-alert-icon">{(catSpend[cat]||0)>=limit?'🚨':'⚠️'}</span>
              <div>
                <p className="dash-alert-title">Budget {(catSpend[cat]||0)>=limit?'Exceeded':'Warning'}: {cat}</p>
                <p className="dash-alert-msg">
                  Spent ₹{fmt(catSpend[cat]||0)} of ₹{fmt(limit)} budget this month.
                  {(catSpend[cat]||0)>=limit ? ' No more expenses allowed in this category!' : ' 80% of limit used.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {loading ? <div className="loader" style={{marginTop:'30px'}}>Loading...</div> : (
          <>
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
                <div><p className="s-label">Balance</p>
                  <p className={`s-value ${bal>=0?'clr-blue':'clr-orange'}`}>₹{fmt(bal)}</p></div>
              </div>
            </div>

            {earnedBadges.length > 0 && (
              <div className="badges-row">
                <p className="badges-title">🏆 Your Badges</p>
                <div className="badges-list">
                  {earnedBadges.map(b => (
                    <div className="badge-item" key={b.id} title={b.desc}>
                      <span className="badge-icon">{b.icon}</span>
                      <span className="badge-name">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <AddTransaction onAdded={() => setRefresh(r => !r)} />
        <TransactionList refresh={refresh} onDeleted={() => setRefresh(r=>!r)} onEdited={() => setRefresh(r=>!r)} />
        <FeatureCards />
      </div>
    </div>
  )
}
