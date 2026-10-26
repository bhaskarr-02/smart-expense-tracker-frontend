import { useState, useEffect } from 'react'
import { getTransactions } from '../services/ApiService'

const ROLES = ['Father','Mother','Son','Daughter','Spouse','Other']

export default function Family() {
  const userId = localStorage.getItem('userId')
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('familyMembers')||'[]'))
  const [txs,     setTxs]     = useState([])
  const [newMember, setNewMember] = useState({ name:'', role:'Father', budget:'' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    getTransactions(userId).then(r => setTxs(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  const saveMember = () => {
    if (!newMember.name) return
    const updated = [...members, { ...newMember, id: Date.now() }]
    setMembers(updated)
    localStorage.setItem('familyMembers', JSON.stringify(updated))
    setNewMember({ name:'', role:'Father', budget:'' })
  }

  const removeMember = (id) => {
    const updated = members.filter(m => m.id !== id)
    setMembers(updated)
    localStorage.setItem('familyMembers', JSON.stringify(updated))
  }

  const getMemberTxs = (name) => txs.filter(t => (t.description||'').includes(`[Member:${name}]`))
  const getSpend     = (name) => getMemberTxs(name).filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+Number(t.amount),0)
  const getIncome    = (name) => getMemberTxs(name).filter(t=>t.type==='INCOME').reduce((s,t)=>s+Number(t.amount),0)
  const fmt = (v) => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  const totalFamilySpend  = members.reduce((s,m) => s+getSpend(m.name),0)
  const totalFamilyIncome = members.reduce((s,m) => s+getIncome(m.name),0)

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title">👨‍👩‍👧 Family Wallet</h1>
          <p className="page-sub">Track expenses for each family member</p></div>
      </div>

      {/* Overall Family Summary */}
      <div className="summary-row" style={{marginBottom:'24px'}}>
        <div className="s-card s-income">
          <span className="s-icon">👨‍👩‍👧</span>
          <div><p className="s-label">Family Members</p><p className="s-value clr-blue">{members.length}</p></div>
        </div>
        <div className="s-card s-income">
          <span className="s-icon">📈</span>
          <div><p className="s-label">Total Family Income</p><p className="s-value clr-green">₹{fmt(totalFamilyIncome)}</p></div>
        </div>
        <div className="s-card s-expense">
          <span className="s-icon">📉</span>
          <div><p className="s-label">Total Family Expense</p><p className="s-value clr-red">₹{fmt(totalFamilySpend)}</p></div>
        </div>
      </div>

      {/* Add Member */}
      <div className="add-card" style={{marginBottom:'24px'}}>
        <div className="add-header"><h3>➕ Add Family Member</h3></div>
        <div className="add-body">
          <div className="add-grid">
            <div className="field"><label>Name</label>
              <input type="text" placeholder="Member name" value={newMember.name}
                onChange={e => setNewMember(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Role</label>
              <select value={newMember.role} onChange={e => setNewMember(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div className="field"><label>Monthly Budget (₹)</label>
              <input type="number" placeholder="Optional budget limit" value={newMember.budget}
                onChange={e => setNewMember(p=>({...p,budget:e.target.value}))} /></div>
          </div>
          <button className="btn-primary" style={{maxWidth:'200px'}} onClick={saveMember}>Add Member</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        <button className={`tab-btn ${activeTab==='overview'?'tab-active':''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button className={`tab-btn ${activeTab==='detail'?'tab-active':''}`} onClick={() => setActiveTab('detail')}>📋 Transactions</button>
      </div>

      {members.length===0 ? (
        <div className="chart-card"><p className="no-data">No family members added yet. Add members above to track their expenses!</p></div>
      ) : activeTab==='overview' ? (
        <div className="family-grid">
          {members.map(m => {
            const spend = getSpend(m.name)
            const income = getIncome(m.name)
            const budget = Number(m.budget)||0
            const pct = budget > 0 ? Math.min((spend/budget)*100, 100) : 0
            return (
              <div className="family-card" key={m.id}>
                <div className="family-card-header">
                  <div className="family-avatar">{m.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="family-name">{m.name}</p>
                    <p className="family-role">{m.role}</p>
                  </div>
                  <button className="btn-del" onClick={() => removeMember(m.id)} style={{marginLeft:'auto'}}>🗑️</button>
                </div>
                <div className="family-stats">
                  <div className="family-stat"><span>📈 Income</span><span className="clr-green">₹{fmt(income)}</span></div>
                  <div className="family-stat"><span>📉 Expense</span><span className="clr-red">₹{fmt(spend)}</span></div>
                  <div className="family-stat"><span>💰 Balance</span><span className={income-spend>=0?'clr-blue':'clr-orange'}>₹{fmt(income-spend)}</span></div>
                  {budget > 0 && (
                    <div>
                      <div className="family-stat"><span>🎯 Budget</span><span>₹{fmt(budget)}</span></div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width:`${pct}%`, background: pct>=100?'#E53E3E':pct>=80?'#ED8936':'#48BB78'}} />
                      </div>
                      <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'4px'}}>{pct.toFixed(0)}% of budget used</p>
                    </div>
                  )}
                </div>
                <p className="family-tx-count">{getMemberTxs(m.name).length} transactions</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="chart-card">
          {members.map(m => (
            <div key={m.id} style={{marginBottom:'24px'}}>
              <h4 style={{color:'var(--primary)',marginBottom:'12px'}}>{m.role} — {m.name}</h4>
              {getMemberTxs(m.name).length===0 ? (
                <p className="no-data" style={{padding:'16px'}}>No transactions for {m.name} yet.</p>
              ) : (
                <table className="rpt-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
                  <tbody>
                    {getMemberTxs(m.name).map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td><span className={`badge ${t.type==='INCOME'?'badge-in':'badge-ex'}`}>{t.type}</span></td>
                        <td>{t.category||'—'}</td>
                        <td>{(t.description||'').replace(/\[.*?\]/g,'').trim()||'—'}</td>
                        <td className={t.type==='INCOME'?'clr-green':'clr-red'}>
                          {t.type==='INCOME'?'+':'−'} ₹{Number(t.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
