import { useState, useEffect, useCallback } from 'react'
import { getTransactions, deleteTransaction, updateTransaction } from '../services/ApiService'

const INCOME_CATS  = ['Salary','Freelance','Business','Investment','Gift','Other Income']
const EXPENSE_CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other']
const TODAY = new Date().toISOString().split('T')[0]

export default function TransactionList({ refresh, onDeleted, onEdited }) {
  const userId = localStorage.getItem('userId')
  const [txs,     setTxs]     = useState([])
  const [shown,   setShown]   = useState([])
  const [filter,  setFilter]  = useState('ALL')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [delId,   setDelId]   = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await getTransactions(userId); setTxs(r.data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [userId, refresh])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let list = [...txs]
    if (filter!=='ALL') list = list.filter(t => t.type===filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.category||'').toLowerCase().includes(q) ||
        (t.description||'').toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      )
    }
    setShown(list)
  }, [txs, filter, search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    setDelId(id)
    try { await deleteTransaction(id); setTxs(p => p.filter(t => t.id!==id)); onDeleted() }
    catch { alert('Delete failed.') }
    finally { setDelId(null) }
  }

  const openEdit = (t) => { setEditing(t.id); setEditForm({...t}) }

  const saveEdit = async () => {
    try {
      await updateTransaction(editing, {
        type: editForm.type, amount: parseFloat(editForm.amount),
        category: editForm.category, description: editForm.description,
        date: editForm.date, userId: Number(userId)
      })
      load(); onEdited(); setEditing(null)
    } catch { alert('Update failed.') }
  }

  const fmt = (v) => Number(v).toLocaleString('en-IN',{minimumFractionDigits:2})

  // Extract mood from description
  const getMood = (desc) => {
    const match = (desc||'').match(/\[Mood:(.*?)\]/)
    return match ? match[1] : ''
  }
  const getMember = (desc) => {
    const match = (desc||'').match(/\[Member:(.*?)\]/)
    return match ? match[1] : ''
  }
  const getCleanDesc = (desc) => (desc||'').replace(/\[Mood:.*?\]/g,'').replace(/\[Member:.*?\]/g,'').replace(/\[.*?\]/g,'').trim()

  return (
    <div className="list-card">
      <div className="list-header">
        <h3>📋 Transaction History</h3>
        <span className="list-count">{shown.length} records</span>
      </div>
      <div className="list-filters">
        <div className="filter-tabs">
          {['ALL','INCOME','EXPENSE'].map(f => (
            <button key={f} className={`filter-tab ${filter===f?'filter-active':''}`} onClick={() => setFilter(f)}>
              {f==='ALL'?'🔄 All':f==='INCOME'?'📈 Income':'📉 Expense'}
            </button>
          ))}
        </div>
        <input className="list-search" type="text" placeholder="🔍 Search..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loader">Loading...</div>
        : shown.length===0 ? (
          <div className="empty-state"><p>🧾</p><p>No transactions found.</p></div>
        ) : (
          <div className="tx-list">
            {shown.map(t => (
              <div key={t.id}>
                {editing===t.id ? (
                  <div className="edit-inline">
                    <div className="add-grid" style={{padding:'14px 24px'}}>
                      <div className="field"><label>Type</label>
                        <div className="type-toggle">
                          <button type="button" className={`type-btn ${editForm.type==='INCOME'?'type-inc':''}`}
                            onClick={() => setEditForm(p=>({...p,type:'INCOME',category:''}))}>📈 Income</button>
                          <button type="button" className={`type-btn ${editForm.type==='EXPENSE'?'type-exp':''}`}
                            onClick={() => setEditForm(p=>({...p,type:'EXPENSE',category:''}))}>📉 Expense</button>
                        </div>
                      </div>
                      <div className="field"><label>Amount</label>
                        <input type="number" value={editForm.amount} onChange={e => setEditForm(p=>({...p,amount:e.target.value}))} /></div>
                      <div className="field"><label>Category</label>
                        <select value={editForm.category||''} onChange={e => setEditForm(p=>({...p,category:e.target.value}))}>
                          {(editForm.type==='INCOME'?INCOME_CATS:EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                        </select></div>
                      <div className="field"><label>Date</label>
                        <input type="date" value={editForm.date} max={TODAY} onChange={e => setEditForm(p=>({...p,date:e.target.value}))} /></div>
                      <div className="field field-full"><label>Description</label>
                        <input type="text" value={getCleanDesc(editForm.description)} onChange={e => setEditForm(p=>({...p,description:e.target.value}))} /></div>
                    </div>
                    <div style={{display:'flex',gap:'10px',padding:'0 24px 16px'}}>
                      <button className="btn-primary" style={{width:'auto',padding:'8px 24px',marginTop:0}} onClick={saveEdit}>💾 Save</button>
                      <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={`tx-item ${t.type==='INCOME'?'tx-inc':'tx-exp'}`}>
                    <span className="tx-icon">{t.type==='INCOME'?'📈':'📉'}</span>
                    <div className="tx-info">
                      <p className="tx-cat">{t.category||'Uncategorized'}
                        {getMember(t.description) && <span className="member-tag">👤{getMember(t.description)}</span>}
                      </p>
                      <p className="tx-desc">{getCleanDesc(t.description)||'—'}
                        {getMood(t.description) && <span className="mood-tag">{getMood(t.description).split(' ')[0]}</span>}
                      </p>
                    </div>
                    <span className="tx-date">{t.date}</span>
                    <div className="tx-right">
                      <p className={`tx-amount ${t.type==='INCOME'?'clr-green':'clr-red'}`}>
                        {t.type==='INCOME'?'+':'−'} ₹{fmt(t.amount)}
                      </p>
                      <span className={`badge ${t.type==='INCOME'?'badge-in':'badge-ex'}`}>{t.type}</span>
                    </div>
                    <div className="tx-actions">
                      <button className="btn-edit" onClick={() => openEdit(t)}>✏️</button>
                      <button className="btn-del" onClick={() => handleDelete(t.id)} disabled={delId===t.id}>
                        {delId===t.id?'...':'🗑️'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
