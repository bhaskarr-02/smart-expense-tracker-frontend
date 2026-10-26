import { useState, useEffect } from 'react'
import { getTransactions } from '../services/ApiService'

const CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other']

export default function Budget() {
  const userId = localStorage.getItem('userId')
  const [txs, setTxs] = useState([])
  const [budgets, setBudgets] = useState(() => JSON.parse(localStorage.getItem('budgets')||'{}'))
  const [editing, setEditing] = useState({})

  useEffect(() => { getTransactions(userId).then(r => setTxs(r.data)).catch(console.error) }, [userId])

  const currentMonth = new Date().toISOString().substring(0,7)
  const monthTxs = txs.filter(t => t.type==='EXPENSE' && t.date.startsWith(currentMonth))

  const catSpend = {}
  monthTxs.forEach(t => { catSpend[t.category] = (catSpend[t.category]||0) + Number(t.amount) })

  const saveBudget = (cat) => {
    const val = editing[cat]
    if (!val || Number(val) <= 0) return
    const updated = { ...budgets, [cat]: Number(val) }
    setBudgets(updated); localStorage.setItem('budgets', JSON.stringify(updated))
    setEditing(p => ({...p, [cat]: ''}))
  }

  const removeBudget = (cat) => {
    const updated = { ...budgets }; delete updated[cat]
    setBudgets(updated); localStorage.setItem('budgets', JSON.stringify(updated))
  }

  const fmt = (v) => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  const totalBudget = Object.values(budgets).reduce((s,v) => s+Number(v), 0)
  const totalSpent  = Object.keys(budgets).reduce((s,k) => s+(catSpend[k]||0), 0)

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title">🔔 Budget Alerts</h1>
          <p className="page-sub">Set monthly limits and get alerts — {currentMonth}</p></div>
      </div>

      {/* Overall */}
      <div className="summary-row" style={{marginBottom:'24px'}}>
        <div className="s-card s-income">
          <span className="s-icon">🎯</span>
          <div><p className="s-label">Total Budget</p><p className="s-value clr-blue">₹{fmt(totalBudget)}</p></div>
        </div>
        <div className="s-card s-expense">
          <span className="s-icon">💸</span>
          <div><p className="s-label">Total Spent</p><p className="s-value clr-red">₹{fmt(totalSpent)}</p></div>
        </div>
        <div className={`s-card ${totalSpent<=totalBudget?'s-bal-pos':'s-bal-neg'}`}>
          <span className="s-icon">{totalSpent<=totalBudget?'✅':'🚨'}</span>
          <div><p className="s-label">Remaining</p>
            <p className={`s-value ${totalSpent<=totalBudget?'clr-green':'clr-red'}`}>₹{fmt(totalBudget-totalSpent)}</p></div>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Category Budget vs Spending — {currentMonth}</h3>
        <div className="budget-grid">
          {CATS.map(cat => {
            const limit = budgets[cat] || 0
            const spent = catSpend[cat] || 0
            const pct   = limit > 0 ? Math.min((spent/limit)*100,100) : 0
            const over  = spent > limit && limit > 0
            const warn  = pct >= 80 && !over

            return (
              <div className={`budget-row ${over?'budget-over':warn?'budget-warn':''}`} key={cat}>
                <div className="budget-row-header">
                  <span className="budget-cat">{cat}</span>
                  <div className="budget-actions">
                    {limit > 0 && <button className="btn-del" style={{fontSize:'14px'}} onClick={() => removeBudget(cat)}>🗑️</button>}
                  </div>
                </div>
                <div className="budget-row-body">
                  <div className="budget-inputs">
                    <input type="number" className="budget-input" placeholder="Set limit ₹"
                      value={editing[cat]||''} onChange={e => setEditing(p=>({...p,[cat]:e.target.value}))} />
                    <button className="btn-set" onClick={() => saveBudget(cat)}>Set</button>
                  </div>
                  {limit > 0 && (
                    <div className="budget-progress">
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>
                        <span>Spent: ₹{fmt(spent)}</span>
                        <span>Limit: ₹{fmt(limit)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width:`${pct}%`,
                          background: over?'#E53E3E':warn?'#ED8936':'#48BB78'
                        }} />
                      </div>
                      {over && <p className="budget-msg budget-msg-over">🚨 EXCEEDED by ₹{fmt(spent-limit)}!</p>}
                      {warn && <p className="budget-msg budget-msg-warn">⚠️ {pct.toFixed(0)}% used — ₹{fmt(limit-spent)} left</p>}
                      {!over && !warn && limit>0 && <p className="budget-msg">✅ {pct.toFixed(0)}% used — ₹{fmt(limit-spent)} remaining</p>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
