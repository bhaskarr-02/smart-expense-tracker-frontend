import { useState, useEffect } from 'react'
import { addTransaction, getTransactions, getSummary } from '../services/ApiService'

const FREQ = ['Daily','Weekly','Monthly','Yearly']
const INCOME_CATS  = ['Salary','Freelance','Business','Investment','Gift','Other Income']
const EXPENSE_CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other']

function getNextDate(dateStr, frequency) {
  const d = new Date(dateStr)
  switch(frequency) {
    case 'Daily':   d.setDate(d.getDate()+1); break
    case 'Weekly':  d.setDate(d.getDate()+7); break
    case 'Monthly': d.setMonth(d.getMonth()+1); break
    case 'Yearly':  d.setFullYear(d.getFullYear()+1); break
  }
  return d.toISOString().split('T')[0]
}

function isDueToday(nextDate) {
  const today = new Date().toISOString().split('T')[0]
  return nextDate <= today
}

export default function Recurring() {
  const userId = localStorage.getItem('userId')
  const [items,   setItems]   = useState(() => JSON.parse(localStorage.getItem('recurring')||'[]'))
  const [summary, setSummary] = useState({ income:0, expense:0, balance:0 })
  const [form,    setForm]    = useState({ name:'', type:'EXPENSE', amount:'', category:'', frequency:'Monthly', nextDate:'' })
  const [msg,     setMsg]     = useState({ text:'', ok:false })

  useEffect(() => {
    getSummary(userId).then(r => setSummary(r.data)).catch(console.error)
  }, [userId])

  const balance   = Number(summary.balance || 0)
  const income    = Number(summary.income  || 0)
  const cats      = form.type === 'INCOME' ? INCOME_CATS : EXPENSE_CATS
  const dueItems  = items.filter(i => isDueToday(i.nextDate))
  const fmt       = v => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
  const totalMonthlyExp = items.filter(i=>i.type==='EXPENSE'&&i.frequency==='Monthly').reduce((s,i)=>s+Number(i.amount),0)
  const totalMonthlyInc = items.filter(i=>i.type==='INCOME' &&i.frequency==='Monthly').reduce((s,i)=>s+Number(i.amount),0)

  const addItem = () => {
    if (!form.name||!form.amount||!form.nextDate) { setMsg({text:'Fill all required fields.',ok:false}); return }
    const updated = [...items, {...form, id:Date.now(), lastAdded:''}]
    setItems(updated); localStorage.setItem('recurring', JSON.stringify(updated))
    setForm({ name:'', type:'EXPENSE', amount:'', category:'', frequency:'Monthly', nextDate:'' })
    setMsg({text:'✅ Recurring transaction added!',ok:true})
    setTimeout(()=>setMsg({text:'',ok:false}),3000)
  }

  const removeItem = id => {
    const updated = items.filter(i => i.id!==id)
    setItems(updated); localStorage.setItem('recurring', JSON.stringify(updated))
  }

  const addNow = async (item) => {
    // Check income warning for expenses
    if (item.type==='EXPENSE' && Number(item.amount) > balance) {
      setMsg({text:`❌ Insufficient balance! Your balance ₹${fmt(balance)} is less than ₹${fmt(item.amount)} needed for "${item.name}". Add income first.`,ok:false})
      return
    }
    try {
      await addTransaction({
        type:item.type, amount:parseFloat(item.amount),
        category:item.category, description:`${item.name} (Recurring)`,
        date:new Date().toISOString().split('T')[0], userId:Number(userId)
      })
      const nextDate = getNextDate(item.nextDate, item.frequency)
      const updated  = items.map(i => i.id===item.id
        ? {...i, lastAdded:new Date().toISOString().split('T')[0], nextDate}
        : i)
      setItems(updated); localStorage.setItem('recurring', JSON.stringify(updated))
      getSummary(userId).then(r=>setSummary(r.data))
      setMsg({text:`✅ "${item.name}" added! Next due: ${nextDate}`,ok:true})
      setTimeout(()=>setMsg({text:'',ok:false}),3000)
    } catch { setMsg({text:'❌ Failed to add transaction.',ok:false}) }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Recurring Transactions</h1>
          <p className="page-sub">Set up recurring items — they appear as Dashboard alerts when due</p>
        </div>
      </div>

      {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg.text}</div>}

      {/* Due Today Alert */}
      {dueItems.length > 0 && (
        <div className="recurring-due-banner">
          <p className="recurring-due-title">🔔 {dueItems.length} Recurring Transaction{dueItems.length>1?'s':''} Due Today!</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
            {dueItems.map(item => (
              <div key={item.id} className="recurring-due-item">
                <span>{item.type==='INCOME'?'📈':'📉'} {item.name} — ₹{fmt(item.amount)}</span>
                <button className="btn-add-now" style={{marginLeft:'8px'}} onClick={()=>addNow(item)}>Add Now</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income Warning */}
      {income > 0 && totalMonthlyExp > income * 0.9 && (
        <div className="budget-block-banner" style={{marginBottom:'16px'}}>
          ⚠️ <strong>Income Alert!</strong> Your monthly recurring expenses (₹{fmt(totalMonthlyExp)}) are close to or exceed your total income (₹{fmt(income)}).
          You may not have enough balance to cover all recurring expenses.
        </div>
      )}

      {/* Summary */}
      <div className="summary-row" style={{marginBottom:'24px'}}>
        <div className="s-card s-income">
          <span className="s-icon">💰</span>
          <div><p className="s-label">Monthly Recurring Income</p><p className="s-value clr-green">₹{fmt(totalMonthlyInc)}</p></div>
        </div>
        <div className="s-card s-expense">
          <span className="s-icon">📉</span>
          <div><p className="s-label">Monthly Recurring Expense</p><p className="s-value clr-red">₹{fmt(totalMonthlyExp)}</p></div>
        </div>
        <div className="s-card s-bal-pos">
          <span className="s-icon">🔔</span>
          <div><p className="s-label">Due Today</p><p className="s-value clr-orange">{dueItems.length}</p></div>
        </div>
      </div>

      {/* Add Recurring */}
      <div className="add-card" style={{marginBottom:'24px'}}>
        <div className="add-header"><h3>➕ Add Recurring Transaction</h3></div>
        <div className="add-body">
          <div className="add-grid">
            <div className="field"><label>Name *</label>
              <input type="text" placeholder="e.g. Rent Payment" value={form.name}
                onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Type *</label>
              <div className="type-toggle">
                <button type="button" className={`type-btn ${form.type==='INCOME'?'type-inc':''}`}
                  onClick={()=>setForm(p=>({...p,type:'INCOME',category:''}))}>📈 Income</button>
                <button type="button" className={`type-btn ${form.type==='EXPENSE'?'type-exp':''}`}
                  onClick={()=>setForm(p=>({...p,type:'EXPENSE',category:''}))}>📉 Expense</button>
              </div>
            </div>
            <div className="field"><label>Amount (₹) *</label>
              <input type="number" placeholder="0.00" value={form.amount}
                onChange={e => setForm(p=>({...p,amount:e.target.value}))} /></div>
            <div className="field"><label>Category</label>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                <option value="">-- Select --</option>
                {cats.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="field"><label>Frequency *</label>
              <select value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                {FREQ.map(f=><option key={f} value={f}>{f}</option>)}
              </select></div>
            <div className="field"><label>Next Due Date *</label>
              <input type="date" value={form.nextDate}
                onChange={e=>setForm(p=>({...p,nextDate:e.target.value}))} /></div>
          </div>
          <button className="btn-primary" style={{maxWidth:'240px'}} onClick={addItem}>Add Recurring</button>
        </div>
      </div>

      {items.length===0 ? (
        <div className="chart-card"><p className="no-data">No recurring transactions yet. Add salary, rent, subscriptions above!</p></div>
      ) : (
        <div className="chart-card">
          <h3 className="chart-title">Your Recurring Transactions</h3>
          <div className="recurring-list">
            {items.map(item => {
              const due = isDueToday(item.nextDate)
              return (
                <div key={item.id} className={`recurring-item ${item.type==='INCOME'?'tx-inc':'tx-exp'} ${due?'recurring-due-highlight':''}`}>
                  <div className="recurring-icon">{item.type==='INCOME'?'📈':'📉'}</div>
                  <div className="recurring-info">
                    <p className="recurring-name">{item.name} {due && <span className="due-badge">🔔 DUE TODAY</span>}</p>
                    <p className="recurring-meta">{item.frequency} · {item.category||'—'} · Next: {item.nextDate}</p>
                    {item.lastAdded && <p className="recurring-last">Last added: {item.lastAdded}</p>}
                  </div>
                  <div className="recurring-amount">
                    <p className={item.type==='INCOME'?'clr-green':'clr-red'}>
                      {item.type==='INCOME'?'+':'−'} ₹{fmt(item.amount)}
                    </p>
                    <span className="freq-badge">{item.frequency}</span>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className={`btn-add-now ${due?'btn-add-now-due':''}`} onClick={()=>addNow(item)}>➕ Add Now</button>
                    <button className="btn-del" onClick={()=>removeItem(item.id)}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
