import { useState } from 'react'
import { addTransaction } from '../services/ApiService'

const LOCATION_RULES = [
  { keywords:['restaurant','hotel','dhaba','pizza','burger','cafe','biryani','sweets','food','eat','dining'], category:'Food',          icon:'🍽️' },
  { keywords:['petrol','fuel','gas','pump','diesel','cng','bunk'],                                           category:'Transport',     icon:'⛽' },
  { keywords:['mall','shopping','store','mart','bazaar','market','textile','clothes','fashion'],              category:'Shopping',      icon:'🛍️' },
  { keywords:['hospital','clinic','pharmacy','medical','doctor','health','labs','diagnostic'],               category:'Health',        icon:'🏥' },
  { keywords:['school','college','university','institute','coaching','academy','library'],                   category:'Education',     icon:'🎓' },
  { keywords:['cinema','theatre','multiplex','pvr','inox','amusement','gaming'],                            category:'Entertainment', icon:'🎬' },
  { keywords:['electricity','water','telecom','internet','broadband','utility'],                             category:'Bills',         icon:'💡' },
  { keywords:['supermarket','grocery','vegetables','fruits','kirana','provisions'],                         category:'Groceries',     icon:'🛒' },
]

const EXPENSE_CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other']

export default function LocationTracker() {
  const userId = localStorage.getItem('userId')
  const [placeName,  setPlaceName]  = useState('')
  const [suggested,  setSuggested]  = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [form,       setForm]       = useState({ type:'EXPENSE', amount:'', category:'', description:'', date:new Date().toISOString().split('T')[0] })
  const [msg,        setMsg]        = useState({ text:'', ok:false })
  const [saving,     setSaving]     = useState(false)
  const [history,    setHistory]    = useState(() => JSON.parse(localStorage.getItem('locationHistory')||'[]'))

  const detectLocation = () => {
    if (!navigator.geolocation) { setMsg({ text:'❌ Geolocation not supported.', ok:false }); return }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        const data = await res.json()
        const name = data.display_name || 'Current Location'
        const short = name.split(',').slice(0,3).join(', ')
        setPlaceName(short)
        const lower   = name.toLowerCase()
        const matched = LOCATION_RULES.find(r => r.keywords.some(k => lower.includes(k)))
        if (matched) {
          setSuggested(matched)
          setForm(p=>({...p, category:matched.category, description:`At ${short}`}))
          setMsg({ text:`📍 Detected: ${short} — suggested category: ${matched.icon} ${matched.category}`, ok:true })
        } else {
          setSuggested(null)
          setForm(p=>({...p, description:`At ${short}`}))
          setMsg({ text:`📍 Location: ${short}`, ok:true })
        }
      } catch { setMsg({ text:'❌ Could not detect location. Check internet.', ok:false }) }
      finally { setLocLoading(false) }
    }, () => { setMsg({ text:'❌ Location permission denied.', ok:false }); setLocLoading(false) })
  }

  const saveTransaction = async () => {
    if (!form.amount||Number(form.amount)<=0) { setMsg({ text:'Enter a valid amount.', ok:false }); return }
    if (!placeName) { setMsg({ text:'Detect location first.', ok:false }); return }
    setSaving(true)
    try {
      await addTransaction({
        type:form.type, amount:parseFloat(form.amount), category:form.category||'Other',
        description:`${form.description} [Location: ${placeName}]`,
        date:form.date, userId:Number(userId)
      })
      const entry = { id:Date.now(), place:placeName, ...form, category:form.category||'Other' }
      const updated = [entry,...history].slice(0,20)
      setHistory(updated); localStorage.setItem('locationHistory', JSON.stringify(updated))
      setMsg({ text:`✅ ${form.type==='INCOME'?'Income':'Expense'} of ₹${form.amount} at "${placeName}" saved!`, ok:true })
      setForm({ type:'EXPENSE', amount:'', category:suggested?.category||'', description:`At ${placeName}`, date:new Date().toISOString().split('T')[0] })
    } catch { setMsg({ text:'❌ Failed to save.', ok:false }) }
    finally { setSaving(false) }
  }

  const fmt = v => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title">📍 Location Tags</h1>
          <p className="page-sub">Detect your location, auto-suggest category, and log the transaction instantly.</p></div>
      </div>

      <div className="chart-card" style={{textAlign:'center',marginBottom:'24px'}}>
        <p style={{fontSize:'14px',color:'var(--text-muted)',marginBottom:'18px'}}>
          Allow location permission when prompted. Works best outdoors.
        </p>
        <button className="btn-primary" style={{maxWidth:'260px',margin:'0 auto'}} onClick={detectLocation} disabled={locLoading}>
          {locLoading ? '📡 Detecting...' : '📍 Detect My Location'}
        </button>
        {placeName && <p style={{marginTop:'14px',fontSize:'15px',fontWeight:700,color:'var(--text)'}}>📍 {placeName}</p>}
        {suggested && <p style={{fontSize:'14px',color:'var(--text-muted)',marginTop:'6px'}}>Suggested: {suggested.icon} {suggested.category}</p>}
      </div>

      {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg.text}</div>}

      {placeName && (
        <div className="add-card" style={{marginBottom:'24px'}}>
          <div className="add-header"><h3>💰 Log Transaction for this Location</h3></div>
          <div className="add-body">
            <div className="add-grid">
              <div className="field"><label>Type</label>
                <div className="type-toggle">
                  <button type="button" className={`type-btn ${form.type==='INCOME'?'type-inc':''}`}
                    onClick={()=>setForm(p=>({...p,type:'INCOME'}))}>📈 Income</button>
                  <button type="button" className={`type-btn ${form.type==='EXPENSE'?'type-exp':''}`}
                    onClick={()=>setForm(p=>({...p,type:'EXPENSE'}))}>📉 Expense</button>
                </div>
              </div>
              <div className="field"><label>Amount (₹) *</label>
                <input type="number" placeholder="0.00" value={form.amount}
                  onChange={e=>setForm(p=>({...p,amount:e.target.value}))} /></div>
              <div className="field"><label>Category</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  <option value="">-- Select --</option>
                  {EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="field"><label>Date</label>
                <input type="date" value={form.date} max={new Date().toISOString().split('T')[0]}
                  onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
              <div className="field field-full"><label>Description</label>
                <input type="text" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
            </div>
            <button className="btn-primary" style={{maxWidth:'220px'}} onClick={saveTransaction} disabled={saving}>
              {saving?'Saving...':'💾 Save Transaction'}
            </button>
          </div>
        </div>
      )}

      {history.length>0&&(
        <div className="chart-card">
          <h3 className="chart-title">📍 Location History</h3>
          <div className="recurring-list" style={{marginTop:'12px'}}>
            {history.slice(0,10).map(h=>(
              <div key={h.id} className={`recurring-item ${h.type==='INCOME'?'tx-inc':'tx-exp'}`}>
                <div className="recurring-icon">📍</div>
                <div className="recurring-info">
                  <p className="recurring-name">{h.place}</p>
                  <p className="recurring-meta">{h.category} · {h.date}</p>
                </div>
                <p className={h.type==='INCOME'?'clr-green':'clr-red'}>
                  {h.type==='INCOME'?'+':'−'}₹{fmt(h.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
