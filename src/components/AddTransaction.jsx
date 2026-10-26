import { useState } from 'react'
import { addTransaction } from '../services/ApiService'
import { getContacts, addFriend } from '../services/Contacts'

const INCOME_CATS  = ['Salary','Freelance','Business','Investment','Gift','Other Income']
const EXPENSE_CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Savings','Other']
const MOODS        = ['😊 Happy','😐 Neutral','😞 Sad','😤 Stressed','🎉 Excited','😴 Tired']
const TODAY        = new Date().toISOString().split('T')[0]
const EMPTY        = { type:'EXPENSE', amount:'', category:'', description:'', date:TODAY, mood:'😐 Neutral', currency:'INR', memberName:'' }
const CURRENCIES   = ['INR','USD','EUR','GBP','AED','SGD','AUD','CAD','JPY']

export default function AddTransaction({ onAdded }) {
  const userId  = localStorage.getItem('userId')
  const balance = () => {
    const s = JSON.parse(localStorage.getItem('cachedSummary') || '{"balance":0}')
    return Number(s.balance || 0)
  }

  const [form,           setForm]           = useState(EMPTY)
  const [loading,        setLoading]        = useState(false)
  const [msg,            setMsg]            = useState({ text:'', ok:false })
  const [open,           setOpen]           = useState(true)
  const [receiptFile,    setReceiptFile]    = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [newFriend,      setNewFriend]      = useState('')
  const [contacts,       setContacts]       = useState(() => getContacts())

  const cats = form.type === 'INCOME' ? INCOME_CATS : EXPENSE_CATS

  const budgetExceeded = () => {
    if (form.type !== 'EXPENSE' || !form.category) return false
    const budgets = JSON.parse(localStorage.getItem('budgets') || '{}')
    const limit   = budgets[form.category]
    if (!limit) return false
    const month = new Date().toISOString().substring(0,7)
    const txs   = JSON.parse(localStorage.getItem('cachedTxs') || '[]')
    const spent = txs.filter(t => t.type==='EXPENSE' && t.category===form.category && t.date.startsWith(month))
                     .reduce((s,t) => s+Number(t.amount), 0)
    return spent >= limit
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]:value, ...(name==='type'?{category:'',memberName:''}:{}) }))
    setMsg({ text:'', ok:false })
  }

  const handleReceiptChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onload = () => setReceiptPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleAddFriend = () => {
    if (!newFriend.trim()) return
    const updated = addFriend(newFriend.trim())
    setContacts(getContacts())
    setNewFriend('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.date) { setMsg({ text:'Amount and Date are required.', ok:false }); return }
    if (Number(form.amount) <= 0)   { setMsg({ text:'Amount must be greater than 0.', ok:false }); return }

    // Check insufficient balance for expenses
    const bal = balance()
    if (form.type === 'EXPENSE' && Number(form.amount) > bal) {
      setMsg({ text:`🚨 Insufficient balance! Your balance is ₹${bal.toLocaleString('en-IN',{minimumFractionDigits:2})}. Income is too low to add this expense.`, ok:false })
      return
    }

    if (budgetExceeded()) {
      setMsg({ text:`🚨 Budget limit exceeded for "${form.category}" this month! You cannot add more expenses in this category.`, ok:false })
      return
    }

    setLoading(true)
    try {
      await addTransaction({
        type:form.type, amount:parseFloat(form.amount), category:form.category,
        description:`${form.description}${form.mood?` [Mood:${form.mood}]`:''}${form.memberName?` [Member:${form.memberName}]`:''}${form.currency!=='INR'?` [${form.currency}]`:''}`,
        date:form.date, userId:Number(userId)
      })
      setMsg({ text:'✅ Transaction added successfully!', ok:true })
      setForm({ ...EMPTY, date:form.date })
      setReceiptFile(null); setReceiptPreview(null)
      onAdded()
      setTimeout(() => setMsg({ text:'', ok:false }), 3000)
    } catch(err) {
      setMsg({ text: err.response?.data?.error || 'Failed to add.', ok:false })
    } finally { setLoading(false) }
  }

  const blocked = budgetExceeded()

  return (
    <div className="add-card">
      <div className="add-header" onClick={() => setOpen(o=>!o)}>
        <h3>➕ Add New Transaction</h3>
        <span>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <form className="add-body" onSubmit={onSubmit}>
          {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`}>{msg.text}</div>}
          {blocked && (
            <div className="budget-block-banner">
              🚨 <strong>Budget Exceeded!</strong> Monthly limit reached for <strong>{form.category}</strong>. No more expenses allowed this month.
            </div>
          )}

          {/* Receipt Upload */}
          <div className="scanner-box">
            <p className="scanner-title">🧾 Attach Receipt (optional, for reference)</p>
            <input type="file" accept="image/*" className="file-input" onChange={handleReceiptChange} />
            {receiptPreview && (
              <div className="receipt-preview-wrap">
                <img src={receiptPreview} alt="Receipt" className="receipt-preview-img" />
                <button type="button" className="btn-cancel" style={{fontSize:'12px',padding:'4px 10px'}}
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}>✕ Remove</button>
              </div>
            )}
          </div>

          <div className="add-grid">
            {/* Type */}
            <div className="field">
              <label>Type *</label>
              <div className="type-toggle">
                <button type="button" className={`type-btn ${form.type==='INCOME'?'type-inc':''}`}
                  onClick={() => setForm({...EMPTY,type:'INCOME',date:form.date})}>📈 Income</button>
                <button type="button" className={`type-btn ${form.type==='EXPENSE'?'type-exp':''}`}
                  onClick={() => setForm({...EMPTY,type:'EXPENSE',date:form.date})}>📉 Expense</button>
              </div>
            </div>
            {/* Amount */}
            <div className="field">
              <label>Amount *</label>
              <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00"
                value={form.amount} onChange={onChange} />
            </div>
            {/* Currency */}
            <div className="field">
              <label>🌍 Currency</label>
              <select name="currency" value={form.currency} onChange={onChange}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Category */}
            <div className="field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={onChange}>
                <option value="">-- Select --</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Date */}
            <div className="field">
              <label>Date *</label>
              <input name="date" type="date" value={form.date} max={TODAY} onChange={onChange} />
            </div>
            {/* Mood */}
            <div className="field">
              <label>😊 Spending Mood</label>
              <select name="mood" value={form.mood} onChange={onChange}>
                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Family Member + Friends dropdown */}
            <div className="field field-full">
              <label>👥 Assign to Member / Friend</label>
              <select name="memberName" value={form.memberName} onChange={onChange}>
                <option value="">-- None --</option>
                {contacts.family.length > 0 && (
                  <optgroup label="👨‍👩‍👧 Family Members">
                    {contacts.family.map(m => (
                      <option key={m.id} value={m.name}>{m.role} — {m.name}</option>
                    ))}
                  </optgroup>
                )}
                {contacts.friends.length > 0 && (
                  <optgroup label="👫 Friends">
                    {contacts.friends.map(f => (
                      <option key={f.id} value={f.name}>Friend — {f.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {/* Quick add friend */}
              <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                <input type="text" placeholder="Add new friend name..." value={newFriend}
                  onChange={e=>setNewFriend(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),handleAddFriend())}
                  style={{flex:1,padding:'7px 12px',borderRadius:'8px',border:'1.5px solid var(--border)',background:'var(--card2)',color:'var(--text)',fontSize:'13px'}}/>
                <button type="button" onClick={handleAddFriend}
                  style={{padding:'7px 14px',borderRadius:'8px',background:'var(--primary)',color:'#fff',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700}}>
                  + Add Friend
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="field field-full">
              <label>Description</label>
              <input name="description" type="text" placeholder="Add a note..."
                value={form.description} onChange={onChange} maxLength={255} />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading || blocked}>
            {loading ? 'Adding...' : blocked ? '🚫 Budget Limit Reached' : `Add ${form.type==='INCOME'?'Income':'Expense'}`}
          </button>
        </form>
      )}
    </div>
  )
}
