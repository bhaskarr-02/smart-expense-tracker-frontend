import { useState, useEffect } from 'react'
import { getSummary, getTransactions, addTransaction } from '../services/ApiService'

const GOAL_ICONS = ['🎯','🏠','🚗','💻','✈️','📱','🎓','💍','🏋️','🎮']
const TODAY = new Date().toISOString().split('T')[0]

export default function Goals() {
  const userId = localStorage.getItem('userId')
  const [goals,   setGoals]   = useState(() => JSON.parse(localStorage.getItem('goals')||'[]'))
  const [summary, setSummary] = useState({ income:0, expense:0, balance:0 })
  const [txs,     setTxs]     = useState([])
  const [form,    setForm]    = useState({ name:'', targetAmount:'', deadline:'', icon:'🎯' })
  const [msg,     setMsg]     = useState({ text:'', ok:false })

  useEffect(() => {
    Promise.all([getSummary(userId), getTransactions(userId)]).then(([sr, tr]) => {
      setSummary(sr.data)
      setTxs(tr.data)
      localStorage.setItem('cachedTxs', JSON.stringify(tr.data))
    }).catch(console.error)
  }, [userId])

  const balance    = Number(summary.balance || 0)
  const income     = Number(summary.income  || 0)
  const expense    = Number(summary.expense || 0)
  const lowIncome  = income > 0 && balance < expense * 0.1

  // Save a new goal — saved amount always starts from 0, auto-calc from balance
  const saveGoal = () => {
    if (!form.name || !form.targetAmount || !form.deadline) {
      setMsg({ text:'Please fill Name, Target Amount and Deadline.', ok:false }); return
    }
    const target   = Number(form.targetAmount)
    const deadline = new Date(form.deadline)
    const today    = new Date()
    today.setHours(0,0,0,0)
    if (deadline <= today) { setMsg({ text:'Deadline must be a future date.', ok:false }); return }

    const monthsLeft = Math.max(1, Math.ceil((deadline - today) / (1000*60*60*24*30.44)))
    const perMonth   = (target / monthsLeft).toFixed(2)

    const goal = {
      ...form, id:Date.now(), targetAmount:target,
      savedAmount: 0,
      monthsLeft, perMonth,
      createdAt: TODAY
    }
    const updated = [...goals, goal]
    setGoals(updated); localStorage.setItem('goals', JSON.stringify(updated))
    setForm({ name:'', targetAmount:'', deadline:'', icon:'🎯' })
    setMsg({ text:`✅ Goal added! Save ₹${Number(perMonth).toLocaleString('en-IN')} per month to reach it.`, ok:true })
    setTimeout(() => setMsg({ text:'', ok:false }), 4000)
  }

  // Add savings contribution as an actual transaction
  const contributeToGoal = async (goal, amount) => {
    if (!amount || Number(amount) <= 0) { setMsg({ text:'Enter a valid amount.', ok:false }); return }
    const amt = Number(amount)
    if (amt > balance) {
      setMsg({ text:`❌ Insufficient balance! Your current balance is ₹${balance.toLocaleString('en-IN',{minimumFractionDigits:2})}. You cannot save more than your balance.`, ok:false })
      return
    }
    try {
      // Add as expense transaction (savings = money going out of balance)
      await addTransaction({
        type:'EXPENSE', amount:amt,
        category:'Savings', description:`Goal: ${goal.name} [Savings Contribution]`,
        date:TODAY, userId:Number(userId)
      })
      const newSaved  = Number(goal.savedAmount||0) + amt
      // Recalculate months left from today
      const deadline  = new Date(goal.deadline)
      const today     = new Date(); today.setHours(0,0,0,0)
      const monthsLeft= Math.max(1, Math.ceil((deadline - today) / (1000*60*60*24*30.44)))
      const remaining = Math.max(0, goal.targetAmount - newSaved)
      const perMonth  = (remaining / monthsLeft).toFixed(2)

      const updated   = goals.map(g => g.id === goal.id
        ? { ...g, savedAmount:newSaved, monthsLeft, perMonth }
        : g)
      setGoals(updated); localStorage.setItem('goals', JSON.stringify(updated))
      setMsg({ text:`✅ ₹${amt.toLocaleString('en-IN')} added to "${goal.name}"! Remaining: ₹${remaining.toLocaleString('en-IN')}`, ok:true })
      // Refresh summary
      getSummary(userId).then(r => setSummary(r.data))
      setTimeout(() => setMsg({ text:'', ok:false }), 4000)
    } catch { setMsg({ text:'❌ Failed to add transaction. Try again.', ok:false }) }
  }

  const removeGoal = (id) => {
    const updated = goals.filter(g => g.id !== id)
    setGoals(updated); localStorage.setItem('goals', JSON.stringify(updated))
  }

  const fmt = (v) => Number(v||0).toLocaleString('en-IN', { minimumFractionDigits:2 })

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Savings Goals</h1>
          <p className="page-sub">Set goals — contributions are recorded as transactions automatically</p>
        </div>
      </div>

      {/* Low Income Warning */}
      {lowIncome && (
        <div className="budget-block-banner" style={{marginBottom:'18px'}}>
          ⚠️ <strong>Low Balance Warning!</strong> Your income (₹{fmt(income)}) is barely covering your expenses (₹{fmt(expense)}).
          Your remaining balance ₹{fmt(balance)} is too low to save comfortably. Consider increasing income first.
        </div>
      )}

      {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg.text}</div>}

      {/* Summary strip */}
      <div className="summary-row" style={{marginBottom:'24px'}}>
        <div className="s-card s-income">
          <span className="s-icon">💰</span>
          <div><p className="s-label">Available Balance</p><p className="s-value clr-green">₹{fmt(balance)}</p></div>
        </div>
        <div className="s-card s-expense">
          <span className="s-icon">🎯</span>
          <div><p className="s-label">Active Goals</p><p className="s-value clr-blue">{goals.filter(g=>Number(g.savedAmount)<Number(g.targetAmount)).length}</p></div>
        </div>
        <div className="s-card s-bal-pos">
          <span className="s-icon">✅</span>
          <div><p className="s-label">Completed</p><p className="s-value clr-green">{goals.filter(g=>Number(g.savedAmount)>=Number(g.targetAmount)).length}</p></div>
        </div>
      </div>

      {/* Add Goal */}
      <div className="add-card" style={{marginBottom:'24px'}}>
        <div className="add-header"><h3>➕ Add Savings Goal</h3></div>
        <div className="add-body">
          <div className="add-grid">
            <div className="field"><label>Goal Name *</label>
              <input type="text" placeholder="e.g. New Laptop" value={form.name}
                onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>Target Amount (₹) *</label>
              <input type="number" placeholder="50000" value={form.targetAmount}
                onChange={e => setForm(p=>({...p,targetAmount:e.target.value}))} /></div>
            <div className="field"><label>Deadline * (must be future date)</label>
              <input type="date" value={form.deadline} min={new Date(Date.now()+86400000).toISOString().split('T')[0]}
                onChange={e => setForm(p=>({...p,deadline:e.target.value}))} /></div>
            <div className="field"><label>Icon</label>
              <div className="icon-picker">
                {GOAL_ICONS.map(ic => (
                  <button key={ic} type="button" className={`icon-btn ${form.icon===ic?'icon-active':''}`}
                    onClick={() => setForm(p=>({...p,icon:ic}))}>{ic}</button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{maxWidth:'200px'}} onClick={saveGoal}>Add Goal</button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="chart-card"><p className="no-data">No goals yet. Add your first savings goal above!</p></div>
      ) : (
        <div className="goals-grid">
          {goals.map(g => {
            const target    = Number(g.targetAmount) || 1
            const saved     = Number(g.savedAmount)  || 0
            const pct       = Math.min((saved/target)*100, 100)
            const remaining = Math.max(0, target - saved)
            const deadline  = new Date(g.deadline)
            const today     = new Date(); today.setHours(0,0,0,0)
            const daysLeft  = Math.ceil((deadline - today) / (1000*60*60*24))
            const monthsLeft= Math.max(1, Math.ceil(daysLeft / 30.44))
            const perMonth  = daysLeft > 0 ? (remaining / monthsLeft).toFixed(2) : 0
            const canAfford = balance >= Number(perMonth)
            const done      = pct >= 100
            const overdue   = daysLeft <= 0 && !done
            const [contrib, setContrib] = useState('')

            return (
              <div className={`goal-card ${done?'goal-done':''} ${overdue?'goal-overdue':''}`} key={g.id}>
                <div className="goal-header">
                  <span className="goal-icon">{g.icon}</span>
                  <div className="goal-info">
                    <p className="goal-name">{g.name}</p>
                    {done   && <span className="goal-badge">🎉 COMPLETED!</span>}
                    {overdue && !done && <span className="goal-badge" style={{background:'#FC8181',color:'#fff'}}>⏰ OVERDUE</span>}
                  </div>
                  <button className="btn-del" onClick={() => removeGoal(g.id)}>🗑️</button>
                </div>

                <div className="goal-amounts">
                  <span className="clr-green">Saved: ₹{fmt(saved)}</span>
                  <span className="clr-blue">Target: ₹{fmt(target)}</span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width:`${pct}%`,
                    background: done?'#48BB78' : pct>=60?'#3182CE' : '#ED8936'
                  }}/>
                </div>
                <p className="goal-pct">{pct.toFixed(1)}% complete — ₹{fmt(remaining)} remaining</p>

                {!done && (
                  <div className="goal-calc-box">
                    <p className="goal-deadline">
                      📅 {daysLeft > 0 ? `${daysLeft} days left (${monthsLeft} months)` : '⏰ Deadline passed!'}
                    </p>
                    {daysLeft > 0 && (
                      <>
                        <p className="goal-per-month">
                          💡 Save <strong>₹{fmt(perMonth)}/month</strong> to reach this goal on time
                        </p>
                        {!canAfford && balance > 0 && (
                          <p className="goal-warn">
                            ⚠️ Your current balance ₹{fmt(balance)} is lower than the monthly savings needed ₹{fmt(perMonth)}.
                            Increase your income to stay on track!
                          </p>
                        )}
                        {balance <= 0 && (
                          <p className="goal-warn">
                            🚨 Your balance is ₹{fmt(balance)}. Income is too low to save anything right now.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Contribute — records actual transaction */}
                {!done && (
                  <div className="goal-contribute">
                    <p style={{fontSize:'12px',fontWeight:700,color:'var(--text-muted)',marginBottom:'8px'}}>
                      💰 Add Savings (deducted from your balance as a transaction)
                    </p>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <input type="number" placeholder={`e.g. ${fmt(perMonth)}`} value={contrib}
                        onChange={e => setContrib(e.target.value)}
                        style={{flex:1,padding:'8px 12px',borderRadius:'8px',border:'1.5px solid var(--border)',background:'var(--card2)',color:'var(--text)',fontSize:'14px'}}/>
                      <button className="btn-primary" style={{maxWidth:'130px',marginTop:0,padding:'9px 14px',fontSize:'13px'}}
                        onClick={() => { contributeToGoal(g, contrib); setContrib('') }}>
                        ➕ Save Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
