import { useState, useRef } from 'react'
import { addTransaction, getSummary } from '../services/ApiService'

const EXPENSE_CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Savings','Other']
const INCOME_CATS  = ['Salary','Freelance','Business','Investment','Gift','Other Income']

function parseVoice(text) {
  const lower = text.toLowerCase()
  const type  = lower.includes('income') || lower.includes('salary') || lower.includes('received') || lower.includes('earned') ? 'INCOME' : 'EXPENSE'
  const cats  = type==='INCOME' ? INCOME_CATS : EXPENSE_CATS

  // Extract amount
  const amtMatch = text.match(/₹?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:rupees?|rs\.?)?/i)
  const amount   = amtMatch ? amtMatch[1].replace(/,/g,'') : ''

  // Guess category from text
  const catMap = {
    food:['food','lunch','dinner','breakfast','restaurant','snack','meal','pizza','burger','hotel','chai','coffee'],
    transport:['auto','bus','cab','uber','ola','fuel','petrol','ticket','transport','travel'],
    shopping:['shop','buy','bought','purchase','mall','clothes','amazon','flipkart'],
    bills:['bill','electricity','wifi','internet','mobile','recharge','gas'],
    health:['medicine','doctor','hospital','pharmacy','medical'],
    entertainment:['movie','cinema','game','outing','party'],
    education:['school','college','fee','tuition','book'],
    rent:['rent','house'],
    groceries:['grocery','vegetables','fruits','kirana','supermarket'],
    salary:['salary','stipend','pay','paycheck'],
    freelance:['freelance','project','client'],
  }
  let category = ''
  for (const [cat, words] of Object.entries(catMap)) {
    if (words.some(w => lower.includes(w))) {
      category = cats.find(c => c.toLowerCase() === cat) || cats.find(c => c.toLowerCase().startsWith(cat)) || ''
      break
    }
  }
  if (!category) category = type==='INCOME' ? 'Other Income' : 'Other'

  // Description: strip amount from text
  const description = text.replace(/₹?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:rupees?|rs\.?)?/gi,'').trim()

  return { type, amount, category, description, date: new Date().toISOString().split('T')[0] }
}

