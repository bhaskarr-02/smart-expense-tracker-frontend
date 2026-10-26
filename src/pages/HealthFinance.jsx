import { useState, useEffect } from 'react'
import { getTransactions, getSummary } from '../services/ApiService'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const HEALTHY_CATS     = ['Health','Education']
const UNHEALTHY_CATS   = ['Entertainment']
const HEALTHY_KW       = ['gym','yoga','medicine','doctor','hospital','fruits','vegetables','organic','protein','vitamin','clinic','pharmacy','salad','exercise','fitness']
const UNHEALTHY_KW     = ['pizza','burger','alcohol','beer','wine','cigarette','tobacco','junk','fried','chips','cola','soda','gambling']
const PIE_COLORS       = ['#48BB78','#FC8181','#A0AEC0']

function classify(t) {
  const desc = (t.description||'').toLowerCase()
  const cat  = (t.category||'').toLowerCase()
  if (HEALTHY_CATS.map(c=>c.toLowerCase()).includes(cat)) return 'healthy'
  if (UNHEALTHY_CATS.map(c=>c.toLowerCase()).includes(cat)) return 'unhealthy'
  if (HEALTHY_KW.some(k=>desc.includes(k)))   return 'healthy'
  if (UNHEALTHY_KW.some(k=>desc.includes(k))) return 'unhealthy'
  return 'neutral'
}

export default function HealthFinance() {
  const userId = localStorage.getItem('userId')
  const [txs,     setTxs]     = useState([])
  const [summary, setSummary] = useState({ income:0, expense:0, balance:0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTransactions(userId), getSummary(userId)]).then(([tr,sr]) => {
      setTxs(tr.data); setSummary(sr.data)
    }).catch(console.error).finally(()=>setLoading(false))
  }, [userId])

  const expenses     = txs.filter(t=>t.type==='EXPENSE')
  const healthy      = expenses.filter(t=>classify(t)==='healthy')
  const unhealthy    = expenses.filter(t=>classify(t)==='unhealthy')
  const neutral      = expenses.filter(t=>classify(t)==='neutral')
  const healthyAmt   = healthy.reduce((s,t)=>s+Number(t.amount),0)
  const unhealthyAmt = unhealthy.reduce((s,t)=>s+Number(t.amount),0)
  const neutralAmt   = neutral.reduce((s,t)=>s+Number(t.amount),0)
  const totalExp     = healthyAmt + unhealthyAmt + neutralAmt
  const score        = totalExp>0 ? Math.min(100,Math.max(0,Math.round(((healthyAmt-unhealthyAmt*1.5)/totalExp)*100+50))) : 50
  const scoreColor   = score>=70?'#48BB78':score>=40?'#F6AD55':'#FC8181'
  const scoreLabel   = score>=70?'Excellent 🌟':score>=40?'Fair 👍':'Needs Work ⚠️'

  const bal = Number(summary.balance||0)
  const inc = Number(summary.income ||0)
  const exp = Number(summary.expense||0)
  const fmt = v => Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

  const pieData = [
    { name:'Healthy',   value:healthyAmt   },
    { name:'Unhealthy', value:unhealthyAmt },
    { name:'Neutral',   value:neutralAmt   },
  ].filter(d=>d.value>0)

  // Smart tips based on data (no AI)
  const tips = []
  if (unhealthyAmt > healthyAmt) tips.push(`🍕 You spend more on unhealthy items (₹${fmt(unhealthyAmt)}) than healthy ones (₹${fmt(healthyAmt)}). Try shifting some entertainment budget to health.`)
  if (score < 40) tips.push(`⚠️ Your health-finance score is ${score}/100. Reduce junk food and entertainment expenses.`)
  if (healthyAmt === 0) tips.push(`💊 No health-related expenses detected. Consider allocating budget for health, exercise, or preventive care.`)
  if (bal < exp * 0.1 && inc > 0) tips.push(`🚨 Your balance is critically low. Pause non-essential spending until your income improves.`)
  if (score >= 70) tips.push(`🌟 Great job! Your spending habits are healthy. Keep maintaining this balance.`)

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div><h1 className="page-title">💊 Health-Finance Tracker</h1>
          <p className="page-sub">Understand how your spending affects your wellbeing</p></div>
      </div>

      {loading ? <div className="loader">Loading...</div> : (
        <>
          {/* Score Card */}
          <div className="chart-card" style={{textAlign:'center',marginBottom:'24px'}}>
            <p className="chart-title">Your Health-Finance Score</p>
            <div style={{fontSize:'72px',fontWeight:900,color:scoreColor,margin:'16px 0 8px'}}>{score}</div>
            <p style={{fontSize:'20px',fontWeight:700,color:scoreColor}}>{scoreLabel}</p>
            <p style={{fontSize:'13px',color:'var(--text-muted)',marginTop:'8px'}}>
              Based on your spending patterns — healthy vs unhealthy category classification
            </p>
          </div>

          {/* Summary */}
          <div className="summary-row" style={{marginBottom:'24px'}}>
            <div className="s-card s-income"><span className="s-icon">💚</span>
              <div><p className="s-label">Healthy Spend</p><p className="s-value clr-green">₹{fmt(healthyAmt)}</p></div></div>
            <div className="s-card s-expense"><span className="s-icon">❤️</span>
              <div><p className="s-label">Unhealthy Spend</p><p className="s-value clr-red">₹{fmt(unhealthyAmt)}</p></div></div>
            <div className="s-card s-bal-pos"><span className="s-icon">⚪</span>
              <div><p className="s-label">Neutral Spend</p><p className="s-value clr-blue">₹{fmt(neutralAmt)}</p></div></div>
          </div>

          {/* Pie Chart */}
          {pieData.length>0&&(
            <div className="chart-card" style={{marginBottom:'24px'}}>
              <h3 className="chart-title">Spending Classification</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${fmt(v)}`}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Smart Tips */}
          {tips.length>0&&(
            <div className="chart-card" style={{marginBottom:'24px'}}>
              <h3 className="chart-title">💡 Smart Tips for You</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'12px'}}>
                {tips.map((tip,i)=>(
                  <div key={i} style={{padding:'12px 16px',borderRadius:'10px',background:'var(--card2)',border:'1px solid var(--border)',fontSize:'14px',lineHeight:1.6,color:'var(--text)'}}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction breakdown */}
          {(healthy.length>0||unhealthy.length>0)&&(
            <div className="chart-card">
              <h3 className="chart-title">Transaction Breakdown</h3>
              {[{label:'💚 Healthy',list:healthy,cls:'clr-green'},{label:'❤️ Unhealthy',list:unhealthy,cls:'clr-red'}].map(({label,list,cls})=>
                list.length>0&&(
                  <div key={label} style={{marginTop:'16px'}}>
                    <p style={{fontWeight:700,marginBottom:'8px'}}>{label} ({list.length} transactions)</p>
                    <div className="recurring-list">
                      {list.slice(0,5).map(t=>(
                        <div key={t.id} className="recurring-item tx-exp">
                          <div className="recurring-icon">💊</div>
                          <div className="recurring-info">
                            <p className="recurring-name">{t.description||t.category}</p>
                            <p className="recurring-meta">{t.category} · {t.date}</p>
                          </div>
                          <p className={cls}>₹{fmt(t.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
