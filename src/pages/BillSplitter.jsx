import { useState } from 'react'
import { addTransaction } from '../services/ApiService'
import { getContacts, addFriend } from '../services/Contacts'

export default function BillSplitter() {
  const userId = localStorage.getItem('userId')
  const myName = localStorage.getItem('username') || 'Me'
  const [bills,       setBills]       = useState(() => JSON.parse(localStorage.getItem('bills')||'[]'))
  const [contacts,    setContacts]    = useState(() => getContacts())
  const [selected,    setSelected]    = useState([])
  const [newFriend,   setNewFriend]   = useState('')
  const [form,        setForm]        = useState({ title:'', totalAmount:'', date: new Date().toISOString().split('T')[0] })
  const [splits,      setSplits]      = useState([])
  const [step,        setStep]        = useState(1)
  const [msg,         setMsg]         = useState({ text:'', ok:false })
  const [saving,      setSaving]      = useState(false)

  const fmt = v => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  const toggleSelect = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n=>n!==name) : [...prev, name])
  }

  const handleAddFriend = () => {
    if (!newFriend.trim()) return
    addFriend(newFriend.trim())
    setContacts(getContacts())
    setSelected(prev => [...prev, newFriend.trim()])
    setNewFriend('')
  }

  const createBill = () => {
    if (!form.title||!form.totalAmount||selected.length===0) {
      setMsg({ text:'Fill title, amount and select at least one person.', ok:false }); return
    }
    const allPeople  = [myName, ...selected]
    const equalShare = (Number(form.totalAmount) / allPeople.length).toFixed(2)
    setSplits(allPeople.map(name => ({ name, share:equalShare, paid:name===myName, isMe:name===myName })))
    setStep(2); setMsg({ text:'', ok:false })
  }

  const saveBill = async () => {
    setSaving(true)
    try {
      // Record my share as an expense transaction
      const myShare = splits.find(s=>s.isMe)
      if (myShare) {
        await addTransaction({
          type:'EXPENSE', amount:parseFloat(myShare.share),
          category:'Entertainment', description:`Bill Split: ${form.title} [BillSplitter]`,
          date:form.date, userId:Number(userId)
        })
      }
      const bill = { id:Date.now(), title:form.title, totalAmount:Number(form.totalAmount), date:form.date, splits, createdAt:new Date().toLocaleString('en-IN') }
      const updated = [bill, ...bills]
      setBills(updated); localStorage.setItem('bills', JSON.stringify(updated))
      setForm({ title:'', totalAmount:'', date:new Date().toISOString().split('T')[0] })
      setSplits([]); setSelected([]); setStep(1)
      setMsg({ text:'✅ Bill saved! Your share recorded as an expense transaction.', ok:true })
      setTimeout(()=>setMsg({text:'',ok:false}),4000)
    } catch { setMsg({ text:'❌ Failed to save bill.', ok:false }) }
    finally { setSaving(false) }
  }

  const togglePaid = (billId, personName) => {
    const updated = bills.map(b => b.id===billId
      ? {...b, splits:b.splits.map(s=>s.name===personName?{...s,paid:!s.paid}:s)} : b)
    setBills(updated); localStorage.setItem('bills', JSON.stringify(updated))
  }

  const deleteBill = id => {
    const updated = bills.filter(b=>b.id!==id)
    setBills(updated); localStorage.setItem('bills', JSON.stringify(updated))
  }

  const updateShare = (name, val) => setSplits(p=>p.map(s=>s.name===name?{...s,share:val}:s))

  const owedToMe = bills.reduce((t,b)=>t+b.splits.filter(s=>!s.isMe&&!s.paid).reduce((s,p)=>s+Number(p.share),0),0)
  const iOwe     = bills.reduce((t,b)=>t+b.splits.filter(s=>s.isMe&&!s.paid).reduce((s,p)=>s+Number(p.share),0),0)

  const allContacts = [...contacts.family, ...contacts.friends]

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title">🧾 Bill Splitter</h1>
          <p className="page-sub">Split bills with family & friends — your share is auto-recorded as a transaction</p></div>
      </div>

      <div className="summary-row" style={{marginBottom:'24px'}}>
        <div className="s-card s-income"><span className="s-icon">💸</span>
          <div><p className="s-label">Others Owe Me</p><p className="s-value clr-green">₹{fmt(owedToMe)}</p></div></div>
        <div className="s-card s-expense"><span className="s-icon">🤝</span>
          <div><p className="s-label">I Owe Others</p><p className="s-value clr-red">₹{fmt(iOwe)}</p></div></div>
        <div className="s-card s-bal-pos"><span className="s-icon">🧾</span>
          <div><p className="s-label">Total Bills</p><p className="s-value clr-blue">{bills.length}</p></div></div>
      </div>

      {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg.text}</div>}

      {/* Step 1 */}
      {step===1 && (
        <div className="add-card">
          <div className="add-header"><h3>➕ Create New Bill Split</h3></div>
          <div className="add-body">
            <div className="add-grid">
              <div className="field"><label>Bill Title *</label>
                <input type="text" placeholder="e.g. Dinner at Paradise Hotel" value={form.title}
                  onChange={e=>setForm(p=>({...p,title:e.target.value}))} /></div>
              <div className="field"><label>Total Amount (₹) *</label>
                <input type="number" placeholder="0.00" value={form.totalAmount}
                  onChange={e=>setForm(p=>({...p,totalAmount:e.target.value}))} /></div>
              <div className="field"><label>Date</label>
                <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
            </div>

            {/* People selector */}
            <div className="field" style={{marginTop:'8px'}}>
              <label>👥 Select People to Split With *</label>
              {allContacts.length === 0 ? (
                <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'8px 0'}}>No contacts yet. Add friends below.</p>
              ) : (
                <div className="contact-chip-wrap">
                  {allContacts.map(c => (
                    <button type="button" key={c.id}
                      className={`contact-chip ${selected.includes(c.name)?'contact-chip-sel':''}`}
                      onClick={()=>toggleSelect(c.name)}>
                      {c.role==='Friend'?'👫':'👨‍👩‍👧'} {c.name}
                    </button>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <input type="text" placeholder="Add new friend..." value={newFriend}
                  onChange={e=>setNewFriend(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),handleAddFriend())}
                  style={{flex:1,padding:'7px 12px',borderRadius:'8px',border:'1.5px solid var(--border)',background:'var(--card2)',color:'var(--text)',fontSize:'13px'}}/>
                <button type="button" onClick={handleAddFriend}
                  style={{padding:'7px 14px',borderRadius:'8px',background:'var(--primary)',color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:'13px'}}>
                  + Add
                </button>
              </div>
              {selected.length>0 && (
                <p style={{fontSize:'13px',marginTop:'8px',color:'var(--text-muted)'}}>
                  ✅ Selected: <strong>{myName}</strong> + {selected.join(', ')} ({1+selected.length} people)
                </p>
              )}
            </div>

            <button className="btn-primary" style={{maxWidth:'220px'}} onClick={createBill}>➡️ Split Equally</button>
          </div>
        </div>
      )}

      {/* Step 2 — review */}
      {step===2 && (
        <div className="add-card">
          <div className="add-header"><h3>✏️ Review — {form.title} (₹{fmt(form.totalAmount)})</h3></div>
          <div className="add-body">
            <p style={{fontSize:'13px',color:'var(--text-muted)',marginBottom:'14px'}}>
              Adjust individual amounts below if not splitting equally.
            </p>
            <div className="split-list">
              {splits.map(s=>(
                <div key={s.name} className={`split-item ${s.isMe?'split-me':''}`}>
                  <div className="split-avatar">{s.name.charAt(0).toUpperCase()}</div>
                  <div className="split-name"><span>{s.name}</span>
                    {s.isMe&&<span className="split-you-badge">You</span>}</div>
                  <input type="number" value={s.share} onChange={e=>updateShare(s.name,e.target.value)}
                    style={{width:'120px',padding:'7px 10px',fontSize:'14px',borderRadius:'8px',border:'1.5px solid var(--border)',background:'var(--card2)',color:'var(--text)'}}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
              <button className="btn-primary" style={{maxWidth:'180px',marginTop:0}} onClick={saveBill} disabled={saving}>
                {saving?'Saving...':'💾 Save Bill'}
              </button>
              <button className="btn-cancel" onClick={()=>setStep(1)}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Existing bills */}
      {bills.length===0?(
        <div className="chart-card" style={{marginTop:'24px'}}><p className="no-data">No bills yet. Create your first split above!</p></div>
      ):(
        <div style={{marginTop:'24px',display:'flex',flexDirection:'column',gap:'18px'}}>
          {bills.map(b=>{
            const unpaid=b.splits.filter(s=>!s.isMe&&!s.paid)
            return(
              <div key={b.id} className="bill-card">
                <div className="bill-card-header">
                  <div><p className="bill-title">{b.title}</p>
                    <p className="bill-meta">{b.date} · {b.splits.length} people</p></div>
                  <div style={{textAlign:'right'}}>
                    <p className="bill-total">₹{fmt(b.totalAmount)}</p>
                    <button className="btn-del" onClick={()=>deleteBill(b.id)}>🗑️</button>
                  </div>
                </div>
                <div className="bill-splits">
                  {b.splits.map(s=>(
                    <div key={s.name} className={`bill-split-row ${s.paid||s.isMe?'bill-split-paid':''}`}>
                      <div className="split-avatar" style={{width:'32px',height:'32px',fontSize:'13px'}}>{s.name.charAt(0).toUpperCase()}</div>
                      <span className="bill-split-name">{s.name} {s.isMe&&<span className="split-you-badge">You</span>}</span>
                      <span className={`bill-split-amt ${s.isMe?'clr-blue':s.paid?'clr-green':'clr-red'}`}>₹{fmt(s.share)}</span>
                      {!s.isMe&&(
                        <button className={`btn-paid-toggle ${s.paid?'btn-paid-done':''}`}
                          onClick={()=>togglePaid(b.id,s.name)}>
                          {s.paid?'✅ Paid':'⏳ Pending'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {unpaid.length>0?(
                  <p className="bill-reminder">⏳ Pending: {unpaid.map(f=>f.name).join(', ')} — ₹{fmt(unpaid.reduce((s,f)=>s+Number(f.share),0))}</p>
                ):(
                  <p className="bill-settled">🎉 All settled!</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
