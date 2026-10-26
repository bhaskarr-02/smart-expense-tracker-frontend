import { useState } from 'react'

export default function Receipts() {
  const [receipts, setReceipts] = useState(() => JSON.parse(localStorage.getItem('receipts') || '[]'))
  const [preview,  setPreview]  = useState(null)
  const [form,     setForm]     = useState({ title:'', date: new Date().toISOString().split('T')[0], category:'Food', notes:'' })
  const [msg,      setMsg]      = useState('')
  const [viewing,  setViewing]  = useState(null)

  const CATS = ['Food','Transport','Shopping','Bills','Entertainment','Health','Education','Rent','Groceries','Other']

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg('❌ Please upload an image file (JPG, PNG, etc.)'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('❌ File too large. Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    setMsg('')
  }

  const saveReceipt = () => {
    if (!preview) { setMsg('❌ Please upload a receipt image first.'); return }
    if (!form.title.trim()) { setMsg('❌ Please enter a title.'); return }
    const receipt = {
      id: Date.now(),
      ...form,
      image: preview,
      savedAt: new Date().toLocaleString('en-IN')
    }
    const updated = [receipt, ...receipts]
    setReceipts(updated)
    localStorage.setItem('receipts', JSON.stringify(updated))
    setPreview(null)
    setForm({ title:'', date: new Date().toISOString().split('T')[0], category:'Food', notes:'' })
    setMsg('✅ Receipt saved successfully!')
    setTimeout(() => setMsg(''), 3000)
  }

  const deleteReceipt = (id) => {
    if (!window.confirm('Delete this receipt?')) return
    const updated = receipts.filter(r => r.id !== id)
    setReceipts(updated)
    localStorage.setItem('receipts', JSON.stringify(updated))
  }

  const CAT_ICONS = { Food:'🍽️', Transport:'🚗', Shopping:'🛍️', Bills:'💡', Entertainment:'🎬', Health:'🏥', Education:'🎓', Rent:'🏠', Groceries:'🛒', Other:'📦' }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧾 My Receipts</h1>
          <p className="page-sub">Upload and store your bills & receipts safely.</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅')?'alert-ok':'alert-err'}`} style={{marginBottom:'16px'}}>{msg}</div>}

      {/* Upload Card */}
      <div className="add-card">
        <div className="add-header"><h3>📤 Upload New Receipt</h3></div>
        <div className="add-body">
          {/* Drop zone */}
          <label className="receipt-drop-zone">
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFile} />
            {preview ? (
              <div className="receipt-preview-wrap">
                <img src={preview} alt="Receipt preview" className="receipt-preview-img" />
                <button className="receipt-remove-btn" onClick={e => { e.preventDefault(); setPreview(null) }}>✕ Remove</button>
              </div>
            ) : (
              <div className="receipt-drop-content">
                <span style={{fontSize:'48px'}}>📷</span>
                <p className="receipt-drop-title">Click to upload receipt</p>
                <p className="receipt-drop-sub">Supports JPG, PNG, WEBP — Max 5MB</p>
              </div>
            )}
          </label>

          {/* Form */}
          <div className="add-grid" style={{marginTop:'16px'}}>
            <div className="field"><label>Receipt Title</label>
              <input type="text" placeholder="e.g. Grocery bill - DMart" value={form.title}
                onChange={e => setForm(p=>({...p,title:e.target.value}))} /></div>
            <div className="field"><label>Category</label>
              <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select></div>
            <div className="field"><label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} /></div>
            <div className="field field-full"><label>Notes (optional)</label>
              <input type="text" placeholder="Any notes about this receipt..." value={form.notes}
                onChange={e => setForm(p=>({...p,notes:e.target.value}))} /></div>
          </div>
          <button className="btn-primary" style={{maxWidth:'200px'}} onClick={saveReceipt}>💾 Save Receipt</button>
        </div>
      </div>

      {/* Full-screen view modal */}
      {viewing && (
        <div className="receipt-modal-overlay" onClick={() => setViewing(null)}>
          <div className="receipt-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div>
                <p className="receipt-modal-title">{viewing.title}</p>
                <p className="receipt-modal-meta">{CAT_ICONS[viewing.category]} {viewing.category} · {viewing.date}</p>
              </div>
              <button className="receipt-modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <img src={viewing.image} alt={viewing.title} className="receipt-modal-img" />
            {viewing.notes && <p className="receipt-modal-notes">📝 {viewing.notes}</p>}
          </div>
        </div>
      )}

      {/* Receipts Grid */}
      <div style={{marginTop:'24px'}}>
        <h3 className="chart-title">🗂️ Saved Receipts ({receipts.length})</h3>
        {receipts.length === 0 ? (
          <div className="chart-card">
            <p className="no-data">No receipts yet. Upload your first bill above!</p>
          </div>
        ) : (
          <div className="receipts-grid">
            {receipts.map(r => (
              <div key={r.id} className="receipt-card">
                <div className="receipt-card-img-wrap" onClick={() => setViewing(r)}>
                  <img src={r.image} alt={r.title} className="receipt-card-img" />
                  <div className="receipt-card-overlay">👁️ View</div>
                </div>
                <div className="receipt-card-body">
                  <p className="receipt-card-title">{r.title}</p>
                  <p className="receipt-card-meta">{CAT_ICONS[r.category]} {r.category} · {r.date}</p>
                  {r.notes && <p className="receipt-card-notes">{r.notes}</p>}
                  <p className="receipt-card-saved">Saved: {r.savedAt}</p>
                  <button className="btn-del" style={{marginTop:'8px'}} onClick={() => deleteReceipt(r.id)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