export default function VoiceEntry() {
  const userId = localStorage.getItem('userId')
  const [listening,  setListening]  = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsed,     setParsed]     = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState({ text:'', ok:false })
  const [history,    setHistory]    = useState(() => JSON.parse(localStorage.getItem('voiceHistory')||'[]'))
  const recognRef = useRef(null)

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setMsg({ text:'❌ Voice input only works in Chrome. Please use Google Chrome.', ok:false }); return }
    const recog     = new SR()
    recog.lang      = 'en-IN'
    recog.continuous    = false
    recog.interimResults = false
    recog.onstart  = () => setListening(true)
    recog.onend    = () => setListening(false)
    recog.onerror  = () => { setListening(false); setMsg({ text:'❌ Could not hear. Try again in a quiet environment.', ok:false }) }
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setParsed(parseVoice(text))
      setMsg({ text:'', ok:false })
    }
    recog.start()
    recognRef.current = recog
  }

  const stopListening = () => { recognRef.current?.stop(); setListening(false) }

  const saveTransaction = async () => {
    if (!parsed || !parsed.amount) { setMsg({ text:'Amount not detected. Please try again.', ok:false }); return }
    setSaving(true)
    try {
      await addTransaction({
        type:parsed.type, amount:parseFloat(parsed.amount),
        category:parsed.category, description:`${parsed.description} [Voice Entry]`,
        date:parsed.date, userId:Number(userId)
      })
      const entry  = { id:Date.now(), transcript, ...parsed }
      const newHist = [entry, ...history].slice(0,20)
      setHistory(newHist); localStorage.setItem('voiceHistory', JSON.stringify(newHist))
      setMsg({ text:`✅ ${parsed.type==='INCOME'?'Income':'Expense'} of ₹${parsed.amount} added successfully!`, ok:true })
      setTranscript(''); setParsed(null)
    } catch { setMsg({ text:'❌ Failed to save. Please try again.', ok:false }) }
    finally { setSaving(false) }
  }

  const fmt = v => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗣️ Voice Entry</h1>
          <p className="page-sub">Speak your transaction — it gets logged automatically. Chrome only.</p>
        </div>
      </div>

      <div className="chart-card" style={{textAlign:'center',marginBottom:'24px'}}>
        <p style={{fontSize:'14px',color:'var(--text-muted)',marginBottom:'18px'}}>
          Say something like: <em>"Spent 500 rupees on food"</em> or <em>"Received 20000 salary"</em>
        </p>
        <button
          className={`voice-btn ${listening?'voice-btn-active':''}`}
          onClick={listening ? stopListening : startListening}>
          {listening ? '🔴 Listening... (tap to stop)' : '🎙️ Tap to Speak'}
        </button>
        {listening && <div className="voice-wave"><span/><span/><span/><span/><span/></div>}
      </div>

      {transcript && (
        <div className="chart-card" style={{marginBottom:'16px'}}>
          <p className="chart-title">🗣️ You said:</p>
          <p style={{fontStyle:'italic',color:'var(--text)',fontSize:'16px',marginTop:'8px'}}>"{transcript}"</p>
        </div>
      )}

      {parsed && (
        <div className="add-card" style={{marginBottom:'24px'}}>
          <div className="add-header"><h3>✅ Detected Transaction — Review & Confirm</h3></div>
          <div className="add-body">
            {msg.text && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`}>{msg.text}</div>}
            <div className="add-grid">
              <div className="field"><label>Type</label>
                <div className="type-toggle">
                  <button type="button" className={`type-btn ${parsed.type==='INCOME'?'type-inc':''}`}
                    onClick={()=>setParsed(p=>({...p,type:'INCOME'}))}>📈 Income</button>
                  <button type="button" className={`type-btn ${parsed.type==='EXPENSE'?'type-exp':''}`}
                    onClick={()=>setParsed(p=>({...p,type:'EXPENSE'}))}>📉 Expense</button>
                </div>
              </div>
              <div className="field"><label>Amount (₹)</label>
                <input type="number" value={parsed.amount} onChange={e=>setParsed(p=>({...p,amount:e.target.value}))} /></div>
              <div className="field"><label>Category</label>
                <select value={parsed.category} onChange={e=>setParsed(p=>({...p,category:e.target.value}))}>
                  {(parsed.type==='INCOME'?INCOME_CATS:EXPENSE_CATS).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field"><label>Date</label>
                <input type="date" value={parsed.date} max={new Date().toISOString().split('T')[0]}
                  onChange={e=>setParsed(p=>({...p,date:e.target.value}))} /></div>
              <div className="field field-full"><label>Description</label>
                <input type="text" value={parsed.description}
                  onChange={e=>setParsed(p=>({...p,description:e.target.value}))} /></div>
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <button className="btn-primary" style={{maxWidth:'200px'}} onClick={saveTransaction} disabled={saving}>
                {saving?'Saving...':'💾 Confirm & Save'}
              </button>
              <button className="btn-cancel" onClick={()=>{setTranscript('');setParsed(null)}}>✕ Discard</button>
            </div>
          </div>
        </div>
      )}

      {msg.text && !parsed && <div className={`alert ${msg.ok?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg.text}</div>}

      {history.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">🕐 Voice Entry History</h3>
          <div className="recurring-list" style={{marginTop:'12px'}}>
            {history.slice(0,10).map(h => (
              <div key={h.id} className={`recurring-item ${h.type==='INCOME'?'tx-inc':'tx-exp'}`}>
                <div className="recurring-icon">{h.type==='INCOME'?'📈':'📉'}</div>
                <div className="recurring-info">
                  <p className="recurring-name">"{h.transcript}"</p>
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
