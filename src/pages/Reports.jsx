import { useState, useEffect } from 'react'
import { getTransactions, getSummary } from '../services/ApiService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const PIE_COLORS  = ['#4CAF50','#f44336','#2196F3','#FF9800','#9C27B0','#00BCD4','#FF5722','#8BC34A','#E91E63','#607D8B']
const MOOD_COLORS = { '😊 Happy':'#48BB78','😐 Neutral':'#718096','😞 Sad':'#FC8181','😤 Stressed':'#F6AD55','🎉 Excited':'#F6E05E','😴 Tired':'#90CDF4' }

function Tip({ active, payload, label }) {
  if (!active||!payload?.length) return null
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {payload.map((p,i) => <p key={i} style={{color:p.color}}>{p.name}: ₹{Number(p.value).toLocaleString('en-IN',{minimumFractionDigits:2})}</p>)}
    </div>
  )
}

export default function Reports() {
  const userId   = localStorage.getItem('userId')
  const username = localStorage.getItem('username')
  const [txs,     setTxs]     = useState([])
  const [summary, setSummary] = useState({ income:0, expense:0, balance:0 })
  const [monthly, setMonthly] = useState([])
  const [catData, setCatData] = useState([])
  const [moodData,setMoodData]= useState([])
  const [predict, setPredict] = useState(null)
  const [tab,     setTab]     = useState('bar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTransactions(userId), getSummary(userId)]).then(([tr,sr]) => {
      const data = tr.data; setTxs(data); setSummary(sr.data)
      const map = {}
      data.forEach(t => {
        const m = t.date.substring(0,7)
        if (!map[m]) map[m] = { month:m, income:0, expense:0 }
        if (t.type==='INCOME') map[m].income += Number(t.amount)
        else map[m].expense += Number(t.amount)
      })
      const sorted = Object.values(map).sort((a,b) => a.month.localeCompare(b.month))
      setMonthly(sorted)

      // Simple prediction — average of last 3 months
      if (sorted.length >= 2) {
        const last3 = sorted.slice(-3)
        const avgInc = last3.reduce((s,m)=>s+m.income,0)/last3.length
        const avgExp = last3.reduce((s,m)=>s+m.expense,0)/last3.length
        const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth()+1)
        setPredict({ month: nextDate.toISOString().substring(0,7), income: avgInc.toFixed(0), expense: avgExp.toFixed(0) })
      }

      const cat = {}
      data.filter(t=>t.type==='EXPENSE').forEach(t => { const k=t.category||'Other'; cat[k]=(cat[k]||0)+Number(t.amount) })
      setCatData(Object.entries(cat).map(([name,value])=>({name,value})))

      const moods = {}
      data.forEach(t => {
        const m = (t.description||'').match(/\[Mood:(.*?)\]/)
        if (m) { moods[m[1]] = (moods[m[1]]||0) + Number(t.amount) }
      })
      setMoodData(Object.entries(moods).map(([name,value])=>({name,value})))
    }).catch(console.error).finally(()=>setLoading(false))
  }, [userId])

  const fmt = (v) => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
  const bal = Number(summary.balance||0)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.setTextColor(30,77,140)
    doc.text('Smart Expense Tracker Report', 14, 20)
    doc.setFontSize(11); doc.setTextColor(100)
    doc.text(`User: ${username}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)
    autoTable(doc, {
      startY:40, head:[['Total Income','Total Expense','Net Balance']],
      body:[[`Rs.${fmt(summary.income)}`,`Rs.${fmt(summary.expense)}`,`Rs.${fmt(summary.balance)}`]],
      headStyles:{fillColor:[30,77,140],textColor:255}
    })
    autoTable(doc, {
      startY:doc.lastAutoTable.finalY+10,
      head:[['Date','Type','Category','Description','Amount']],
      body:txs.slice(0,50).map(t=>[t.date,t.type,t.category||'—',(t.description||'').replace(/\[.*?\]/g,'').trim()||'—',`${t.type==='INCOME'?'+':'-'} Rs.${fmt(t.amount)}`]),
      headStyles:{fillColor:[30,77,140],textColor:255}
    })
    doc.save(`SmartTracker_${username}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Smart Expense Tracker Report'],['User: '+username],['Generated: '+new Date().toLocaleDateString('en-IN')],[],
      ['SUMMARY'],['Total Income',`Rs.${fmt(summary.income)}`],['Total Expense',`Rs.${fmt(summary.expense)}`],['Net Balance',`Rs.${fmt(summary.balance)}`]
    ])
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Date','Type','Category','Description','Amount'],
      ...txs.map(t=>[t.date,t.type,t.category||'—',(t.description||'').replace(/\[.*?\]/g,'').trim()||'—',`${t.type==='INCOME'?'+':'-'} Rs.${fmt(t.amount)}`])
    ])
    XLSX.utils.book_append_sheet(wb, ws2, 'Transactions')
    XLSX.writeFile(wb, `SmartTracker_${username}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) return <div className="loader">Loading...</div>

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Reports & Analytics</h1>
          <p className="page-sub">Visual breakdown of your finances</p>
        </div>
        <div className="export-row">
          <button className="btn-export btn-pdf"   onClick={exportPDF}>📄 PDF</button>
          <button className="btn-export btn-excel" onClick={exportExcel}>📊 Excel</button>
        </div>
      </div>

      {/* Prediction box — simple average, no AI label */}
      {predict && (
        <div className="predict-box">
          <span className="predict-icon">🔮</span>
          <div>
            <p className="predict-title">Estimated next month — {predict.month}</p>
            <p className="predict-text">
              Expected Income: <strong className="clr-green">₹{fmt(predict.income)}</strong> &nbsp;|&nbsp;
              Expected Expense: <strong className="clr-red">₹{fmt(predict.expense)}</strong> &nbsp;|&nbsp;
              Predicted Balance: <strong className={Number(predict.income)-Number(predict.expense)>=0?'clr-blue':'clr-orange'}>
                ₹{fmt(Number(predict.income)-Number(predict.expense))}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="rpt-strip">
        {[
          {label:'📈 Income',  val:`₹${fmt(summary.income)}`,  cls:'clr-green'},
          {label:'📉 Expense', val:`₹${fmt(summary.expense)}`, cls:'clr-red'},
          {label:'💰 Balance', val:`₹${fmt(bal)}`,             cls:bal>=0?'clr-blue':'clr-red'},
          {label:'📋 Total',   val:txs.length,                  cls:'clr-blue'},
        ].map(({label,val,cls},i) => (
          <div key={i} className="rpt-strip-item">
            <span className="rpt-strip-label">{label}</span>
            <span className={`rpt-strip-val ${cls}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="tab-row">
        {[['bar','📊 Monthly'],['pie','🥧 Category'],['line','📈 Trend'],['area','📉 Area'],['mood','😊 Mood']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'tab-active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="chart-card">
        {tab==='bar' && (<>
          <h3 className="chart-title">Monthly Income vs Expense</h3>
          {monthly.length===0 ? <p className="no-data">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={monthly} margin={{top:10,right:30,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <Tooltip content={<Tip />} /><Legend />
                <Bar dataKey="income" name="Income" fill="#4CAF50" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Expense" fill="#f44336" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>)}

        {tab==='pie' && (<>
          <h3 className="chart-title">Expense by Category</h3>
          {catData.length===0 ? <p className="no-data">No expense data yet.</p> : (
            <div className="pie-wrap">
              <ResponsiveContainer width="55%" height={340}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" outerRadius={130} dataKey="value"
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {catData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${Number(v).toLocaleString('en-IN',{minimumFractionDigits:2})}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {catData.map((d,i) => (
                  <div className="pie-row" key={i}>
                    <span className="pie-dot" style={{background:PIE_COLORS[i%PIE_COLORS.length]}} />
                    <span className="pie-name">{d.name}</span>
                    <span className="pie-val clr-red">₹{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {tab==='line' && (<>
          <h3 className="chart-title">Income vs Expense Trend</h3>
          {monthly.length===0 ? <p className="no-data">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={monthly} margin={{top:10,right:30,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <Tooltip content={<Tip />} /><Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#4CAF50" strokeWidth={3} dot={{r:5}} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#f44336" strokeWidth={3} dot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>)}

        {tab==='area' && (<>
          <h3 className="chart-title">Cumulative Income vs Expense</h3>
          {monthly.length===0 ? <p className="no-data">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={monthly} margin={{top:10,right:30,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{fontSize:12,fill:'var(--text-muted)'}} />
                <Tooltip content={<Tip />} /><Legend />
                <Area type="monotone" dataKey="income" name="Income" stroke="#4CAF50" fill="rgba(72,187,120,.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f44336" fill="rgba(252,129,129,.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </>)}

        {tab==='mood' && (<>
          <h3 className="chart-title">Spending by Mood</h3>
          {moodData.length===0 ? <p className="no-data">No mood data yet. Select a mood when adding transactions!</p> : (
            <div className="pie-wrap">
              <ResponsiveContainer width="55%" height={300}>
                <PieChart>
                  <Pie data={moodData} cx="50%" cy="50%" outerRadius={120} dataKey="value"
                    label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>
                    {moodData.map((d,i) => <Cell key={i} fill={MOOD_COLORS[d.name]||PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${Number(v).toLocaleString('en-IN',{minimumFractionDigits:2})}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {moodData.sort((a,b)=>b.value-a.value).map((d,i) => (
                  <div className="pie-row" key={i}>
                    <span className="pie-dot" style={{background:MOOD_COLORS[d.name]||PIE_COLORS[i%PIE_COLORS.length]}} />
                    <span className="pie-name">{d.name}</span>
                    <span className="pie-val clr-red">₹{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}
      </div>

      {/* Transactions table */}
      <div className="chart-card" style={{marginTop:'20px'}}>
        <h3 className="chart-title">Recent Transactions</h3>
        <div style={{overflowX:'auto'}}>
          <table className="rpt-table">
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Mood</th><th>Amount</th></tr></thead>
            <tbody>
              {txs.slice(0,20).map(t => {
                const mood   = (t.description||'').match(/\[Mood:(.*?)\]/)
                const member = (t.description||'').match(/\[Member:(.*?)\]/)
                const clean  = (t.description||'').replace(/\[.*?\]/g,'').trim()
                return (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td><span className={`badge ${t.type==='INCOME'?'badge-in':'badge-ex'}`}>{t.type}</span></td>
                    <td>{t.category||'—'}{member&&<span className="member-tag">👤{member[1]}</span>}</td>
                    <td>{clean||'—'}</td>
                    <td>{mood?mood[1].split(' ')[0]:'—'}</td>
                    <td className={t.type==='INCOME'?'clr-green':'clr-red'}>
                      {t.type==='INCOME'?'+':'−'} ₹{fmt(t.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
